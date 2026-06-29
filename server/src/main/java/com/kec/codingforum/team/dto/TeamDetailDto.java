package com.kec.codingforum.team.dto;

import java.util.List;

public record TeamDetailDto(
        Long id,
        Long eventId,
        TeamEventSummaryDto event,
        String teamName,
        String teamCode,
        Long leaderStudentId,
        boolean lockedAfterRegistration,
        String registrationStatus,
        Long problemStatementId,
        String problemStatementTitle,
        List<TeamMemberDto> members
) {
}
