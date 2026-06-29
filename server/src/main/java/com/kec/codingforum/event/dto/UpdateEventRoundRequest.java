package com.kec.codingforum.event.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;

public record UpdateEventRoundRequest(
        @NotBlank String roundName,
        @NotNull Integer roundOrder,
        Boolean finalRound,
        String description,
        LocalDateTime scheduledAt
) {
}
