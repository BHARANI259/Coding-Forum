package com.kec.codingforum.event.dto;

import java.math.BigDecimal;

public record EventCategoryDto(Long id, String name, BigDecimal weightage, boolean active) {
}
