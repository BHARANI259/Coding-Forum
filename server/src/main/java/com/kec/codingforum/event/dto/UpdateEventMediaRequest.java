package com.kec.codingforum.event.dto;

public record UpdateEventMediaRequest(
        String mediaType,
        String caption
) {
}
