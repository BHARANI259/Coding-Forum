package com.kec.codingforum.admin.dto;

public record CreatedFacultyResponse(
        Long id,
        String facultyCode,
        String name,
        String email,
        String temporaryPassword
) {
}
