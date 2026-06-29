package com.kec.codingforum.admin.util;

import java.util.Map;

public record ImportRow(
        int rowNumber,
        Map<String, String> values
) {

    public String get(String column) {
        return values.getOrDefault(column, "").trim();
    }
}
