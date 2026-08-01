package com.kec.codingforum.event;

import com.kec.codingforum.department.Department;
import com.kec.codingforum.event.dto.EventCategoryDto;
import com.kec.codingforum.event.dto.EventDetailDto;
import com.kec.codingforum.event.dto.EventListItemDto;
import com.kec.codingforum.event.dto.EventOptionDto;
import com.kec.codingforum.user.Faculty;

import java.util.Comparator;
import java.util.List;
import java.util.Set;
import java.util.TreeSet;

final class EventMapper {

    private EventMapper() {
    }

    static EventCategoryDto category(EventCategory category) {
        if (category == null) {
            return null;
        }
        return new EventCategoryDto(
                category.getId(),
                category.getName(),
                category.getWeightage(),
                category.getCategoryType(),
                category.getWinnerPoints(),
                category.getRunnerUpPoints(),
                category.getSecondRunnerUpPoints(),
                category.getParticipantPoints(),
                category.getDisqualifiedPoints(),
                category.getNotPresentedPoints(),
                category.isActive()
        );
    }

    static EventListItemDto listItem(Event event, long roundsCount, long problemStatementCount) {
        return new EventListItemDto(
                event.getId(),
                event.getTitle(),
                category(event.getCategory()),
                event.getEventType(),
                event.getVenue(),
                event.getStartDatetime(),
                event.getEndDatetime(),
                event.isRegistrationOpen(),
                event.getRegistrationStart(),
                event.getRegistrationEnd(),
                event.getStatus(),
                event.isPlacementWillingOnly(),
                event.getMinTeamSize(),
                event.getMaxTeamSize(),
                event.getMaxParticipants(),
                event.getMaxTeams(),
                departments(event),
                event.isMandatoryEvent(),
                sortedYears(event.getAllowedYears()),
                sortedSections(event.getAllowedSections()),
                faculties(event),
                new TreeSet<>(event.getAllowedTechnicalAreas()),
                roundsCount,
                problemStatementCount,
                event.isResultsPublished(),
                event.getPosterImageUrl(),
                event.getPosterOriginalName(),
                event.getPosterContentType(),
                event.getPosterSizeBytes(),
                event.getPosterUploadedAt()
        );
    }

    static EventDetailDto detail(Event event, long roundsCount, long problemStatementCount) {
        return new EventDetailDto(
                event.getId(),
                event.getTitle(),
                event.getDescription(),
                category(event.getCategory()),
                event.getEventType(),
                event.getVenue(),
                event.getStartDatetime(),
                event.getEndDatetime(),
                event.isRegistrationOpen(),
                event.getRegistrationStart(),
                event.getRegistrationEnd(),
                event.getMinTeamSize(),
                event.getMaxTeamSize(),
                event.getMaxParticipants(),
                event.getMaxTeams(),
                event.isPlacementWillingOnly(),
                event.isMandatoryEvent(),
                event.getStatus(),
                event.getCreatedBy() == null ? null : event.getCreatedBy().getId(),
                event.getCreatedAt(),
                event.getUpdatedAt(),
                departments(event),
                sortedYears(event.getAllowedYears()),
                sortedSections(event.getAllowedSections()),
                faculties(event),
                new TreeSet<>(event.getAllowedTechnicalAreas()),
                roundsCount,
                problemStatementCount,
                event.isResultsPublished(),
                event.getResultsPublishedAt(),
                event.getPosterImageUrl(),
                event.getPosterOriginalName(),
                event.getPosterContentType(),
                event.getPosterSizeBytes(),
                event.getPosterUploadedAt()
        );
    }

    private static List<EventOptionDto> departments(Event event) {
        return event.getAllowedDepartments().stream()
                .sorted(Comparator.comparing(Department::getCode))
                .map(department -> new EventOptionDto(department.getId(), department.getCode(), department.getName()))
                .toList();
    }

    private static List<EventOptionDto> faculties(Event event) {
        return event.getIncharges().stream()
                .sorted(Comparator.comparing(Faculty::getName))
                .map(faculty -> new EventOptionDto(faculty.getId(), faculty.getName(), facultyContact(faculty)))
                .toList();
    }

    private static String facultyContact(Faculty faculty) {
        if (faculty.getContactNumber() != null && !faculty.getContactNumber().isBlank()) {
            return faculty.getContactNumber();
        }
        return faculty.getEmail();
    }

    private static Set<Integer> sortedYears(Set<Integer> values) {
        return new TreeSet<>(values);
    }

    private static Set<String> sortedSections(Set<String> values) {
        return new TreeSet<>(String.CASE_INSENSITIVE_ORDER) {{
            addAll(values);
        }};
    }
}
