package com.kec.codingforum.analytics.dto;

import java.time.LocalDateTime;

public record RecentActivityDto(
        String activityType,
        String title,
        String subtitle,
        Integer points,
        LocalDateTime occurredAt
) {
}
