package com.kec.codingforum.analytics.dto;

public record StudentLeaderboardRowDto(
        int rank,
        Long studentId,
        String registerNumber,
        String studentName,
        String departmentCode,
        String departmentName,
        Integer totalPoints,
        Integer eventsParticipated,
        Integer wins,
        Integer runnerUps
) {
}
