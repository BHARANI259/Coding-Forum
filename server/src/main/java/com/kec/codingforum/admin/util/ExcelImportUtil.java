package com.kec.codingforum.admin.util;

import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;

import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public final class ExcelImportUtil {

    private ExcelImportUtil() {
    }

    public static List<ImportRow> read(InputStream inputStream) throws IOException {
        try (Workbook workbook = new XSSFWorkbook(inputStream)) {
            var sheet = workbook.getSheetAt(0);
            DataFormatter formatter = new DataFormatter();
            Row headerRow = sheet.getRow(0);
            if (headerRow == null) {
                return List.of();
            }

            List<String> headers = new ArrayList<>();
            for (Cell cell : headerRow) {
                headers.add(formatter.formatCellValue(cell).trim());
            }

            List<ImportRow> rows = new ArrayList<>();
            for (int rowIndex = 1; rowIndex <= sheet.getLastRowNum(); rowIndex++) {
                Row row = sheet.getRow(rowIndex);
                if (row == null) {
                    continue;
                }
                Map<String, String> values = new HashMap<>();
                boolean empty = true;
                for (int i = 0; i < headers.size(); i++) {
                    String value = formatter.formatCellValue(row.getCell(i)).trim();
                    if (!value.isBlank()) {
                        empty = false;
                    }
                    values.put(headers.get(i), value);
                }
                if (!empty) {
                    rows.add(new ImportRow(rowIndex + 1, values));
                }
            }
            return rows;
        }
    }
}
