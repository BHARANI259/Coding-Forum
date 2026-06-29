package com.kec.codingforum.report;

import com.kec.codingforum.report.ReportModels.DepartmentStudentPerformanceRow;
import com.kec.codingforum.report.ReportModels.EventParticipantReportRow;
import com.kec.codingforum.report.ReportModels.EventReportData;
import com.kec.codingforum.report.ReportModels.EventResultReportRow;
import com.kec.codingforum.report.ReportModels.EventTeamReportRow;
import com.kec.codingforum.report.ReportModels.LeaderboardExportRow;
import com.kec.codingforum.report.ReportModels.PointReportRow;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.Font;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ExcelReportService {

    public byte[] eventStudents(EventReportData data) {
        try (Workbook workbook = new XSSFWorkbook()) {
            CellStyle header = headerStyle(workbook);
            eventSummarySheet(workbook, data, header);
            Sheet sheet = workbook.createSheet("Students");
            writeHeader(sheet, header, "S.No", "Register Number", "Student Name", "Email", "Department Code", "Department Name", "Year", "Section", "Technical Area", "Placement Willing", "Registration Type", "Team Name", "Team Code", "Is Team Leader", "Selected Problem Statement", "Registration Status", "Registered At", "Result Type", "Points Awarded");
            int rowIndex = 1;
            for (EventParticipantReportRow row : data.participants()) {
                writeRow(sheet.createRow(rowIndex), rowIndex, row.registerNumber(), row.studentName(), row.email(), row.departmentCode(), row.departmentName(), row.year(), row.section(), row.technicalArea(), yesNo(row.placementWilling()), row.registrationType(), row.teamName(), row.teamCode(), yesNo(row.teamLeader()), row.selectedProblemStatement(), row.registrationStatus(), format(row.registeredAt()), row.resultType(), row.pointsAwarded());
                rowIndex++;
            }
            finish(workbook);
            return bytes(workbook);
        } catch (IOException exception) {
            throw new IllegalStateException("Unable to generate Excel report.", exception);
        }
    }

    public byte[] eventTeams(EventReportData data) {
        try (Workbook workbook = new XSSFWorkbook()) {
            CellStyle header = headerStyle(workbook);
            eventSummarySheet(workbook, data, header);
            Sheet teamsSheet = workbook.createSheet("Teams");
            writeHeader(teamsSheet, header, "S.No", "Team Name", "Team Code", "Leader Register Number", "Leader Name", "Member Count", "Selected Problem Statement", "Locked After Registration", "Registration Status", "Result Type", "Points Per Member");
            int rowIndex = 1;
            for (EventTeamReportRow row : data.teams()) {
                writeRow(teamsSheet.createRow(rowIndex), rowIndex, row.teamName(), row.teamCode(), row.leaderRegisterNumber(), row.leaderName(), row.memberCount(), row.selectedProblemStatement(), yesNo(row.lockedAfterRegistration()), row.registrationStatus(), row.resultType(), row.pointsPerMember());
                rowIndex++;
            }

            Sheet membersSheet = workbook.createSheet("Team Members");
            writeHeader(membersSheet, header, "S.No", "Team Name", "Team Code", "Register Number", "Student Name", "Department", "Year", "Section", "Technical Area", "Is Leader", "Result Type", "Points Awarded");
            rowIndex = 1;
            for (EventParticipantReportRow row : data.participants()) {
                if (row.teamName() != null) {
                    writeRow(membersSheet.createRow(rowIndex), rowIndex, row.teamName(), row.teamCode(), row.registerNumber(), row.studentName(), row.departmentCode(), row.year(), row.section(), row.technicalArea(), yesNo(row.teamLeader()), row.resultType(), row.pointsAwarded());
                    rowIndex++;
                }
            }
            finish(workbook);
            return bytes(workbook);
        } catch (IOException exception) {
            throw new IllegalStateException("Unable to generate Excel report.", exception);
        }
    }

    public byte[] eventResults(EventReportData data, List<PointReportRow> points) {
        try (Workbook workbook = new XSSFWorkbook()) {
            CellStyle header = headerStyle(workbook);
            Sheet resultsSheet = workbook.createSheet("Results");
            writeHeader(resultsSheet, header, "S.No", "Event", "Event Type", "Category", "Team Name", "Team Code", "Register Number", "Student Name", "Department", "Result Type", "Points Awarded", "Declared By", "Declared At", "Results Published");
            int rowIndex = 1;
            for (EventResultReportRow row : data.results()) {
                writeRow(resultsSheet.createRow(rowIndex), rowIndex, row.event(), row.eventType(), row.category(), row.teamName(), row.teamCode(), row.registerNumber(), row.studentName(), row.department(), row.resultType(), row.pointsAwarded(), row.declaredBy(), format(row.declaredAt()), yesNo(row.resultsPublished()));
                rowIndex++;
            }
            Sheet pointsSheet = workbook.createSheet("Points");
            writeHeader(pointsSheet, header, "S.No", "Register Number", "Student Name", "Department", "Category", "Event", "Point Type", "Points", "Reason", "Created At");
            rowIndex = 1;
            for (PointReportRow row : points) {
                writeRow(pointsSheet.createRow(rowIndex), rowIndex, row.registerNumber(), row.studentName(), row.department(), row.category(), row.event(), row.pointType(), row.points(), row.reason(), format(row.createdAt()));
                rowIndex++;
            }
            finish(workbook);
            return bytes(workbook);
        } catch (IOException exception) {
            throw new IllegalStateException("Unable to generate Excel report.", exception);
        }
    }

    public byte[] departmentStudents(List<DepartmentStudentPerformanceRow> rows) {
        try (Workbook workbook = new XSSFWorkbook()) {
            CellStyle header = headerStyle(workbook);
            Sheet sheet = workbook.createSheet("Department Students");
            writeHeader(sheet, header, "S.No", "Register Number", "Student Name", "Email", "Year", "Section", "Technical Area", "Placement Willing", "Events Participated", "Total Points", "Wins", "Runner Ups", "Second Runner Ups", "Participation Count");
            int rowIndex = 1;
            for (DepartmentStudentPerformanceRow row : rows) {
                writeRow(sheet.createRow(rowIndex), rowIndex, row.registerNumber(), row.studentName(), row.email(), row.year(), row.section(), row.technicalArea(), yesNo(row.placementWilling()), row.eventsParticipated(), row.totalPoints(), row.wins(), row.runnerUps(), row.secondRunnerUps(), row.participationCount());
                rowIndex++;
            }
            finish(workbook);
            return bytes(workbook);
        } catch (IOException exception) {
            throw new IllegalStateException("Unable to generate Excel report.", exception);
        }
    }

    public byte[] collegeLeaderboard(List<LeaderboardExportRow> rows) {
        try (Workbook workbook = new XSSFWorkbook()) {
            CellStyle header = headerStyle(workbook);
            Sheet sheet = workbook.createSheet("College Leaderboard");
            writeHeader(sheet, header, "Rank", "Register Number", "Student Name", "Department", "Year", "Section", "Technical Area", "Events Participated", "Total Points", "Wins", "Runner Ups", "Second Runner Ups");
            int rowIndex = 1;
            for (LeaderboardExportRow row : rows) {
                writeRow(sheet.createRow(rowIndex), row.rank(), row.registerNumber(), row.studentName(), row.department(), row.year(), row.section(), row.technicalArea(), row.eventsParticipated(), row.totalPoints(), row.wins(), row.runnerUps(), row.secondRunnerUps());
                rowIndex++;
            }
            finish(workbook);
            return bytes(workbook);
        } catch (IOException exception) {
            throw new IllegalStateException("Unable to generate Excel report.", exception);
        }
    }

    private void eventSummarySheet(Workbook workbook, EventReportData data, CellStyle header) {
        Sheet sheet = workbook.createSheet("Event Summary");
        writeHeader(sheet, header, "Field", "Value");
        writeRow(sheet.createRow(1), "Event", data.title());
        writeRow(sheet.createRow(2), "Category", data.category());
        writeRow(sheet.createRow(3), "Type", data.eventType());
        writeRow(sheet.createRow(4), "Venue", data.venue());
        writeRow(sheet.createRow(5), "Status", data.status());
        writeRow(sheet.createRow(6), "Registration", data.registrationOpen() ? "Open" : "Closed");
        writeRow(sheet.createRow(7), "Results Published", yesNo(data.resultsPublished()));
        writeRow(sheet.createRow(8), "Generated At", format(LocalDateTime.now()));
        sheet.createFreezePane(0, 1);
    }

    private CellStyle headerStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setBold(true);
        style.setFont(font);
        return style;
    }

    private void writeHeader(Sheet sheet, CellStyle style, String... values) {
        Row row = sheet.createRow(0);
        writeRow(row, (Object[]) values);
        for (Cell cell : row) {
            cell.setCellStyle(style);
        }
        sheet.createFreezePane(0, 1);
    }

    private void writeRow(Row row, Object... values) {
        for (int index = 0; index < values.length; index++) {
            Cell cell = row.createCell(index);
            Object value = values[index];
            if (value instanceof Number number) {
                cell.setCellValue(number.doubleValue());
            } else {
                cell.setCellValue(value == null ? "" : String.valueOf(value));
            }
        }
    }

    private void finish(Workbook workbook) {
        for (int sheetIndex = 0; sheetIndex < workbook.getNumberOfSheets(); sheetIndex++) {
            Sheet sheet = workbook.getSheetAt(sheetIndex);
            int columns = sheet.getRow(0) == null ? 0 : sheet.getRow(0).getLastCellNum();
            for (int column = 0; column < columns; column++) {
                sheet.autoSizeColumn(column);
            }
        }
    }

    private byte[] bytes(Workbook workbook) throws IOException {
        ByteArrayOutputStream output = new ByteArrayOutputStream();
        workbook.write(output);
        return output.toByteArray();
    }

    private String format(LocalDateTime value) {
        return value == null ? "" : value.toString().replace('T', ' ');
    }

    private String yesNo(boolean value) {
        return value ? "Yes" : "No";
    }
}
