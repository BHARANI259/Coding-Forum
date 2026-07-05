package com.kec.codingforum.analytics.dto;

import java.util.List;

public record AdminAnalyticsFiltersDto(
        List<AnalyticsFilterOptionDto> departments,
        List<AnalyticsFilterOptionDto> categories,
        List<String> technicalAreas,
        List<String> eventStatuses
) {
}
