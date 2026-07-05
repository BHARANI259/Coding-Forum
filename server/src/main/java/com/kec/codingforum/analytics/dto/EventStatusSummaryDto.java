package com.kec.codingforum.analytics.dto;

public record EventStatusSummaryDto(
        String status,
        Long count
) {
}
