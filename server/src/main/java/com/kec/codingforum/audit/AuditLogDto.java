package com.kec.codingforum.audit;

import java.time.LocalDateTime;

public record AuditLogDto(
        Long id,
        String actorEmail,
        String actorRole,
        String action,
        String resourceType,
        String resourceId,
        String outcome,
        String message,
        String ipAddress,
        String userAgent,
        LocalDateTime createdAt
) {
    static AuditLogDto from(AuditLog log) {
        return new AuditLogDto(
                log.getId(),
                log.getActorEmail(),
                log.getActorRole(),
                log.getAction(),
                log.getResourceType(),
                log.getResourceId(),
                log.getOutcome(),
                log.getMessage(),
                log.getIpAddress(),
                log.getUserAgent(),
                log.getCreatedAt()
        );
    }
}
