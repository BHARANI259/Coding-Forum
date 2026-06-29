package com.kec.codingforum.event;

import com.kec.codingforum.event.dto.CreateProblemStatementRequest;
import com.kec.codingforum.event.dto.ProblemStatementDto;
import com.kec.codingforum.event.dto.UpdateProblemStatementRequest;
import com.kec.codingforum.event.dto.UpdateProblemStatementStatusRequest;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
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
@RequestMapping("/api/admin/events/{eventId}/problem-statements")
@PreAuthorize("hasRole('SUPER_ADMIN')")
public class AdminProblemStatementController {

    private final EventProblemStatementService service;

    public AdminProblemStatementController(EventProblemStatementService service) {
        this.service = service;
    }

    @GetMapping
    public List<ProblemStatementDto> list(@PathVariable Long eventId) {
        return service.adminList(eventId);
    }

    @PostMapping
    public ProblemStatementDto create(@PathVariable Long eventId, @Valid @RequestBody CreateProblemStatementRequest request) {
        return service.create(eventId, request);
    }

    @PutMapping("/{problemStatementId}")
    public ProblemStatementDto update(@PathVariable Long eventId, @PathVariable Long problemStatementId, @Valid @RequestBody UpdateProblemStatementRequest request) {
        return service.update(eventId, problemStatementId, request);
    }

    @PatchMapping("/{problemStatementId}/status")
    public ProblemStatementDto status(@PathVariable Long eventId, @PathVariable Long problemStatementId, @RequestBody UpdateProblemStatementStatusRequest request) {
        return service.updateStatus(eventId, problemStatementId, request.active());
    }
}
