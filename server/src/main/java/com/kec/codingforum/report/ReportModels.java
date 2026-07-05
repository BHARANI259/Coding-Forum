package com.kec.codingforum.report;

import java.time.LocalDateTime;
import java.util.List;

public final class ReportModels {
    private ReportModels() {
    }

    public record EventReportData(
            Long eventId,
            String title,
            String description,
            String category,
            String eventType,
            String venue,
            LocalDateTime startDatetime,
            LocalDateTime endDatetime,
            LocalDateTime registrationStart,
            LocalDateTime registrationEnd,
            String status,
            boolean registrationOpen,
            boolean resultsPublished,
            LocalDateTime resultsPublishedAt,
            String allowedDepartments,
            String allowedYears,
            String allowedSections,
            String allowedTechnicalAreas,
            boolean placementWillingOnly,
            Integer maxParticipants,
            Integer maxTeams,
            Integer minTeamSize,
            Integer maxTeamSize,
            List<FacultyRow> incharges,
            List<ProblemRow> problemStatements,
            List<RoundRow> rounds,
            List<EventParticipantReportRow> participants,
            List<EventTeamReportRow> teams,
            List<EventResultReportRow> results,
            List<DepartmentSummaryRow> departmentSummary,
            List<EventMediaReportRow> media
    ) {
    }

    public record FacultyRow(String name, String facultyCode, String email, String department) {
    }

    public record ProblemRow(String title, String description, String referenceLink, boolean active) {
    }

    public record RoundRow(Integer order, String name, String status, LocalDateTime scheduledAt, String description, boolean finalRound) {
    }

    public record EventParticipantReportRow(
            String registerNumber,
            String studentName,
            String email,
            String departmentCode,
            String departmentName,
            Integer year,
            String section,
            String technicalArea,
            boolean placementWilling,
            String registrationType,
            String teamName,
            String teamCode,
            boolean teamLeader,
            String selectedProblemStatement,
            String registrationStatus,
            LocalDateTime registeredAt,
            String resultType,
            Integer pointsAwarded
    ) {
    }

    public record EventTeamReportRow(
            Long teamId,
            String teamName,
            String teamCode,
            String leaderRegisterNumber,
            String leaderName,
            Integer memberCount,
            String selectedProblemStatement,
            boolean lockedAfterRegistration,
            String registrationStatus,
            String resultType,
            Integer pointsPerMember
    ) {
    }

    public record EventResultReportRow(
            String event,
            String eventType,
            String category,
            String teamName,
            String teamCode,
            String registerNumber,
            String studentName,
            String department,
            String resultType,
            Integer pointsAwarded,
            String declaredBy,
            LocalDateTime declaredAt,
            boolean resultsPublished
    ) {
    }

    public record PointReportRow(
            String registerNumber,
            String studentName,
            String department,
            String category,
            String event,
            String pointType,
            Integer points,
            String reason,
            LocalDateTime createdAt
    ) {
    }

    public record EventMediaReportRow(
            String mediaType,
            String caption,
            String originalFileName,
            String contentType,
            String filePath
    ) {
    }

    public record DepartmentSummaryRow(String departmentCode, String departmentName, long participants, int points, long wins, long runnerUps) {
    }

    public record DepartmentReportData(
            Long departmentId,
            String departmentCode,
            String departmentName,
            long totalStudents,
            long totalActiveStudents,
            long totalParticipations,
            int totalPoints,
            long wins,
            long runnerUps,
            List<CategorySummaryRow> categoryPerformance,
            List<DepartmentStudentPerformanceRow> students
    ) {
    }

    public record CategorySummaryRow(String category, int points, long results, long participants) {
    }

    public record DepartmentStudentPerformanceRow(
            String registerNumber,
            String studentName,
            String email,
            Integer year,
            String section,
            String technicalArea,
            boolean placementWilling,
            long eventsParticipated,
            int totalPoints,
            long wins,
            long runnerUps,
            long secondRunnerUps,
            long participationCount
    ) {
    }

    public record LeaderboardExportRow(
            int rank,
            String registerNumber,
            String studentName,
            String department,
            Integer year,
            String section,
            String technicalArea,
            long eventsParticipated,
            int totalPoints,
            long wins,
            long runnerUps,
            long secondRunnerUps
    ) {
    }
}
