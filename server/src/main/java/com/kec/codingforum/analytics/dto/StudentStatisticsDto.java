package com.kec.codingforum.analytics.dto;

import java.util.List;

public record StudentStatisticsDto(
        Long studentId,
        String studentName,
        String registerNumber,
        String departmentCode,
        Integer totalPoints,
        Integer totalEventsRegistered,
        Integer totalResultsDeclared,
        Integer winsCount,
        Integer runnerUpCount,
        Integer secondRunnerUpCount,
        Integer participationCount,
        List<CategoryPointSummaryDto> categoryWisePoints
) {
}
