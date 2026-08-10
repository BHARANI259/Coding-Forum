package com.kec.codingforum.event;

import com.kec.codingforum.audit.AuditService;
import com.kec.codingforum.event.dto.CreateProblemStatementRequest;
import com.kec.codingforum.event.dto.ProblemStatementDto;
import com.kec.codingforum.event.dto.UpdateProblemStatementRequest;
import com.kec.codingforum.event.dto.UpdateProblemStatementStatusRequest;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/events/{eventId}/problem-statements")
@PreAuthorize("hasRole('SUPER_ADMIN')")
public class AdminProblemStatementController {

    private final EventProblemStatementService service;
    private final AuditService auditService;

    public AdminProblemStatementController(EventProblemStatementService service, AuditService auditService) {
        this.service = service;
        this.auditService = auditService;
    }

    @GetMapping
    public List<ProblemStatementDto> list(@PathVariable Long eventId) {
        return service.adminList(eventId);
    }

    @PostMapping
    public ProblemStatementDto create(@PathVariable Long eventId, @Valid @RequestBody CreateProblemStatementRequest request) {
        ProblemStatementDto problemStatement = service.create(eventId, request);
        auditService.record("PROBLEM_STATEMENT_CREATED", "PROBLEM_STATEMENT", problemStatement.id(), AuditService.SUCCESS, "Admin created event problem statement/domain.");
        return problemStatement;
    }

    @PutMapping("/{problemStatementId}")
    public ProblemStatementDto update(@PathVariable Long eventId, @PathVariable Long problemStatementId, @Valid @RequestBody UpdateProblemStatementRequest request) {
        ProblemStatementDto problemStatement = service.update(eventId, problemStatementId, request);
        auditService.record("PROBLEM_STATEMENT_UPDATED", "PROBLEM_STATEMENT", problemStatementId, AuditService.SUCCESS, "Admin updated event problem statement/domain.");
        return problemStatement;
    }

    @PatchMapping("/{problemStatementId}/status")
    public ProblemStatementDto status(@PathVariable Long eventId, @PathVariable Long problemStatementId, @RequestBody UpdateProblemStatementStatusRequest request) {
        ProblemStatementDto problemStatement = service.updateStatus(eventId, problemStatementId, request.active());
        auditService.record("PROBLEM_STATEMENT_STATUS_UPDATED", "PROBLEM_STATEMENT", problemStatementId, AuditService.SUCCESS, "Admin changed problem statement/domain active status.");
        return problemStatement;
    }

    @DeleteMapping("/{problemStatementId}")
    public ProblemStatementDto delete(@PathVariable Long eventId, @PathVariable Long problemStatementId) {
        ProblemStatementDto problemStatement = service.delete(eventId, problemStatementId);
        auditService.record("PROBLEM_STATEMENT_DELETED_OR_DEACTIVATED", "PROBLEM_STATEMENT", problemStatementId, AuditService.SUCCESS, "Admin deleted or deactivated event problem statement/domain.");
        return problemStatement;
    }
}
