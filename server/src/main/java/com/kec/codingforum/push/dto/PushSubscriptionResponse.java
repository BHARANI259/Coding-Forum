package com.kec.codingforum.push.dto;

import java.time.LocalDateTime;

public record PushSubscriptionResponse(
        Long id,
        boolean active,
        String deviceName,
        String platform,
        String browser,
        String permissionStatus,
        LocalDateTime createdAt,
        LocalDateTime lastSeenAt
) {
}
