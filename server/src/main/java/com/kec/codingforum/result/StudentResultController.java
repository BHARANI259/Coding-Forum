package com.kec.codingforum.result;

import com.kec.codingforum.result.dto.StudentResultDto;
import com.kec.codingforum.security.SecurityUtils;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/student")
@PreAuthorize("hasRole('STUDENT')")
public class StudentResultController {

    private final ResultService resultService;

    public StudentResultController(ResultService resultService) {
        this.resultService = resultService;
    }

    @GetMapping("/results")
    public List<StudentResultDto> myResults() {
        return resultService.getStudentResults(SecurityUtils.getCurrentStudentId());
    }

    @GetMapping("/events/{eventId}/results")
    public StudentResultDto eventResult(@PathVariable Long eventId) {
        return resultService.getStudentEventResult(eventId, SecurityUtils.getCurrentStudentId());
    }
}
