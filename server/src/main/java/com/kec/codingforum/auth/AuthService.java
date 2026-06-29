package com.kec.codingforum.auth;

import com.kec.codingforum.security.CustomUserPrincipal;
import com.kec.codingforum.security.JwtService;
import com.kec.codingforum.security.SecurityUtils;
import com.kec.codingforum.user.User;
import com.kec.codingforum.user.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class AuthService {

    private final UserRepository users;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(UserRepository users, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.users = users;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @Transactional(readOnly = true)
    public LoginResponse login(LoginRequest request, UserRole expectedRole, String portalName) {
        User user = users.findByEmailIgnoreCase(request.email().trim())
                .orElseThrow(() -> new AuthException("Invalid " + portalName + " login credentials."));

        if (!user.isActive()) {
            throw new AuthException("This account is disabled.");
        }
        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new AuthException("Invalid " + portalName + " login credentials.");
        }
        if (!expectedRole.name().equals(user.getRole())) {
            throw new AuthException("This account is not allowed to use the " + portalName + " portal.");
        }
        validateProfileLink(user, expectedRole);

        CustomUserPrincipal principal = new CustomUserPrincipal(user);
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
            throw new AuthException("Old password is incorrect.");
        }

        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        user.setFirstLoginRequired(false);
        user.setUpdatedAt(LocalDateTime.now());
        User savedUser = users.save(user);

        return toCurrentUserResponse(new CustomUserPrincipal(savedUser));
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
