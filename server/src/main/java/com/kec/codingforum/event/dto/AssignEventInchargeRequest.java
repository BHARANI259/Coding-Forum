package com.kec.codingforum.event.dto;

import jakarta.validation.constraints.NotNull;

public record AssignEventInchargeRequest(
        @NotNull Long facultyId,
        boolean primaryIncharge,
        String responsibility
) {
}
