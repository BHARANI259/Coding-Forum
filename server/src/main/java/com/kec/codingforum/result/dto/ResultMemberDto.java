package com.kec.codingforum.result.dto;

public record ResultMemberDto(
        Long studentId,
        String name,
        String registerNumber,
        String departmentCode
) {
}
