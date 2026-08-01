package com.kec.codingforum.event;

import com.kec.codingforum.event.dto.CreateEventCategoryRequest;
import com.kec.codingforum.event.dto.EventCategoryDto;
import com.kec.codingforum.event.dto.UpdateCategoryStatusRequest;
import com.kec.codingforum.event.dto.UpdateEventCategoryRequest;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Set;

@Service
public class EventCategoryService {

    private static final Set<String> CATEGORY_TYPES = Set.of("GENERAL", "CONTEST", "DOMAIN");

    private final EventCategoryRepository categories;

    public EventCategoryService(EventCategoryRepository categories) {
        this.categories = categories;
    }

    @Transactional(readOnly = true)
    public List<EventCategoryDto> list(Boolean active, String search) {
        return categories.findAll(spec(active, search)).stream()
                .map(EventMapper::category)
                .toList();
    }

    @Transactional
    public EventCategoryDto create(CreateEventCategoryRequest request) {
        String name = requiredName(request.name());
        if (categories.existsByNameIgnoreCase(name)) {
            throw new IllegalArgumentException("Event category name already exists.");
        }
        EventCategory category = new EventCategory();
        category.setName(name);
        category.setWeightage(validWeightage(request.weightage()));
        applyPolicy(category, request.categoryType(), request.winnerPoints(), request.runnerUpPoints(), request.secondRunnerUpPoints(), request.participantPoints(), request.disqualifiedPoints(), request.notPresentedPoints());
        category.setActive(request.active() == null || request.active());
        return EventMapper.category(categories.save(category));
    }

    @Transactional
    public EventCategoryDto update(Long id, UpdateEventCategoryRequest request) {
        EventCategory category = categories.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Event category not found."));
        String name = requiredName(request.name());
        categories.findByNameIgnoreCase(name)
                .filter(existing -> !existing.getId().equals(id))
                .ifPresent(existing -> {
                    throw new IllegalArgumentException("Event category name already exists.");
        });
        category.setName(name);
        category.setWeightage(validWeightage(request.weightage()));
        applyPolicy(category, request.categoryType(), request.winnerPoints(), request.runnerUpPoints(), request.secondRunnerUpPoints(), request.participantPoints(), request.disqualifiedPoints(), request.notPresentedPoints());
        category.setActive(request.active());
        return EventMapper.category(category);
    }

    @Transactional
    public EventCategoryDto updateStatus(Long id, UpdateCategoryStatusRequest request) {
        EventCategory category = categories.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Event category not found."));
        category.setActive(request.active());
        return EventMapper.category(category);
    }

    private Specification<EventCategory> spec(Boolean active, String search) {
        return (root, query, builder) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (active != null) {
                predicates.add(builder.equal(root.get("active"), active));
            }
            if (search != null && !search.isBlank()) {
                predicates.add(builder.like(builder.lower(root.get("name")), "%" + search.toLowerCase(Locale.ROOT).trim() + "%"));
            }
            return builder.and(predicates.toArray(Predicate[]::new));
        };
    }

    private String requiredName(String value) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("Category name is required.");
        }
        return value.trim();
    }

    private BigDecimal validWeightage(BigDecimal value) {
        if (value == null) {
            return BigDecimal.ONE;
        }
        if (value.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Weightage must be positive.");
        }
        return value;
    }

    private void applyPolicy(EventCategory category, String categoryType, Integer winnerPoints, Integer runnerUpPoints, Integer secondRunnerUpPoints, Integer participantPoints, Integer disqualifiedPoints, Integer notPresentedPoints) {
        category.setCategoryType(validCategoryType(categoryType));
        category.setWinnerPoints(validPoints(winnerPoints, 100, "Winner points"));
        category.setRunnerUpPoints(validPoints(runnerUpPoints, 60, "Runner-up points"));
        category.setSecondRunnerUpPoints(validPoints(secondRunnerUpPoints, 40, "Second runner-up points"));
        category.setParticipantPoints(validPoints(participantPoints, 10, "Participant points"));
        category.setDisqualifiedPoints(validPoints(disqualifiedPoints, 0, "Disqualified points"));
        category.setNotPresentedPoints(validPoints(notPresentedPoints, 0, "Not presented points"));
    }

    private String validCategoryType(String value) {
        String normalized = value == null || value.isBlank() ? "GENERAL" : value.trim().toUpperCase(Locale.ROOT);
        if (!CATEGORY_TYPES.contains(normalized)) {
            throw new IllegalArgumentException("Category type must be GENERAL, CONTEST, or DOMAIN.");
        }
        return normalized;
    }

    private Integer validPoints(Integer value, int defaultValue, String label) {
        int points = value == null ? defaultValue : value;
        if (points < 0) {
            throw new IllegalArgumentException(label + " cannot be negative.");
        }
        return points;
    }
}
