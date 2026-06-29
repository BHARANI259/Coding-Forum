package com.kec.codingforum.event;

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

    public AdminEventRoundController(EventRoundService service) {
        this.service = service;
    }

    @GetMapping
    public List<EventRoundDto> list(@PathVariable Long eventId) {
        return service.adminList(eventId);
    }

    @PostMapping
    public EventRoundDto create(@PathVariable Long eventId, @Valid @RequestBody CreateEventRoundRequest request) {
        return service.create(eventId, request);
    }

    @PutMapping("/{roundId}")
    public EventRoundDto update(@PathVariable Long eventId, @PathVariable Long roundId, @Valid @RequestBody UpdateEventRoundRequest request) {
        return service.update(eventId, roundId, request);
    }

    @PatchMapping("/{roundId}/status")
    public EventRoundDto status(@PathVariable Long eventId, @PathVariable Long roundId, @RequestBody UpdateRoundStatusRequest request) {
        return service.updateStatus(eventId, roundId, request.status());
    }

    @DeleteMapping("/{roundId}")
    public void delete(@PathVariable Long eventId, @PathVariable Long roundId) {
        service.delete(eventId, roundId);
    }
}
