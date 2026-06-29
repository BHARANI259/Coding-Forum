package com.kec.codingforum.event.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;

public record CreateEventRoundRequest(
        @NotBlank String roundName,
        @NotNull Integer roundOrder,
        Boolean finalRound,
        String description,
        LocalDateTime scheduledAt
) {
}
