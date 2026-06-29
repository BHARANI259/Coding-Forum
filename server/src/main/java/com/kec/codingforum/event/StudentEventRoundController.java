package com.kec.codingforum.event;

import com.kec.codingforum.event.dto.EventRoundDto;
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

    public StudentEventRoundController(EventRoundService service) {
        this.service = service;
    }

    @GetMapping
    public List<EventRoundDto> list(@PathVariable Long eventId) {
        return service.studentList(eventId, SecurityUtils.getCurrentStudentId());
    }
}
