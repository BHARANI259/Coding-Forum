package com.kec.codingforum.analytics.dto;

public record TopDepartmentAnalyticsDto(
        int rank,
        Long departmentId,
        String departmentCode,
        String departmentName,
        Long totalPoints,
        Long participationCount,
        Long wins
) {
}
