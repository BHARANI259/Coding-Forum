package com.kec.codingforum.event.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;
import java.util.List;

public record UpdateEventRequest(
        @NotBlank String title,
        String description,
        @NotNull Long categoryId,
        @NotBlank String eventType,
        String venue,
        LocalDateTime startDatetime,
        LocalDateTime endDatetime,
        boolean registrationOpen,
        LocalDateTime registrationStart,
        LocalDateTime registrationEnd,
        Integer minTeamSize,
        Integer maxTeamSize,
        Integer maxParticipants,
        Integer maxTeams,
        boolean placementWillingOnly,
        boolean mandatoryEvent,
        String status,
        List<Long> allowedDepartmentIds,
        List<Integer> allowedYears,
        List<String> allowedSections,
        List<String> allowedTechnicalAreas,
        List<Long> inchargeFacultyIds
) {
}
