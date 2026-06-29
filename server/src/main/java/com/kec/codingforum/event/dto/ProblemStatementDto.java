package com.kec.codingforum.event.dto;

import java.time.LocalDateTime;

public record ProblemStatementDto(
        Long id,
        Long eventId,
        String title,
        String description,
        String referenceLink,
        boolean active,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
