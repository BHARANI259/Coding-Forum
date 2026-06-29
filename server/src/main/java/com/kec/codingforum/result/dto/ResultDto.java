package com.kec.codingforum.result.dto;

import java.time.LocalDateTime;
import java.util.List;

public record ResultDto(
        Long id,
        Long eventId,
        String eventTitle,
        String eventType,
        Long studentId,
        String studentName,
        String registerNumber,
        String departmentCode,
        Long teamId,
        String teamName,
        String teamCode,
        String resultType,
        Integer pointsAwarded,
        Long declaredByUserId,
        String declaredByEmail,
        LocalDateTime declaredAt,
        List<ResultMemberDto> members
) {
}
