package com.kec.codingforum.event.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record DeclareRoundTeamResultRequest(
        @NotNull Long teamId,
        @NotBlank String status
) {
}
