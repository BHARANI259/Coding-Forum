package com.kec.codingforum.event;

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
@RequestMapping("/api/admin/events/{eventId}/rounds/{roundId}/results")
@PreAuthorize("hasRole('SUPER_ADMIN')")
public class AdminRoundResultController {

    private final EventRoundResultService service;

    public AdminRoundResultController(EventRoundResultService service) {
        this.service = service;
    }

    @GetMapping
    public List<RoundResultDto> list(@PathVariable Long eventId, @PathVariable Long roundId) {
        return service.list(eventId, roundId);
    }

    @PostMapping("/team")
    public RoundResultDto team(@PathVariable Long eventId, @PathVariable Long roundId, @Valid @RequestBody DeclareRoundTeamResultRequest request) {
        return service.saveTeam(eventId, roundId, request.teamId(), request.status(), SecurityUtils.getCurrentUserId());
    }

    @PostMapping("/individual")
    public RoundResultDto individual(@PathVariable Long eventId, @PathVariable Long roundId, @Valid @RequestBody DeclareRoundStudentResultRequest request) {
        return service.saveStudent(eventId, roundId, request.studentId(), request.status(), SecurityUtils.getCurrentUserId());
    }

    @PostMapping(value = "/import-marks", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public List<RoundResultDto> importMarks(@PathVariable Long eventId, @PathVariable Long roundId, @RequestPart("file") MultipartFile file) {
        return service.importMarks(eventId, roundId, file, SecurityUtils.getCurrentUserId());
    }
}
