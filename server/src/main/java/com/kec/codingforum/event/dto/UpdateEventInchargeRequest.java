package com.kec.codingforum.event.dto;

public record UpdateEventInchargeRequest(
        boolean primaryIncharge,
        String responsibility
) {
}
