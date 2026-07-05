package com.kec.codingforum.analytics.dto;

public record AdminAnalyticsSummaryDto(
        Long totalStudents,
        Long totalFaculty,
        Long totalDepartments,
        Long totalEvents,
        Long publishedEvents,
        Long completedEvents,
        Long activeEvents,
        Long totalRegistrations,
        Long totalTeams,
        Long totalResults,
        Long totalPointsAwarded,
        Long totalProblemStatements,
        Long totalEventMedia
) {
}
