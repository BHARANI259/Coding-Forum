package com.kec.codingforum.analytics.dto;

public record DepartmentParticipationChartDto(
        Long departmentId,
        String departmentCode,
        String departmentName,
        Long totalRegistrations,
        Long uniqueStudentsParticipated
) {
}
