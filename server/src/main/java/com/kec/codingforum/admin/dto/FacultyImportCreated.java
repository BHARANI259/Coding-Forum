package com.kec.codingforum.admin.dto;

public record FacultyImportCreated(
        String facultyCode,
        String email,
        String temporaryPassword
) {
}
