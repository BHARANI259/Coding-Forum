package com.kec.codingforum.event;

import com.kec.codingforum.event.dto.EventRoundDto;
import com.kec.codingforum.event.dto.UpdateRoundStatusRequest;
import com.kec.codingforum.security.SecurityUtils;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/faculty/events/{eventId}/rounds")
@PreAuthorize("hasRole('FACULTY')")
public class FacultyEventRoundController {

    private final EventRoundService service;
    private final EventRoundResultService roundResultService;

    public FacultyEventRoundController(EventRoundService service, EventRoundResultService roundResultService) {
        this.service = service;
        this.roundResultService = roundResultService;
    }

    @GetMapping
    public List<EventRoundDto> list(@PathVariable Long eventId) {
        return service.facultyList(eventId, SecurityUtils.getCurrentFacultyId());
    }

    @PatchMapping("/{roundId}/status")
    public EventRoundDto status(@PathVariable Long eventId, @PathVariable Long roundId, @RequestBody UpdateRoundStatusRequest request) {
        return service.facultyUpdateStatus(eventId, SecurityUtils.getCurrentFacultyId(), roundId, request.status());
    }

    @PostMapping("/{roundId}/publish-round-result")
    public void publishRoundResult(@PathVariable Long eventId, @PathVariable Long roundId) {
        roundResultService.requireAssigned(eventId, SecurityUtils.getCurrentFacultyId());
        roundResultService.publishRoundResult(eventId, roundId, SecurityUtils.getCurrentUserId());
    }

    @PostMapping("/{roundId}/publish-final-result")
    public void publishFinalResult(@PathVariable Long eventId, @PathVariable Long roundId) {
        roundResultService.requireAssigned(eventId, SecurityUtils.getCurrentFacultyId());
        roundResultService.publishFinalResult(eventId, roundId, SecurityUtils.getCurrentUserId());
    }
}
