package com.kec.codingforum.team;

import com.kec.codingforum.event.Event;
import com.kec.codingforum.event.EventProblemStatement;
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
@Table(name = "teams")
public class Team {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "event_id")
    private Event event;

    @Column(name = "team_name", nullable = false)
    private String teamName;

    @Column(name = "team_code", nullable = false, unique = true)
    private String teamCode;

    @ManyToOne
    @JoinColumn(name = "leader_student_id")
    private Student leaderStudent;

    @Column(name = "locked_after_registration", nullable = false)
    private boolean lockedAfterRegistration = false;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @ManyToOne
    @JoinColumn(name = "problem_statement_id")
    private EventProblemStatement problemStatement;
}
