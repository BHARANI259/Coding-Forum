package com.kec.codingforum.event.dto;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

public record EventDetailDto(
        Long id,
        String title,
        String description,
        EventCategoryDto category,
        String eventType,
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
        String status,
        Long createdByUserId,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        List<EventOptionDto> allowedDepartments,
        Set<Integer> allowedYears,
        Set<String> allowedSections,
        List<EventOptionDto> incharges,
        Set<String> allowedTechnicalAreas,
        long roundsCount,
        long problemStatementCount,
        boolean resultsPublished,
        LocalDateTime resultsPublishedAt,
        String posterImageUrl,
        String posterOriginalName,
        String posterContentType,
        Long posterSizeBytes,
        LocalDateTime posterUploadedAt
) {
}
