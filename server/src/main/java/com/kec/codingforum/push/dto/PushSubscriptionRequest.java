package com.kec.codingforum.push.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record PushSubscriptionRequest(
        @NotBlank String endpoint,
        Long expirationTime,
        @Valid @NotNull PushSubscriptionKeysRequest keys,
        String userAgent,
        String deviceName,
        String platform,
        String browser,
        String permissionStatus
) {
}
