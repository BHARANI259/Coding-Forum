package com.kec.codingforum.result.dto;

import java.util.List;

public record EventResultSummaryDto(
        Long eventId,
        String eventTitle,
        String eventType,
        String categoryName,
        List<ResultDto> results
) {
}
