package com.kec.codingforum.analytics.dto;

public record DepartmentStudentStatsDto(
        Long studentId,
        String registerNumber,
        String studentName,
        Integer totalPoints,
        Integer eventsParticipated,
        Integer wins
) {
}
