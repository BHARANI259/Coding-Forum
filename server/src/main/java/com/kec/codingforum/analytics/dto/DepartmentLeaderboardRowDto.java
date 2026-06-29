package com.kec.codingforum.analytics.dto;

public record DepartmentLeaderboardRowDto(
        int rank,
        Long departmentId,
        String departmentCode,
        String departmentName,
        Integer totalPoints,
        Integer totalParticipants,
        Integer wins
) {
}
