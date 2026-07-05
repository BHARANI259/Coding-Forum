package com.kec.codingforum.event.dto;

import jakarta.validation.constraints.NotBlank;
import java.util.List;

public record CreateProblemStatementRequest(
        @NotBlank String title,
        @NotBlank String description,
        String referenceLink,
        Boolean active,
        List<ProblemStatementLinkDto> links
) {
}
