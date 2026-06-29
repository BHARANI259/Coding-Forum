package com.kec.codingforum.common;

import java.time.Instant;

public record ApiErrorResponse(
        String code,
        String message,
        String path,
        Instant timestamp
) {
}
