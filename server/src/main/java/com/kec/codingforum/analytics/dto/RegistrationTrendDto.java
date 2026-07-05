package com.kec.codingforum.analytics.dto;

public record RegistrationTrendDto(
        String period,
        Long registrationCount
) {
}
