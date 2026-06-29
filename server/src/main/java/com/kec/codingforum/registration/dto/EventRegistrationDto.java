package com.kec.codingforum.registration.dto;

import java.time.LocalDateTime;

public record EventRegistrationDto(
        Long id,
        Long studentId,
        String studentName,
        String registerNumber,
        String email,
        String departmentCode,
        Long teamId,
        String teamName,
        String teamCode,
        String registrationType,
        String status,
        LocalDateTime registeredAt,
        Long problemStatementId,
        String problemStatementTitle
) {
}
