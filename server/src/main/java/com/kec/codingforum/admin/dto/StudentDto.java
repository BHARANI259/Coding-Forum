package com.kec.codingforum.admin.dto;

public record StudentDto(
        Long id,
        String registerNumber,
        String name,
        String email,
        DepartmentSummary department,
        Integer year,
        String section,
        String technicalArea,
        boolean placementWilling,
        boolean active,
        Long linkedUserId
) {
}
