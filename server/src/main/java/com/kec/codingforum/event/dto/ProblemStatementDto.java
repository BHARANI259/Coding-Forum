package com.kec.codingforum.event.dto;

import java.time.LocalDateTime;
import java.util.List;

public record ProblemStatementDto(
        Long id,
        Long eventId,
        String title,
        String description,
        String referenceLink,
        List<ProblemStatementLinkDto> links,
        boolean active,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
