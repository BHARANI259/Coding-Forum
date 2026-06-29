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
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/faculty/events/{eventId}/rounds/{roundId}/results")
@PreAuthorize("hasRole('FACULTY')")
public class FacultyRoundResultController {

    private final EventRoundResultService service;

    public FacultyRoundResultController(EventRoundResultService service) {
        this.service = service;
    }

    @GetMapping
    public List<RoundResultDto> list(@PathVariable Long eventId, @PathVariable Long roundId) {
        service.requireAssigned(eventId, SecurityUtils.getCurrentFacultyId());
        return service.list(eventId, roundId);
    }

    @PostMapping("/team")
    public RoundResultDto team(@PathVariable Long eventId, @PathVariable Long roundId, @Valid @RequestBody DeclareRoundTeamResultRequest request) {
        service.requireAssigned(eventId, SecurityUtils.getCurrentFacultyId());
        return service.saveTeam(eventId, roundId, request.teamId(), request.status(), SecurityUtils.getCurrentUserId());
    }

    @PostMapping("/individual")
    public RoundResultDto individual(@PathVariable Long eventId, @PathVariable Long roundId, @Valid @RequestBody DeclareRoundStudentResultRequest request) {
        service.requireAssigned(eventId, SecurityUtils.getCurrentFacultyId());
        return service.saveStudent(eventId, roundId, request.studentId(), request.status(), SecurityUtils.getCurrentUserId());
    }
}
