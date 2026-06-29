package com.kec.codingforum.admin.dto;

public record FacultyDto(
        Long id,
        String facultyCode,
        String name,
        String email,
        DepartmentSummary department,
        boolean deptMonitoringEnabled,
        boolean active,
        Long linkedUserId
) {
}
