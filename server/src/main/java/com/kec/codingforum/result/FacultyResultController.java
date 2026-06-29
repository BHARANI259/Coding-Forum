package com.kec.codingforum.result;

import com.kec.codingforum.event.EventRepository;
import com.kec.codingforum.result.dto.DeclareIndividualResultRequest;
import com.kec.codingforum.result.dto.DeclareTeamResultRequest;
import com.kec.codingforum.result.dto.EventResultSummaryDto;
import com.kec.codingforum.result.dto.PublishResultsResponse;
import com.kec.codingforum.result.dto.ResultDto;
import com.kec.codingforum.security.SecurityUtils;
import jakarta.validation.Valid;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/faculty/events/{eventId}/results")
@PreAuthorize("hasRole('FACULTY')")
public class FacultyResultController {

    private final ResultService resultService;
    private final EventRepository events;

    public FacultyResultController(ResultService resultService, EventRepository events) {
        this.resultService = resultService;
        this.events = events;
    }

    @GetMapping
    public EventResultSummaryDto list(@PathVariable Long eventId) {
        requireAssigned(eventId);
        return resultService.listEventResults(eventId);
    }

    @PostMapping("/individual")
    public ResultDto declareIndividual(@PathVariable Long eventId, @Valid @RequestBody DeclareIndividualResultRequest request) {
        requireAssigned(eventId);
        return resultService.declareIndividualResult(eventId, request.studentId(), request.resultType(), SecurityUtils.getCurrentUserId());
    }

    @PostMapping("/team")
    public ResultDto declareTeam(@PathVariable Long eventId, @Valid @RequestBody DeclareTeamResultRequest request) {
        requireAssigned(eventId);
        return resultService.declareTeamResult(eventId, request.teamId(), request.resultType(), SecurityUtils.getCurrentUserId());
    }

    @PostMapping("/publish")
    public PublishResultsResponse publish(@PathVariable Long eventId) {
        requireAssigned(eventId);
        return resultService.publishResults(eventId);
    }

    private void requireAssigned(Long eventId) {
        events.findByIdAndInchargesId(eventId, SecurityUtils.getCurrentFacultyId())
                .orElseThrow(() -> new AccessDeniedException("This event is not assigned to you."));
    }
}
