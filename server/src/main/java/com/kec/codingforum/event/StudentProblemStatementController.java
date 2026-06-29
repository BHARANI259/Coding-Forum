package com.kec.codingforum.event;

import com.kec.codingforum.event.dto.ProblemStatementDto;
import com.kec.codingforum.security.SecurityUtils;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/student/events/{eventId}/problem-statements")
@PreAuthorize("hasRole('STUDENT')")
public class StudentProblemStatementController {

    private final EventProblemStatementService service;

    public StudentProblemStatementController(EventProblemStatementService service) {
        this.service = service;
    }

    @GetMapping
    public List<ProblemStatementDto> list(@PathVariable Long eventId) {
        return service.studentList(eventId, SecurityUtils.getCurrentStudentId());
    }
}
