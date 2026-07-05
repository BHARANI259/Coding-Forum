package com.kec.codingforum.event.dto;

import jakarta.validation.Valid;

import java.util.List;

public record BulkUpdateEventInchargesRequest(
        @Valid List<AssignEventInchargeRequest> incharges
) {
}
