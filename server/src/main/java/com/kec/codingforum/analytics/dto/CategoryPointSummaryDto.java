package com.kec.codingforum.analytics.dto;

public record CategoryPointSummaryDto(
        Long categoryId,
        String categoryName,
        Integer totalPoints,
        Integer eventsParticipated
) {
}
