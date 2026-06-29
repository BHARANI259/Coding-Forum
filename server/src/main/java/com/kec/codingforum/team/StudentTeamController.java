package com.kec.codingforum.team;

import com.kec.codingforum.registration.RegistrationService;
import com.kec.codingforum.security.SecurityUtils;
import com.kec.codingforum.team.dto.CreateTeamRequest;
import com.kec.codingforum.team.dto.JoinTeamRequest;
import com.kec.codingforum.team.dto.RegisterTeamRequest;
import com.kec.codingforum.team.dto.TeamDetailDto;
import com.kec.codingforum.team.dto.TeamListItemDto;
import com.kec.codingforum.team.dto.TeamRegistrationResponse;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@PreAuthorize("hasRole('STUDENT')")
public class StudentTeamController {

    private final TeamService teamService;
    private final RegistrationService registrationService;

    public StudentTeamController(TeamService teamService, RegistrationService registrationService) {
        this.teamService = teamService;
        this.registrationService = registrationService;
    }

    @PostMapping("/api/student/events/{eventId}/teams")
    public TeamDetailDto createTeam(@PathVariable Long eventId, @Valid @RequestBody CreateTeamRequest request) {
        return teamService.createTeam(eventId, SecurityUtils.getCurrentStudentId(), request.teamName());
    }

    @PostMapping("/api/student/teams/join")
    public TeamDetailDto joinTeam(@Valid @RequestBody JoinTeamRequest request) {
        return teamService.joinTeamByCode(SecurityUtils.getCurrentStudentId(), request.teamCode());
    }

    @GetMapping("/api/student/teams")
    public List<TeamListItemDto> myTeams() {
        return teamService.getMyTeams(SecurityUtils.getCurrentStudentId());
    }

    @GetMapping("/api/student/teams/{teamId}")
    public TeamDetailDto teamDetail(@PathVariable Long teamId) {
        return teamService.getTeamDetail(teamId, SecurityUtils.getCurrentStudentId());
    }

    @DeleteMapping("/api/student/teams/{teamId}/members/me")
    public void leaveTeam(@PathVariable Long teamId) {
        teamService.leaveTeam(teamId, SecurityUtils.getCurrentStudentId());
    }

    @PostMapping("/api/student/teams/{teamId}/register")
    public TeamRegistrationResponse registerTeam(@PathVariable Long teamId, @RequestBody(required = false) RegisterTeamRequest request) {
        return registrationService.registerTeam(teamId, SecurityUtils.getCurrentStudentId(), request == null ? null : request.problemStatementId());
    }
}
