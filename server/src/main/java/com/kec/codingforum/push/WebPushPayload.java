package com.kec.codingforum.push;

public record WebPushPayload(
        Long notificationId,
        String type,
        String title,
        String body,
        String url
) {
}
