package com.kec.codingforum.event.dto;

public record ProblemStatementLinkDto(
        Long id,
        String label,
        String url,
        Integer displayOrder
) {
}
