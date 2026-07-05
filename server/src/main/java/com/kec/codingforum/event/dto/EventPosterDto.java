package com.kec.codingforum.event.dto;

import java.time.LocalDateTime;

public record EventPosterDto(
        Long eventId,
        String posterImageUrl,
        String posterOriginalName,
        String posterContentType,
        Long posterSizeBytes,
        LocalDateTime posterUploadedAt
) {
}
