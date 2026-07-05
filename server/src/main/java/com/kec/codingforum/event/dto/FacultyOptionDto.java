package com.kec.codingforum.event.dto;

public record FacultyOptionDto(
        Long facultyId,
        String facultyName,
        String facultyCode,
        String email,
        String departmentCode,
        String departmentName
) {
}
