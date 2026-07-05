package com.kec.codingforum.analytics.dto;

public record DepartmentPointsChartDto(
        Long departmentId,
        String departmentCode,
        String departmentName,
        Long totalPoints,
        Long wins,
        Long runnerUps,
        Long secondRunnerUps
) {
}
