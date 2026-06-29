package com.kec.codingforum.team.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateTeamRequest(@NotBlank String teamName) {
}
