package com.kec.codingforum.analytics;

import com.kec.codingforum.analytics.dto.DepartmentLeaderboardRowDto;
import com.kec.codingforum.analytics.dto.PageDto;
import com.kec.codingforum.analytics.dto.StudentLeaderboardRowDto;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/leaderboard")
public class LeaderboardController {

    private final LeaderboardService leaderboardService;

    public LeaderboardController(LeaderboardService leaderboardService) {
        this.leaderboardService = leaderboardService;
    }

    @GetMapping("/students")
    public PageDto<StudentLeaderboardRowDto> students(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "10") int size, @RequestParam(required = false) Long departmentId, @RequestParam(required = false) Long categoryId, @RequestParam(required = false) String search) {
        return leaderboardService.studentLeaderboard(page, size, departmentId, categoryId, search);
    }

    @GetMapping("/departments")
    public List<DepartmentLeaderboardRowDto> departments(@RequestParam(required = false) Long categoryId) {
        return leaderboardService.departmentLeaderboard(categoryId);
    }

    @GetMapping("/categories/{categoryId}/students")
    public PageDto<StudentLeaderboardRowDto> categoryStudents(@PathVariable Long categoryId, @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "10") int size) {
        return leaderboardService.categoryStudentLeaderboard(categoryId, page, size);
    }

    @GetMapping("/best-coders")
    public PageDto<StudentLeaderboardRowDto> bestCoders(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "10") int size) {
        return leaderboardService.bestCoders(page, size);
    }

    @GetMapping("/top-engaging-students")
    public PageDto<StudentLeaderboardRowDto> engaging(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "10") int size) {
        return leaderboardService.topEngagingStudents(page, size);
    }
}
