package com.kec.codingforum.security;

import com.kec.codingforum.user.User;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;

public class CustomUserPrincipal implements UserDetails {

    private final Long userId;
    private final Long studentId;
    private final Long facultyId;
    private final String email;
    private final String name;
    private final String passwordHash;
    private final String role;
    private final boolean active;
    private final boolean firstLoginRequired;
    private final Boolean deptMonitoringEnabled;

    public CustomUserPrincipal(User user) {
        this.userId = user.getId();
        this.studentId = user.getStudent() == null ? null : user.getStudent().getId();
        this.facultyId = user.getFaculty() == null ? null : user.getFaculty().getId();
        this.email = user.getEmail();
        this.name = resolveName(user);
        this.passwordHash = user.getPasswordHash();
        this.role = user.getRole();
        this.active = user.isActive();
        this.firstLoginRequired = user.isFirstLoginRequired();
        this.deptMonitoringEnabled = user.getFaculty() == null ? null : user.getFaculty().isDeptMonitoringEnabled();
    }

    public Long getUserId() {
        return userId;
    }

    public Long getStudentId() {
        return studentId;
    }

    public Long getFacultyId() {
        return facultyId;
    }

    public String getEmail() {
        return email;
    }

    public String getName() {
        return name;
    }

    public String getRole() {
        return role;
    }

    public boolean isFirstLoginRequired() {
        return firstLoginRequired;
    }

    public Boolean getDeptMonitoringEnabled() {
        return deptMonitoringEnabled;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + role));
    }

    @Override
    public String getPassword() {
        return passwordHash;
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public boolean isEnabled() {
        return active;
    }

    private String resolveName(User user) {
        if (user.getStudent() != null) {
            return user.getStudent().getName();
        }
        if (user.getFaculty() != null) {
            return user.getFaculty().getName();
        }
        return "SuperAdmin";
    }
}
