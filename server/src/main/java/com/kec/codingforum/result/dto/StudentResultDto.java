package com.kec.codingforum.result.dto;

import java.time.LocalDateTime;

public record StudentResultDto(
        Long resultId,
        Long eventId,
        String eventTitle,
        String categoryName,
        String eventType,
        String teamName,
        String resultType,
        Integer pointsEarned,
        LocalDateTime declaredAt
) {
}
