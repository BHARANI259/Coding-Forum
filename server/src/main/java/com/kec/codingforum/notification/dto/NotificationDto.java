package com.kec.codingforum.notification.dto;

import java.time.LocalDateTime;

public record NotificationDto(
        Long id,
        String title,
        String message,
        String notificationType,
        String relatedEntityType,
        Long relatedEntityId,
        boolean read,
        boolean emailSent,
        String emailError,
        LocalDateTime createdAt,
        LocalDateTime readAt
) {
}
