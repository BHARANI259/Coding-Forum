package com.kec.codingforum.admin.dto;

public record CreatedStudentResponse(
        StudentDto student,
        String temporaryPassword
) {
}
