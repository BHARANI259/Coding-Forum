package com.kec.codingforum.event;

import com.kec.codingforum.audit.AuditService;
import com.kec.codingforum.event.dto.CreateEventRoundRequest;
import com.kec.codingforum.event.dto.EventRoundDto;
import com.kec.codingforum.event.dto.UpdateEventRoundRequest;
import com.kec.codingforum.event.dto.UpdateRoundStatusRequest;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/events/{eventId}/rounds")
@PreAuthorize("hasRole('SUPER_ADMIN')")
public class AdminEventRoundController {

    private final EventRoundService service;
    private final EventRoundResultService roundResultService;
    private final AuditService auditService;

    public AdminEventRoundController(EventRoundService service, EventRoundResultService roundResultService, AuditService auditService) {
        this.service = service;
        this.roundResultService = roundResultService;
        this.auditService = auditService;
    }

    @GetMapping
    public List<EventRoundDto> list(@PathVariable Long eventId) {
        return service.adminList(eventId);
    }

    @PostMapping
    public EventRoundDto create(@PathVariable Long eventId, @Valid @RequestBody CreateEventRoundRequest request) {
        EventRoundDto round = service.create(eventId, request);
        auditService.record("EVENT_ROUND_CREATED", "ROUND", round.id(), AuditService.SUCCESS, "Admin created event round.");
        return round;
    }

    @PutMapping("/{roundId}")
    public EventRoundDto update(@PathVariable Long eventId, @PathVariable Long roundId, @Valid @RequestBody UpdateEventRoundRequest request) {
        EventRoundDto round = service.update(eventId, roundId, request);
        auditService.record("EVENT_ROUND_UPDATED", "ROUND", roundId, AuditService.SUCCESS, "Admin updated event round.");
        return round;
    }

    @PatchMapping("/{roundId}/status")
    public EventRoundDto status(@PathVariable Long eventId, @PathVariable Long roundId, @RequestBody UpdateRoundStatusRequest request) {
        EventRoundDto round = service.updateStatus(eventId, roundId, request.status());
        auditService.record("EVENT_ROUND_STATUS_UPDATED", "ROUND", roundId, AuditService.SUCCESS, "Admin updated round status to " + request.status() + ".");
        return round;
    }

    @DeleteMapping("/{roundId}")
    public void delete(@PathVariable Long eventId, @PathVariable Long roundId) {
        service.delete(eventId, roundId);
        auditService.record("EVENT_ROUND_DELETED", "ROUND", roundId, AuditService.SUCCESS, "Admin deleted event round.");
    }

    @PostMapping("/{roundId}/publish-round-result")
    public void publishRoundResult(@PathVariable Long eventId, @PathVariable Long roundId) {
        roundResultService.publishRoundResult(eventId, roundId, com.kec.codingforum.security.SecurityUtils.getCurrentUserId());
        auditService.record("ROUND_RESULT_PUBLISHED", "ROUND", roundId, AuditService.SUCCESS, "Admin published non-final round result.");
    }

    @PostMapping("/{roundId}/publish-final-result")
    public void publishFinalResult(@PathVariable Long eventId, @PathVariable Long roundId) {
        roundResultService.publishFinalResult(eventId, roundId, com.kec.codingforum.security.SecurityUtils.getCurrentUserId());
        auditService.record("FINAL_RESULT_PUBLISHED", "ROUND", roundId, AuditService.SUCCESS, "Admin published final result.");
    }
}
