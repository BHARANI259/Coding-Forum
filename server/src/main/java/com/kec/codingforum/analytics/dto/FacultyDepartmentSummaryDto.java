package com.kec.codingforum.analytics.dto;

public record FacultyDepartmentSummaryDto(
        Long departmentId,
        String departmentCode,
        String departmentName,
        Long departmentStudents,
        Integer departmentTotalPoints,
        Long departmentParticipations
) {
}
