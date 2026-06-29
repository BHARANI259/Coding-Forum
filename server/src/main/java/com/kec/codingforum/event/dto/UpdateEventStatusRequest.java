package com.kec.codingforum.event.dto;

import jakarta.validation.constraints.NotBlank;

public record UpdateEventStatusRequest(@NotBlank String status) {
}
