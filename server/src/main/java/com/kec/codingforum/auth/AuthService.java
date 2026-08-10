package com.kec.codingforum.auth;

import com.kec.codingforum.audit.AuditService;
import com.kec.codingforum.security.CustomUserPrincipal;
import com.kec.codingforum.security.JwtService;
import com.kec.codingforum.security.SecurityUtils;
import com.kec.codingforum.user.User;
import com.kec.codingforum.user.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class AuthService {

    private final UserRepository users;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuditService auditService;
    private final int lockoutMaxAttempts;
    private final long lockoutMinutes;

    public AuthService(
            UserRepository users,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            AuditService auditService,
            @Value("${app.security.account-lockout.max-failed-attempts:5}") int lockoutMaxAttempts,
            @Value("${app.security.account-lockout.lock-minutes:15}") long lockoutMinutes
    ) {
        this.users = users;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.auditService = auditService;
        this.lockoutMaxAttempts = lockoutMaxAttempts;
        this.lockoutMinutes = lockoutMinutes;
    }

    @Transactional
    public LoginResponse login(LoginRequest request, UserRole expectedRole, String portalName) {
        String email = request.email().trim();
        User user = users.findByEmailIgnoreCase(email).orElse(null);
        if (user == null) {
            auditService.record("LOGIN_FAILURE", "USER", email, AuditService.FAILURE, "Unknown email for " + portalName + " portal.");
            throw new AuthException("Invalid " + portalName + " login credentials.");
        }

        if (!user.isActive()) {
            auditService.recordForUser(user, "LOGIN_FAILURE", "USER", user.getId(), AuditService.FAILURE, "Disabled account attempted " + portalName + " login.");
            throw new AuthException("This account is disabled.");
        }
        if (isLocked(user)) {
            auditService.recordForUser(user, "LOGIN_DENIED_LOCKED", "USER", user.getId(), AuditService.DENIED, "Locked account attempted " + portalName + " login.");
            throw new AuthException("This account is temporarily locked due to repeated failed login attempts. Please try again later.");
        }
        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            registerFailedLogin(user, portalName);
            throw new AuthException("Invalid " + portalName + " login credentials.");
        }
        if (!expectedRole.name().equals(user.getRole())) {
            registerFailedLogin(user, portalName);
            auditService.recordForUser(user, "LOGIN_ROLE_MISMATCH", "USER", user.getId(), AuditService.DENIED, "Account attempted to use the wrong portal.");
            throw new AuthException("This account is not allowed to use the " + portalName + " portal.");
        }
        validateProfileLink(user, expectedRole);
        user.setFailedLoginAttempts(0);
        user.setLockedUntil(null);
        user.setLastLoginAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());

        CustomUserPrincipal principal = new CustomUserPrincipal(user);
        auditService.recordForUser(user, "LOGIN_SUCCESS", "USER", user.getId(), AuditService.SUCCESS, portalName + " login succeeded.");
        return toLoginResponse(principal, jwtService.createToken(principal));
    }

    @Transactional(readOnly = true)
    public CurrentUserResponse me() {
        return toCurrentUserResponse(SecurityUtils.currentPrincipal());
    }

    @Transactional
    public CurrentUserResponse changePassword(ChangePasswordRequest request) {
        CustomUserPrincipal principal = SecurityUtils.currentPrincipal();
        User user = users.findById(principal.getUserId())
                .orElseThrow(() -> new AuthException("Authentication is required."));

        if (!passwordEncoder.matches(request.oldPassword(), user.getPasswordHash())) {
            auditService.recordForUser(user, "PASSWORD_CHANGE_FAILURE", "USER", user.getId(), AuditService.FAILURE, "Old password was incorrect.");
            throw new AuthException("Old password is incorrect.");
        }

        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        user.setFirstLoginRequired(false);
        user.setUpdatedAt(LocalDateTime.now());
        User savedUser = users.save(user);
        auditService.recordForUser(savedUser, "PASSWORD_CHANGED", "USER", savedUser.getId(), AuditService.SUCCESS, "Password changed successfully.");

        return toCurrentUserResponse(new CustomUserPrincipal(savedUser));
    }

    private boolean isLocked(User user) {
        return user.getLockedUntil() != null && user.getLockedUntil().isAfter(LocalDateTime.now());
    }

    private void registerFailedLogin(User user, String portalName) {
        int failedAttempts = user.getFailedLoginAttempts() + 1;
        user.setFailedLoginAttempts(failedAttempts);
        if (failedAttempts >= lockoutMaxAttempts) {
            user.setLockedUntil(LocalDateTime.now().plusMinutes(lockoutMinutes));
            auditService.recordForUser(user, "ACCOUNT_LOCKED", "USER", user.getId(), AuditService.DENIED, "Account locked after repeated failed " + portalName + " login attempts.");
        } else {
            auditService.recordForUser(user, "LOGIN_FAILURE", "USER", user.getId(), AuditService.FAILURE, "Invalid " + portalName + " credentials.");
        }
        user.setUpdatedAt(LocalDateTime.now());
        users.save(user);
    }

    private void validateProfileLink(User user, UserRole expectedRole) {
        if (expectedRole == UserRole.STUDENT && (user.getStudent() == null || user.getFaculty() != null)) {
            throw new AuthException("Student account profile is not configured correctly.");
        }
        if (expectedRole == UserRole.FACULTY && (user.getFaculty() == null || user.getStudent() != null)) {
            throw new AuthException("Faculty account profile is not configured correctly.");
        }
        if (expectedRole == UserRole.SUPER_ADMIN && (user.getStudent() != null || user.getFaculty() != null)) {
            throw new AuthException("Admin account profile is not configured correctly.");
        }
    }

    private LoginResponse toLoginResponse(CustomUserPrincipal principal, String token) {
        return new LoginResponse(
                token,
                principal.getUserId(),
                principal.getStudentId(),
                principal.getFacultyId(),
                principal.getEmail(),
                principal.getName(),
                principal.getRole(),
                principal.isFirstLoginRequired(),
                principal.getDeptMonitoringEnabled()
        );
    }

    private CurrentUserResponse toCurrentUserResponse(CustomUserPrincipal principal) {
        return new CurrentUserResponse(
                principal.getUserId(),
                principal.getStudentId(),
                principal.getFacultyId(),
                principal.getEmail(),
                principal.getName(),
                principal.getRole(),
                principal.isFirstLoginRequired(),
                principal.getDeptMonitoringEnabled()
        );
    }
}
