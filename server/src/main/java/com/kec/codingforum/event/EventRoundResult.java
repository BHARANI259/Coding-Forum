package com.kec.codingforum.event;

import com.kec.codingforum.team.Team;
import com.kec.codingforum.user.Student;
import com.kec.codingforum.user.User;
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
@Table(name = "event_round_results")
public class EventRoundResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "event_id", nullable = false)
    private Event event;

    @ManyToOne
    @JoinColumn(name = "round_id", nullable = false)
    private EventRound round;

    @ManyToOne
    @JoinColumn(name = "team_id")
    private Team team;

    @ManyToOne
    @JoinColumn(name = "student_id")
    private Student student;

    @Column(nullable = false)
    private String status;

    @ManyToOne
    @JoinColumn(name = "declared_by")
    private User declaredBy;

    @Column(name = "declared_at", nullable = false)
    private LocalDateTime declaredAt = LocalDateTime.now();
}
