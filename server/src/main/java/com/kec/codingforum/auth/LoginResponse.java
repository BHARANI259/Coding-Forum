package com.kec.codingforum.auth;

public record LoginResponse(
        String token,
        Long userId,
        Long studentId,
        Long facultyId,
        String email,
        String name,
        String role,
        boolean firstLoginRequired,
        Boolean deptMonitoringEnabled
) {
}
