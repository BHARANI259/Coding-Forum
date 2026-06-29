package com.kec.codingforum.event;

import com.kec.codingforum.user.User;
import com.kec.codingforum.department.Department;
import com.kec.codingforum.user.Faculty;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "events")
public class Event {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    private String description;

    @ManyToOne
    @JoinColumn(name = "category_id")
    private EventCategory category;

    @Column(name = "event_type", nullable = false)
    private String eventType;

    private String venue;
    private LocalDateTime startDatetime;
    private LocalDateTime endDatetime;

    @Column(name = "registration_open", nullable = false)
    private boolean registrationOpen = false;

    private LocalDateTime registrationStart;
    private LocalDateTime registrationEnd;
    private Integer minTeamSize;
    private Integer maxTeamSize;
    private Integer maxParticipants;
    private Integer maxTeams;

    @Column(name = "placement_willing_only", nullable = false)
    private boolean placementWillingOnly = false;

    @Column(nullable = false)
    private String status = "DRAFT";

    @Column(name = "results_published", nullable = false)
    private boolean resultsPublished = false;

    @Column(name = "results_published_at")
    private LocalDateTime resultsPublishedAt;

    @ManyToOne
    @JoinColumn(name = "created_by")
    private User createdBy;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();

    @ManyToMany
    @JoinTable(
            name = "event_allowed_departments",
            joinColumns = @JoinColumn(name = "event_id"),
            inverseJoinColumns = @JoinColumn(name = "department_id")
    )
    private Set<Department> allowedDepartments = new HashSet<>();

    @ElementCollection
    @CollectionTable(name = "event_allowed_years", joinColumns = @JoinColumn(name = "event_id"))
    @Column(name = "year")
    private Set<Integer> allowedYears = new HashSet<>();

    @ElementCollection
    @CollectionTable(name = "event_allowed_sections", joinColumns = @JoinColumn(name = "event_id"))
    @Column(name = "section")
    private Set<String> allowedSections = new HashSet<>();

    @ElementCollection
    @CollectionTable(name = "event_allowed_technical_areas", joinColumns = @JoinColumn(name = "event_id"))
    @Column(name = "technical_area")
    private Set<String> allowedTechnicalAreas = new HashSet<>();

    @ManyToMany
    @JoinTable(
            name = "event_incharges",
            joinColumns = @JoinColumn(name = "event_id"),
            inverseJoinColumns = @JoinColumn(name = "faculty_id")
    )
    private Set<Faculty> incharges = new HashSet<>();
}
