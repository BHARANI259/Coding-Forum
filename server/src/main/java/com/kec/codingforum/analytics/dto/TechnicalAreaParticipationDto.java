package com.kec.codingforum.analytics.dto;

public record TechnicalAreaParticipationDto(
        String technicalArea,
        Long registrationCount,
        Long uniqueStudentsParticipated
) {
}
