package com.kec.codingforum.team.dto;

import java.util.List;

public record TeamRegistrationResponse(
        Long teamId,
        Long eventId,
        String status,
        Long problemStatementId,
        String problemStatementTitle,
        List<TeamMemberDto> registeredMembers
) {
}
