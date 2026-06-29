package com.kec.codingforum.result.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record DeclareIndividualResultRequest(
        @NotNull Long studentId,
        @NotBlank String resultType
) {
}
