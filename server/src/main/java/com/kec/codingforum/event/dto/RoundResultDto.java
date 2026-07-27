package com.kec.codingforum.event.dto;

import java.time.LocalDateTime;
import java.math.BigDecimal;

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
        BigDecimal marks,
        Long declaredByUserId,
        LocalDateTime declaredAt
) {
}
