package com.kec.codingforum.registration.dto;

import java.time.LocalDateTime;

public record MyRegistrationDto(
        Long id,
        Long eventId,
        String eventTitle,
        String categoryName,
        String eventType,
        String teamName,
        String registrationType,
        String status,
        LocalDateTime registeredAt,
        Long problemStatementId,
        String problemStatementTitle
) {
}
