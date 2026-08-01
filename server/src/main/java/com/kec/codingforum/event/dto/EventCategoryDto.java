package com.kec.codingforum.event.dto;

import java.math.BigDecimal;

public record EventCategoryDto(
        Long id,
        String name,
        BigDecimal weightage,
        String categoryType,
        Integer winnerPoints,
        Integer runnerUpPoints,
        Integer secondRunnerUpPoints,
        Integer participantPoints,
        Integer disqualifiedPoints,
        Integer notPresentedPoints,
        boolean active
) {
}
