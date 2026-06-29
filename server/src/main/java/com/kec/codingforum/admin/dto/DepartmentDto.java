package com.kec.codingforum.admin.dto;

public record DepartmentDto(
        Long id,
        String code,
        String name,
        boolean active
) {
}
