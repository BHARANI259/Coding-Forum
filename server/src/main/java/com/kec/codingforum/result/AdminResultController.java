package com.kec.codingforum.result;

import com.kec.codingforum.result.dto.EventResultSummaryDto;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@PreAuthorize("hasRole('SUPER_ADMIN')")
public class AdminResultController {

    private final ResultService resultService;

    public AdminResultController(ResultService resultService) {
        this.resultService = resultService;
    }

    @GetMapping("/api/admin/events/{eventId}/results")
    public EventResultSummaryDto list(@PathVariable Long eventId) {
        return resultService.listEventResults(eventId);
    }

    @DeleteMapping("/api/admin/results/{resultId}")
    public void delete(@PathVariable Long resultId) {
        resultService.deleteResult(resultId);
    }
}
