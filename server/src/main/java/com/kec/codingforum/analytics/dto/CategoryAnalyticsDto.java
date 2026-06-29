package com.kec.codingforum.analytics.dto;

public record CategoryAnalyticsDto(
        Long categoryId,
        String categoryName,
        Integer totalPoints,
        Integer totalResults,
        Integer participantCount
) {
}
