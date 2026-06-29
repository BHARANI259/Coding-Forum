package com.kec.codingforum.admin.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateDepartmentRequest(
        @NotBlank @Size(max = 30) String code,
        @NotBlank @Size(max = 150) String name
) {
}
