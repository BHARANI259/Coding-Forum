package com.kec.codingforum.team.dto;

import java.time.LocalDateTime;

public record TeamMemberDto(
        Long studentId,
        String registerNumber,
        String name,
        String email,
        String departmentCode,
        Integer year,
        String section,
        boolean leader,
        LocalDateTime joinedAt
) {
}
