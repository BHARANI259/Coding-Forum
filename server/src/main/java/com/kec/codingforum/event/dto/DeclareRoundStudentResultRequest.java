package com.kec.codingforum.event.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record DeclareRoundStudentResultRequest(
        @NotNull Long studentId,
        @NotBlank String status
) {
}
