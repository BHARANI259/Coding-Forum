package com.kec.codingforum.common;

import java.time.Instant;

public record ErrorResponse(
        String code,
        String message,
        String path,
        Instant timestamp
) {
}

