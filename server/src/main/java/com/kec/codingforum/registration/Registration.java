package com.kec.codingforum.registration;

import com.kec.codingforum.event.Event;
import com.kec.codingforum.event.EventProblemStatement;
import com.kec.codingforum.team.Team;
import com.kec.codingforum.user.Student;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "registrations")
public class Registration {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "event_id")
    private Event event;

    @ManyToOne
    @JoinColumn(name = "student_id")
    private Student student;

    @ManyToOne
    @JoinColumn(name = "team_id")
    private Team team;

    @Column(name = "registration_type", nullable = false)
    private String registrationType;

    @Column(nullable = false)
    private String status = "REGISTERED";

    @Column(name = "registered_at", nullable = false)
    private LocalDateTime registeredAt = LocalDateTime.now();

    @ManyToOne
    @JoinColumn(name = "problem_statement_id")
    private EventProblemStatement problemStatement;
}
