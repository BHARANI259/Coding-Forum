package com.kec.codingforum.team.dto;

public record TeamEventSummaryDto(
        Long id,
        String title,
        String eventType,
        String status,
        boolean registrationOpen,
        Integer minTeamSize,
        Integer maxTeamSize
) {
}
