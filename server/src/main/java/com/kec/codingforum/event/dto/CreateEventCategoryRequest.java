package com.kec.codingforum.event.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

import java.math.BigDecimal;

public record CreateEventCategoryRequest(
        @NotBlank String name,
        @DecimalMin(value = "0.01") BigDecimal weightage,
        String categoryType,
        @Min(0) Integer winnerPoints,
        @Min(0) Integer runnerUpPoints,
        @Min(0) Integer secondRunnerUpPoints,
        @Min(0) Integer participantPoints,
        @Min(0) Integer disqualifiedPoints,
        @Min(0) Integer notPresentedPoints,
        Boolean active
) {
}
