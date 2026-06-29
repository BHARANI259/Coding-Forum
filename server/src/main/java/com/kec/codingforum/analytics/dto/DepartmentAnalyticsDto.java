package com.kec.codingforum.analytics.dto;

import java.util.List;

public record DepartmentAnalyticsDto(
        Long departmentId,
        String departmentCode,
        String departmentName,
        Integer totalPoints,
        Long totalStudents,
        Long activeStudents,
        Long totalEventParticipations,
        Double averageParticipationPerStudent,
        Integer winsCount,
        List<CategoryPointSummaryDto> categoryWisePoints
) {
}
