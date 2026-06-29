package com.kec.codingforum.event;

import com.kec.codingforum.event.dto.CreateEventRoundRequest;
import com.kec.codingforum.event.dto.EventRoundDto;
import com.kec.codingforum.event.dto.UpdateEventRoundRequest;
import com.kec.codingforum.event.dto.UpdateRoundStatusRequest;
import com.kec.codingforum.security.SecurityUtils;
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
@RequestMapping("/api/faculty/events/{eventId}/rounds")
@PreAuthorize("hasRole('FACULTY')")
public class FacultyEventRoundController {

    private final EventRoundService service;

    public FacultyEventRoundController(EventRoundService service) {
        this.service = service;
    }

    @GetMapping
    public List<EventRoundDto> list(@PathVariable Long eventId) {
        return service.facultyList(eventId, SecurityUtils.getCurrentFacultyId());
    }

    @PostMapping
    public EventRoundDto create(@PathVariable Long eventId, @Valid @RequestBody CreateEventRoundRequest request) {
        return service.facultyCreate(eventId, SecurityUtils.getCurrentFacultyId(), request);
    }

    @PutMapping("/{roundId}")
    public EventRoundDto update(@PathVariable Long eventId, @PathVariable Long roundId, @Valid @RequestBody UpdateEventRoundRequest request) {
        return service.facultyUpdate(eventId, SecurityUtils.getCurrentFacultyId(), roundId, request);
    }

    @PatchMapping("/{roundId}/status")
    public EventRoundDto status(@PathVariable Long eventId, @PathVariable Long roundId, @RequestBody UpdateRoundStatusRequest request) {
        return service.facultyUpdateStatus(eventId, SecurityUtils.getCurrentFacultyId(), roundId, request.status());
    }
}
