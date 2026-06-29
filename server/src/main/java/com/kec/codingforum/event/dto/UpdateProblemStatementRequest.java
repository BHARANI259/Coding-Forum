package com.kec.codingforum.event.dto;

import jakarta.validation.constraints.NotBlank;

public record UpdateProblemStatementRequest(
        @NotBlank String title,
        String description,
        String referenceLink,
        Boolean active
) {
}
