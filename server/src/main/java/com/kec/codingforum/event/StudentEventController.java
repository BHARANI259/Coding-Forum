package com.kec.codingforum.event;

import com.kec.codingforum.event.dto.EventDetailDto;
import com.kec.codingforum.event.dto.EventListItemDto;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/student/events")
@PreAuthorize("hasRole('STUDENT')")
public class StudentEventController {

    private final StudentEventService studentEventService;

    public StudentEventController(StudentEventService studentEventService) {
        this.studentEventService = studentEventService;
    }

    @GetMapping
    public List<EventListItemDto> list() {
        return studentEventService.listEligible();
    }

    @GetMapping("/{id}")
    public EventDetailDto get(@PathVariable Long id) {
        return studentEventService.getEligible(id);
    }
}
