package com.kec.codingforum.event;

import com.kec.codingforum.audit.AuditService;
import com.kec.codingforum.event.dto.DeclareRoundStudentResultRequest;
import com.kec.codingforum.event.dto.DeclareRoundTeamResultRequest;
import com.kec.codingforum.event.dto.RoundResultDto;
import com.kec.codingforum.security.SecurityUtils;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.http.MediaType;

import java.util.List;

@RestController
@RequestMapping("/api/faculty/events/{eventId}/rounds/{roundId}/results")
@PreAuthorize("hasRole('FACULTY')")
public class FacultyRoundResultController {

    private final EventRoundResultService service;
    private final AuditService auditService;

    public FacultyRoundResultController(EventRoundResultService service, AuditService auditService) {
        this.service = service;
        this.auditService = auditService;
    }

    @GetMapping
    public List<RoundResultDto> list(@PathVariable Long eventId, @PathVariable Long roundId) {
        service.requireAssigned(eventId, SecurityUtils.getCurrentFacultyId());
        return service.list(eventId, roundId);
    }

    @PostMapping("/team")
    public RoundResultDto team(@PathVariable Long eventId, @PathVariable Long roundId, @Valid @RequestBody DeclareRoundTeamResultRequest request) {
        service.requireAssigned(eventId, SecurityUtils.getCurrentFacultyId());
        RoundResultDto result = service.saveTeam(eventId, roundId, request.teamId(), request.status(), SecurityUtils.getCurrentUserId());
        auditService.record("FACULTY_ROUND_TEAM_RESULT_SAVED", "ROUND", roundId, AuditService.SUCCESS, "Faculty saved team round result draft.");
        return result;
    }

    @PostMapping("/individual")
    public RoundResultDto individual(@PathVariable Long eventId, @PathVariable Long roundId, @Valid @RequestBody DeclareRoundStudentResultRequest request) {
        service.requireAssigned(eventId, SecurityUtils.getCurrentFacultyId());
        RoundResultDto result = service.saveStudent(eventId, roundId, request.studentId(), request.status(), SecurityUtils.getCurrentUserId());
        auditService.record("FACULTY_ROUND_STUDENT_RESULT_SAVED", "ROUND", roundId, AuditService.SUCCESS, "Faculty saved individual round result draft.");
        return result;
    }

    @PostMapping(value = "/import-marks", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public List<RoundResultDto> importMarks(@PathVariable Long eventId, @PathVariable Long roundId, @RequestPart("file") MultipartFile file) {
        service.requireAssigned(eventId, SecurityUtils.getCurrentFacultyId());
        List<RoundResultDto> results = service.importMarks(eventId, roundId, file, SecurityUtils.getCurrentUserId());
        auditService.record("FACULTY_ROUND_MARKS_IMPORTED", "ROUND", roundId, AuditService.SUCCESS, "Faculty imported marks for assigned round.");
        return results;
    }
}
