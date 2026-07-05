package com.kec.codingforum.analytics.dto;

public record TopStudentAnalyticsDto(
        int rank,
        Long studentId,
        String registerNumber,
        String studentName,
        String departmentCode,
        Integer year,
        String section,
        String technicalArea,
        Long totalPoints,
        Long eventsParticipated,
        Long wins
) {
}
