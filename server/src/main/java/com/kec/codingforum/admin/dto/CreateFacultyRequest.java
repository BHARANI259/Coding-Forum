package com.kec.codingforum.admin.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateFacultyRequest(
        @Size(max = 50) String facultyCode,
        @NotBlank @Size(max = 150) String name,
        @NotBlank @Email @Size(max = 150) String email,
        @NotNull Long departmentId,
        boolean deptMonitoringEnabled
) {
}
