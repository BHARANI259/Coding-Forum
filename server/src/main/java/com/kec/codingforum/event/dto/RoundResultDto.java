package com.kec.codingforum.event.dto;

import java.time.LocalDateTime;

public record RoundResultDto(
        Long id,
        Long eventId,
        Long roundId,
        boolean finalRound,
        Long teamId,
        String teamName,
        String teamCode,
        Long studentId,
        String studentName,
        String registerNumber,
        String status,
        Long declaredByUserId,
        LocalDateTime declaredAt
) {
}
