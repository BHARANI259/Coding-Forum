package com.kec.codingforum.push.dto;

import jakarta.validation.constraints.NotBlank;

public record PushSubscriptionKeysRequest(
        @NotBlank String p256dh,
        @NotBlank String auth
) {
}
