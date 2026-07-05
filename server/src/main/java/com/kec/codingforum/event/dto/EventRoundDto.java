package com.kec.codingforum.event.dto;

import java.time.LocalDateTime;

public record EventRoundDto(
        Long id,
        Long eventId,
        String roundName,
        Integer roundOrder,
        String status,
        boolean finalRound,
        String description,
        LocalDateTime scheduledAt,
        boolean resultPublished,
        LocalDateTime resultPublishedAt
) {
}
