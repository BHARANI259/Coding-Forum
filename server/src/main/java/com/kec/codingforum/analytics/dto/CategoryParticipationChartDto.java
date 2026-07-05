package com.kec.codingforum.analytics.dto;

public record CategoryParticipationChartDto(
        Long categoryId,
        String categoryName,
        Long registrationCount,
        Long uniqueStudentsParticipated
) {
}
