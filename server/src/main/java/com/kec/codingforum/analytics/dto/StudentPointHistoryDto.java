package com.kec.codingforum.analytics.dto;

import java.time.LocalDateTime;

public record StudentPointHistoryDto(
        Long id,
        Long eventId,
        String eventTitle,
        Long categoryId,
        String categoryName,
        String pointType,
        Integer points,
        String reason,
        LocalDateTime createdAt
) {
}
