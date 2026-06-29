package com.kec.codingforum.result.dto;

import java.time.LocalDateTime;

public record PublishResultsResponse(
        Long eventId,
        boolean resultsPublished,
        LocalDateTime resultsPublishedAt,
        String status,
        boolean registrationOpen,
        String message
) {
}
