package com.kec.codingforum.result;

import com.kec.codingforum.result.dto.DeclareIndividualResultRequest;
import com.kec.codingforum.result.dto.DeclareTeamResultRequest;
import com.kec.codingforum.result.dto.EventResultSummaryDto;
import com.kec.codingforum.result.dto.PublishResultsResponse;
import com.kec.codingforum.result.dto.ResultDto;
import com.kec.codingforum.security.SecurityUtils;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
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

    @PostMapping("/api/admin/events/{eventId}/results/individual")
    public ResultDto declareIndividual(@PathVariable Long eventId, @Valid @RequestBody DeclareIndividualResultRequest request) {
        return resultService.declareIndividualResult(eventId, request.studentId(), request.resultType(), SecurityUtils.getCurrentUserId());
    }

    @PostMapping("/api/admin/events/{eventId}/results/team")
    public ResultDto declareTeam(@PathVariable Long eventId, @Valid @RequestBody DeclareTeamResultRequest request) {
        return resultService.declareTeamResult(eventId, request.teamId(), request.resultType(), SecurityUtils.getCurrentUserId());
    }

    @PostMapping("/api/admin/events/{eventId}/results/publish")
    public PublishResultsResponse publish(@PathVariable Long eventId) {
        return resultService.publishResults(eventId);
    }

    @DeleteMapping("/api/admin/results/{resultId}")
    public void delete(@PathVariable Long resultId) {
        resultService.deleteResult(resultId);
    }
}
