package com.kec.codingforum.event.dto;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

public record EventListItemDto(
        Long id,
        String title,
        EventCategoryDto category,
        String eventType,
        String venue,
        LocalDateTime startDatetime,
        LocalDateTime endDatetime,
        boolean registrationOpen,
        LocalDateTime registrationStart,
        LocalDateTime registrationEnd,
        String status,
        boolean placementWillingOnly,
        Integer minTeamSize,
        Integer maxTeamSize,
        Integer maxParticipants,
        Integer maxTeams,
        List<EventOptionDto> allowedDepartments,
        Set<Integer> allowedYears,
        Set<String> allowedSections,
        List<EventOptionDto> incharges,
        Set<String> allowedTechnicalAreas,
        long roundsCount,
        long problemStatementCount,
        boolean resultsPublished
) {
}
