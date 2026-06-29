package com.kec.codingforum.result.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record DeclareTeamResultRequest(
        @NotNull Long teamId,
        @NotBlank String resultType
) {
}
