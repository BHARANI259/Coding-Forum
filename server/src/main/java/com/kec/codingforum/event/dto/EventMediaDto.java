package com.kec.codingforum.event.dto;

import java.time.LocalDateTime;

public record EventMediaDto(
        Long id,
        Long eventId,
        String mediaType,
        String caption,
        String originalFileName,
        String contentType,
        Long sizeBytes,
        String fileUrl,
        String uploadedByName,
        Long uploadedByUserId,
        LocalDateTime uploadedAt,
        boolean deleted
) {
}
