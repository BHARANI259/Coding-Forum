package com.kec.codingforum.report;

import com.kec.codingforum.report.ReportModels.DepartmentReportData;
import com.kec.codingforum.report.ReportModels.EventMediaReportRow;
import com.kec.codingforum.report.ReportModels.EventParticipantReportRow;
import com.kec.codingforum.report.ReportModels.EventReportData;
import com.kec.codingforum.report.ReportModels.EventResultReportRow;
import com.kec.codingforum.report.ReportModels.EventTeamReportRow;
import com.lowagie.text.Document;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.Image;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.time.Month;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class PdfReportService {

    private static final Font TITLE = new Font(Font.HELVETICA, 14, Font.BOLD);
    private static final Font COLLEGE = new Font(Font.HELVETICA, 12, Font.BOLD);
    private static final Font SUBTITLE = new Font(Font.HELVETICA, 10, Font.NORMAL);
    private static final Font META = new Font(Font.HELVETICA, 9, Font.NORMAL);
    private static final Font SECTION = new Font(Font.HELVETICA, 12, Font.BOLD);
    private static final Font NORMAL = new Font(Font.HELVETICA, 8, Font.NORMAL);
    private static final Font HEADER = new Font(Font.HELVETICA, 8, Font.BOLD, Color.WHITE);

    public byte[] eventReport(EventReportData data) {
        ByteArrayOutputStream output = new ByteArrayOutputStream();
        Document document = new Document(PageSize.A4.rotate(), 28, 28, 28, 28);
        PdfWriter.getInstance(document, output);
        document.open();

        addHeader(document, "Event Report", eventHeldOn(data));
        addSingleEventSections(document, data);

        document.close();
        return output.toByteArray();
    }

    public byte[] yearlyEventReport(List<EventReportData> events, String academicYear) {
        ByteArrayOutputStream output = new ByteArrayOutputStream();
        Document document = new Document(PageSize.A4.rotate(), 28, 28, 28, 28);
        PdfWriter.getInstance(document, output);
        document.open();

        addHeader(document, "Yearly Event Report - " + academicYear, null);
        if (events == null || events.isEmpty()) {
            addSection(document, "Events");
            table(document, new String[]{"Events"}, List.of());
        } else {
            for (int index = 0; index < events.size(); index++) {
                EventReportData data = events.get(index);
                if (index > 0) {
                    document.newPage();
                }
                Paragraph eventTitle = new Paragraph("Event " + (index + 1) + ": " + data.title(), TITLE);
                eventTitle.setSpacingBefore(4);
                eventTitle.setSpacingAfter(8);
                document.add(eventTitle);
                addSingleEventSections(document, data);
            }
        }

        document.close();
        return output.toByteArray();
    }

    private void addSingleEventSections(Document document, EventReportData data) {
        addSection(document, "Event Summary");
        addKeyValueTable(document, List.of(
                row("Event", data.title()),
                row("Category", data.category()),
                row("Type", data.eventType()),
                row("Venue", data.venue()),
                row("Event Date/Time", format(data.startDatetime()) + " to " + format(data.endDatetime())),
                row("Registration Timeline", format(data.registrationStart()) + " to " + format(data.registrationEnd())),
                row("Status", data.status()),
                row("Registration", data.registrationOpen() ? "Open" : "Closed"),
                row("Results Published", data.resultsPublished() ? "Yes, " + format(data.resultsPublishedAt()) : "No")
        ));

        addSection(document, "Restrictions");
        addKeyValueTable(document, List.of(
                row("Allowed Departments", orAll(data.allowedDepartments())),
                row("Allowed Years", orAll(data.allowedYears())),
                row("Allowed Sections", orAll(data.allowedSections())),
                row("Allowed Technical Areas", orAll(data.allowedTechnicalAreas())),
                row("Placement Willing Only", data.placementWillingOnly() ? "Yes" : "No"),
                row("Max Participants", value(data.maxParticipants())),
                row("Max Teams", value(data.maxTeams())),
                row("Team Size", value(data.minTeamSize()) + " - " + value(data.maxTeamSize()))
        ));

        addSection(document, "Faculty Incharges");
        table(document, new String[]{"Name", "Code", "Email", "Department"}, data.incharges().stream()
                .map(row -> new String[]{row.name(), value(row.facultyCode()), row.email(), row.department()})
                .toList());

        addSection(document, "Problem Statements");
        table(document, new String[]{"Title", "Description", "Reference", "Active"}, data.problemStatements().stream()
                .map(row -> new String[]{row.title(), value(row.description()), value(row.referenceLink()), row.active() ? "Yes" : "No"})
                .toList());

        addSection(document, "Rounds");
        table(document, new String[]{"Order", "Round", "Final", "Status", "Scheduled", "Description"}, data.rounds().stream()
                .map(row -> new String[]{value(row.order()), row.name(), row.finalRound() ? "Yes" : "No", row.status(), format(row.scheduledAt()), value(row.description())})
                .toList());

        addSection(document, "Participation Summary");
        addKeyValueTable(document, List.of(
                row("Total Registered Students", String.valueOf(data.participants().stream().filter(item -> "REGISTERED".equals(item.registrationStatus())).count())),
                row("Total Registered Teams", String.valueOf(data.teams().stream().filter(item -> "REGISTERED".equals(item.registrationStatus())).count())),
                row("Software Participants", String.valueOf(data.participants().stream().filter(item -> "SOFTWARE".equals(item.technicalArea())).count())),
                row("Hardware Participants", String.valueOf(data.participants().stream().filter(item -> "HARDWARE".equals(item.technicalArea())).count()))
        ));

        addSection(document, "Participants / Teams");
        if ("TEAM".equals(data.eventType())) {
            table(document, new String[]{"Team", "Code", "Leader", "Members", "Problem", "Status", "Result", "Points"}, data.teams().stream()
                    .map(row -> new String[]{row.teamName(), row.teamCode(), row.leaderName(), value(row.memberCount()), value(row.selectedProblemStatement()), row.registrationStatus(), value(row.resultType()), value(row.pointsPerMember())})
                    .toList());
        } else {
            table(document, new String[]{"Register No", "Name", "Department", "Year", "Section", "Area", "Problem", "Status", "Result", "Points"}, data.participants().stream()
                    .map(row -> new String[]{row.registerNumber(), row.studentName(), row.departmentCode(), value(row.year()), value(row.section()), row.technicalArea(), value(row.selectedProblemStatement()), row.registrationStatus(), value(row.resultType()), value(row.pointsAwarded())})
                    .toList());
        }

        addSection(document, "Results");
        table(document, new String[]{"Type", "Student/Team", "Department", "Result", "Points", "Declared By", "Declared At"}, data.results().stream()
                .map(this::resultRow)
                .toList());

        addSection(document, "Department Summary");
        table(document, new String[]{"Department", "Participants", "Points", "Wins", "Runner Ups"}, data.departmentSummary().stream()
                .map(row -> new String[]{row.departmentCode(), String.valueOf(row.participants()), String.valueOf(row.points()), String.valueOf(row.wins()), String.valueOf(row.runnerUps())})
                .toList());

        addSection(document, "Post-Event Images");
        addEventImages(document, data.media());
    }

    public byte[] departmentReport(DepartmentReportData data) {
        ByteArrayOutputStream output = new ByteArrayOutputStream();
        Document document = new Document(PageSize.A4, 28, 28, 28, 28);
        PdfWriter.getInstance(document, output);
        document.open();

        addHeader(document, "Department Performance Report", null);
        addSection(document, data.departmentCode() + " - " + data.departmentName());
        addKeyValueTable(document, List.of(
                row("Total Students", String.valueOf(data.totalStudents())),
                row("Active Students", String.valueOf(data.totalActiveStudents())),
                row("Participations", String.valueOf(data.totalParticipations())),
                row("Total Points", String.valueOf(data.totalPoints())),
                row("Wins", String.valueOf(data.wins())),
                row("Runner Ups", String.valueOf(data.runnerUps()))
        ));

        addSection(document, "Category-wise Performance");
        table(document, new String[]{"Category", "Points", "Results", "Participants"}, data.categoryPerformance().stream()
                .map(row -> new String[]{row.category(), String.valueOf(row.points()), String.valueOf(row.results()), String.valueOf(row.participants())})
                .toList());

        addSection(document, "Top Students");
        table(document, new String[]{"Register No", "Student", "Area", "Events", "Points", "Wins", "Runner Ups"}, data.students().stream().limit(20)
                .map(row -> new String[]{row.registerNumber(), row.studentName(), row.technicalArea(), String.valueOf(row.eventsParticipated()), String.valueOf(row.totalPoints()), String.valueOf(row.wins()), String.valueOf(row.runnerUps())})
                .toList());

        document.close();
        return output.toByteArray();
    }

    private void addHeader(Document document, String reportTitle, String eventHeldOn) {
        Paragraph college = new Paragraph("KONGU ENGINEERING COLLEGE, PERUNDURAI, ERODE-638 060", COLLEGE);
        college.setAlignment(Element.ALIGN_CENTER);
        document.add(college);

        Paragraph autonomous = new Paragraph("(Autonomous)", SUBTITLE);
        autonomous.setAlignment(Element.ALIGN_CENTER);
        autonomous.setSpacingAfter(2);
        document.add(autonomous);

        Paragraph forum = new Paragraph("KEC CODING FORUM", TITLE);
        forum.setAlignment(Element.ALIGN_CENTER);
        forum.setSpacingAfter(2);
        document.add(forum);

        Paragraph academicYear = new Paragraph("Academic Year: " + academicYear(LocalDateTime.now()), META);
        academicYear.setAlignment(Element.ALIGN_CENTER);
        academicYear.setSpacingAfter(8);
        document.add(academicYear);

        Paragraph title = new Paragraph(reportTitle, TITLE);
        title.setAlignment(Element.ALIGN_CENTER);
        title.setSpacingAfter(8);
        document.add(title);

        PdfPTable meta = new PdfPTable(2);
        meta.setWidthPercentage(100);
        meta.addCell(metaCell(eventHeldOn == null ? "" : "Event held on: " + eventHeldOn, Element.ALIGN_LEFT));
        meta.addCell(metaCell("Report generated on: " + displayDateTime(LocalDateTime.now()), Element.ALIGN_RIGHT));
        meta.setSpacingAfter(12);
        document.add(meta);
    }

    private PdfPCell metaCell(String text, int alignment) {
        PdfPCell cell = new PdfPCell(new Phrase(text, META));
        cell.setBorder(PdfPCell.NO_BORDER);
        cell.setHorizontalAlignment(alignment);
        cell.setPadding(2);
        return cell;
    }

    private void addSection(Document document, String title) {
        Paragraph paragraph = new Paragraph(title, SECTION);
        paragraph.setSpacingBefore(10);
        paragraph.setSpacingAfter(5);
        document.add(paragraph);
    }

    private void addKeyValueTable(Document document, List<String[]> rows) {
        table(document, new String[]{"Field", "Value"}, rows);
    }

    private void table(Document document, String[] headers, List<String[]> rows) {
        PdfPTable table = new PdfPTable(headers.length);
        table.setWidthPercentage(100);
        for (String header : headers) {
            PdfPCell cell = new PdfPCell(new Phrase(header, HEADER));
            cell.setBackgroundColor(new Color(37, 45, 61));
            cell.setPadding(4);
            table.addCell(cell);
        }
        if (rows.isEmpty()) {
            PdfPCell cell = new PdfPCell(new Phrase("No records available.", NORMAL));
            cell.setColspan(headers.length);
            cell.setPadding(5);
            table.addCell(cell);
        } else {
            for (String[] row : rows) {
                for (String value : row) {
                    PdfPCell cell = new PdfPCell(new Phrase(value(value), NORMAL));
                    cell.setPadding(4);
                    table.addCell(cell);
                }
            }
        }
        document.add(table);
    }

    private void addEventImages(Document document, List<EventMediaReportRow> mediaRows) {
        if (mediaRows == null || mediaRows.isEmpty()) {
            table(document, new String[]{"Images"}, List.of());
            return;
        }

        PdfPTable table = new PdfPTable(2);
        table.setWidthPercentage(100);
        for (EventMediaReportRow media : mediaRows.stream().limit(2).toList()) {
            PdfPCell cell = new PdfPCell();
            cell.setPadding(6);
            try {
                Path path = Path.of(media.filePath());
                if (Files.exists(path) && Files.isRegularFile(path)) {
                    Image image = Image.getInstance(path.toAbsolutePath().toString());
                    image.scaleToFit(340, 190);
                    image.setAlignment(Element.ALIGN_CENTER);
                    cell.addElement(image);
                } else {
                    cell.addElement(new Paragraph("Image file not available.", NORMAL));
                }
            } catch (Exception exception) {
                cell.addElement(new Paragraph("Image could not be rendered.", NORMAL));
            }
            cell.addElement(new Paragraph(value(media.mediaType()) + " - " + value(media.caption()), NORMAL));
            cell.addElement(new Paragraph(value(media.originalFileName()), META));
            table.addCell(cell);
        }
        if (mediaRows.size() == 1) {
            PdfPCell empty = new PdfPCell(new Phrase("", NORMAL));
            empty.setPadding(6);
            table.addCell(empty);
        }
        document.add(table);
    }

    private String[] resultRow(EventResultReportRow row) {
        String participant = row.teamName() == null ? value(row.studentName()) : row.teamName() + " (" + value(row.teamCode()) + ")";
        return new String[]{row.eventType(), participant, value(row.department()), row.resultType(), value(row.pointsAwarded()), row.declaredBy(), format(row.declaredAt())};
    }

    private String[] row(String left, String right) {
        return new String[]{left, value(right)};
    }

    private String format(LocalDateTime value) {
        return value == null ? "-" : value.toString().replace('T', ' ');
    }

    private String displayDateTime(LocalDateTime value) {
        return value == null ? "-" : value.format(DateTimeFormatter.ofPattern("dd MMM yyyy, hh:mm a"));
    }

    private String displayDate(LocalDateTime value) {
        return value == null ? "-" : value.format(DateTimeFormatter.ofPattern("dd MMM yyyy"));
    }

    private String eventHeldOn(EventReportData data) {
        if (data.startDatetime() == null && data.endDatetime() == null) {
            return "-";
        }
        if (data.startDatetime() != null && data.endDatetime() != null && !data.startDatetime().toLocalDate().equals(data.endDatetime().toLocalDate())) {
            return displayDate(data.startDatetime()) + " to " + displayDate(data.endDatetime());
        }
        return displayDate(data.startDatetime() == null ? data.endDatetime() : data.startDatetime());
    }

    private String academicYear(LocalDateTime dateTime) {
        int year = dateTime.getYear();
        if (dateTime.getMonth().getValue() < Month.JUNE.getValue()) {
            return (year - 1) + "-" + String.valueOf(year).substring(2);
        }
        return year + "-" + String.valueOf(year + 1).substring(2);
    }

    private String value(Object value) {
        return value == null || String.valueOf(value).isBlank() ? "-" : String.valueOf(value);
    }

    private String orAll(String value) {
        return value == null || value.isBlank() ? "All" : value;
    }
}
