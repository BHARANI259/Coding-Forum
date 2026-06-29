package com.kec.codingforum.report;

import com.kec.codingforum.report.ReportModels.DepartmentReportData;
import com.kec.codingforum.report.ReportModels.EventReportData;
import com.kec.codingforum.security.SecurityUtils;
import com.kec.codingforum.user.Faculty;
import com.kec.codingforum.user.FacultyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import com.kec.codingforum.event.EventRepository;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/faculty/reports")
@RequiredArgsConstructor
@PreAuthorize("hasRole('FACULTY')")
public class FacultyReportController {

    private final ReportDataService dataService;
    private final PdfReportService pdfService;
    private final ExcelReportService excelService;
    private final EventRepository events;
    private final FacultyRepository facultyRepository;

    @GetMapping("/events/{eventId}/pdf")
    public ResponseEntity<byte[]> eventPdf(@PathVariable Long eventId) {
        requireAssigned(eventId);
        EventReportData data = dataService.getEventReportData(eventId);
        return pdf("event-report-" + eventId + ".pdf", pdfService.eventReport(data));
    }

    @GetMapping("/events/{eventId}/students.xlsx")
    public ResponseEntity<byte[]> eventStudents(@PathVariable Long eventId) {
        requireAssigned(eventId);
        EventReportData data = dataService.getEventReportData(eventId);
        return excel("event-students-" + eventId + ".xlsx", excelService.eventStudents(data));
    }

    @GetMapping("/events/{eventId}/teams.xlsx")
    public ResponseEntity<byte[]> eventTeams(@PathVariable Long eventId) {
        requireAssigned(eventId);
        EventReportData data = dataService.getEventReportData(eventId);
        return excel("event-teams-" + eventId + ".xlsx", excelService.eventTeams(data));
    }

    @GetMapping("/events/{eventId}/results.xlsx")
    public ResponseEntity<byte[]> eventResults(@PathVariable Long eventId) {
        requireAssigned(eventId);
        EventReportData data = dataService.getEventReportData(eventId);
        return excel("event-results-" + eventId + ".xlsx", excelService.eventResults(data, dataService.getEventPointRows(eventId)));
    }

    @GetMapping("/department/pdf")
    public ResponseEntity<byte[]> departmentPdf(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestParam(required = false) Long categoryId
    ) {
        Faculty faculty = requireDepartmentMonitoringFaculty();
        DepartmentReportData data = dataService.getDepartmentReportData(faculty.getDepartment().getId(), fromDate, toDate, categoryId);
        return pdf("department-report-" + data.departmentCode() + ".pdf", pdfService.departmentReport(data));
    }

    @GetMapping("/department/students.xlsx")
    public ResponseEntity<byte[]> departmentStudents(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestParam(required = false) Long categoryId
    ) {
        Faculty faculty = requireDepartmentMonitoringFaculty();
        DepartmentReportData data = dataService.getDepartmentReportData(faculty.getDepartment().getId(), fromDate, toDate, categoryId);
        return excel("department-students-" + data.departmentCode() + ".xlsx", excelService.departmentStudents(data.students()));
    }

    private void requireAssigned(Long eventId) {
        events.findByIdAndInchargesId(eventId, SecurityUtils.getCurrentFacultyId())
                .orElseThrow(() -> new AccessDeniedException("Faculty is not assigned to this event."));
    }

    private Faculty requireDepartmentMonitoringFaculty() {
        Faculty faculty = facultyRepository.findById(SecurityUtils.getCurrentFacultyId())
                .orElseThrow(() -> new AccessDeniedException("Faculty account not found."));
        if (!faculty.isDeptMonitoringEnabled() || faculty.getDepartment() == null) {
            throw new AccessDeniedException("Department monitoring is not enabled for this account.");
        }
        return faculty;
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
