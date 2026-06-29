package com.kec.codingforum.security;

import com.kec.codingforum.auth.AuthException;
import com.kec.codingforum.auth.UserRole;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

public final class SecurityUtils {

    private SecurityUtils() {
    }

    public static Long getCurrentUserId() {
        return currentPrincipal().getUserId();
    }

    public static Long getCurrentStudentId() {
        return currentPrincipal().getStudentId();
    }

    public static Long getCurrentFacultyId() {
        return currentPrincipal().getFacultyId();
    }

    public static String getCurrentRole() {
        return currentPrincipal().getRole();
    }

    public static void requireStudent() {
        requireRole(UserRole.STUDENT);
    }

    public static void requireFaculty() {
        requireRole(UserRole.FACULTY);
    }

    public static void requireSuperAdmin() {
        requireRole(UserRole.SUPER_ADMIN);
    }

    public static CustomUserPrincipal currentPrincipal() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof CustomUserPrincipal principal)) {
            throw new AuthException("Authentication is required.");
        }
        return principal;
    }

    private static void requireRole(UserRole role) {
        if (!role.name().equals(getCurrentRole())) {
            throw new AuthException("This account is not allowed to use this portal.");
        }
    }
}

