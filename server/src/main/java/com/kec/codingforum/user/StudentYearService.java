package com.kec.codingforum.user;

import org.springframework.stereotype.Service;

import java.time.LocalDate;

@Service
public class StudentYearService {

    private static final int ACADEMIC_YEAR_START_MONTH = 6;

    public Integer resolveYear(String registerNumber, Integer fallbackYear) {
        Integer calculated = calculateFromRegisterNumber(registerNumber);
        if (calculated != null) {
            return calculated;
        }
        return fallbackYear;
    }

    private Integer calculateFromRegisterNumber(String registerNumber) {
        if (registerNumber == null || registerNumber.length() < 2) {
            return null;
        }
        String admissionYearText = registerNumber.substring(0, 2);
        if (!admissionYearText.chars().allMatch(Character::isDigit)) {
            return null;
        }
        int admissionYear = 2000 + Integer.parseInt(admissionYearText);
        LocalDate today = LocalDate.now();
        int academicStartYear = today.getMonthValue() >= ACADEMIC_YEAR_START_MONTH
                ? today.getYear()
                : today.getYear() - 1;
        int studyYear = academicStartYear - admissionYear + 1;
        return Math.max(1, Math.min(4, studyYear));
    }
}
