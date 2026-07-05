package com.kec.codingforum.report;

import com.kec.codingforum.report.ReportModels.DepartmentReportData;
import com.kec.codingforum.report.ReportModels.EventReportData;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/admin/reports")
@RequiredArgsConstructor
@PreAuthorize("hasRole('SUPER_ADMIN')")
public class AdminReportController {

    private final ReportDataService dataService;
    private final PdfReportService pdfService;
    private final ExcelReportService excelService;

    @GetMapping("/events/{eventId}/pdf")
    public ResponseEntity<byte[]> eventPdf(@PathVariable Long eventId) {
        EventReportData data = dataService.getEventReportData(eventId);
        return pdf("event-report-" + eventId + ".pdf", pdfService.eventReport(data));
    }

    @GetMapping("/events/{eventId}/students.xlsx")
    public ResponseEntity<byte[]> eventStudents(@PathVariable Long eventId) {
        EventReportData data = dataService.getEventReportData(eventId);
        return excel("event-students-" + eventId + ".xlsx", excelService.eventStudents(data));
    }

    @GetMapping("/events/{eventId}/teams.xlsx")
    public ResponseEntity<byte[]> eventTeams(@PathVariable Long eventId) {
        EventReportData data = dataService.getEventReportData(eventId);
        return excel("event-teams-" + eventId + ".xlsx", excelService.eventTeams(data));
    }

    @GetMapping("/events/{eventId}/results.xlsx")
    public ResponseEntity<byte[]> eventResults(@PathVariable Long eventId) {
        EventReportData data = dataService.getEventReportData(eventId);
        return excel("event-results-" + eventId + ".xlsx", excelService.eventResults(data, dataService.getEventPointRows(eventId)));
    }

    @GetMapping("/departments/{departmentId}/pdf")
    public ResponseEntity<byte[]> departmentPdf(
            @PathVariable Long departmentId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestParam(required = false) Long categoryId
    ) {
        DepartmentReportData data = dataService.getDepartmentReportData(departmentId, fromDate, toDate, categoryId);
        return pdf("department-report-" + data.departmentCode() + ".pdf", pdfService.departmentReport(data));
    }

    @GetMapping("/departments/{departmentId}/students.xlsx")
    public ResponseEntity<byte[]> departmentStudents(
            @PathVariable Long departmentId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestParam(required = false) Long categoryId
    ) {
        DepartmentReportData data = dataService.getDepartmentReportData(departmentId, fromDate, toDate, categoryId);
        return excel("department-students-" + data.departmentCode() + ".xlsx", excelService.departmentStudents(data.students()));
    }

    @GetMapping("/leaderboard/college.xlsx")
    public ResponseEntity<byte[]> collegeLeaderboard(
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) Long departmentId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate
    ) {
        return excel("college-leaderboard.xlsx", excelService.collegeLeaderboard(dataService.getCollegeLeaderboardRows(departmentId, categoryId, fromDate, toDate)));
    }

    @GetMapping("/yearly/pdf")
    public ResponseEntity<byte[]> yearlyPdf(@RequestParam(required = false) String academicYear) {
        String label = academicYear == null || academicYear.isBlank() ? dataService.currentAcademicYearLabel() : academicYear.trim();
        return pdf("yearly-report-" + label + ".pdf", pdfService.yearlyEventReport(dataService.getYearlyEventReportData(label), label));
    }

    private ResponseEntity<byte[]> pdf(String filename, byte[] body) {
        return file(filename, MediaType.APPLICATION_PDF, body);
    }

    private ResponseEntity<byte[]> excel(String filename, byte[] body) {
        return file(filename, MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"), body);
    }

    private ResponseEntity<byte[]> file(String filename, MediaType mediaType, byte[] body) {
        return ResponseEntity.ok()
                .contentType(mediaType)
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment().filename(filename).build().toString())
                .body(body);
    }
}
