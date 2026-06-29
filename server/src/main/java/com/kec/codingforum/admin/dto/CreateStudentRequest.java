package com.kec.codingforum.admin.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateStudentRequest(
        @NotBlank @Size(max = 50) String registerNumber,
        @NotBlank @Size(max = 150) String name,
        @NotBlank @Email @Size(max = 150) String email,
        @NotNull Long departmentId,
        @NotNull @Min(1) @Max(4) Integer year,
        @Size(max = 20) String section,
        String technicalArea,
        boolean placementWilling
) {
}
