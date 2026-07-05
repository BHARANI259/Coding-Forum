package com.kec.codingforum.analytics.dto;

public record EventEngagementDto(
        Long eventId,
        String eventTitle,
        String categoryName,
        String eventType,
        Long registrationCount,
        Long teamCount,
        Boolean resultsPublished
) {
}
