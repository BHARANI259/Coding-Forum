package com.kec.codingforum.event;

import com.kec.codingforum.event.dto.EventRoundDto;
import com.kec.codingforum.event.dto.RoundResultDto;
import com.kec.codingforum.security.SecurityUtils;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/student/events/{eventId}/rounds")
@PreAuthorize("hasRole('STUDENT')")
public class StudentEventRoundController {

    private final EventRoundService service;
    private final EventRoundResultService roundResultService;

    public StudentEventRoundController(EventRoundService service, EventRoundResultService roundResultService) {
        this.service = service;
        this.roundResultService = roundResultService;
    }

    @GetMapping
    public List<EventRoundDto> list(@PathVariable Long eventId) {
        return service.studentList(eventId, SecurityUtils.getCurrentStudentId());
    }

    @GetMapping("/{roundId}/result")
    public RoundResultDto result(@PathVariable Long eventId, @PathVariable Long roundId) {
        return roundResultService.getStudentRoundResult(eventId, roundId, SecurityUtils.getCurrentStudentId());
    }
}
