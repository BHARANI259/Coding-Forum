package com.kec.codingforum.registration.dto;

import java.time.LocalDateTime;

public record RegistrationDto(
        Long id,
        Long eventId,
        String eventTitle,
        String eventType,
        String categoryName,
        Long studentId,
        String studentName,
        String registerNumber,
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
