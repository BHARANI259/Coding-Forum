package com.kec.codingforum.event;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "event_categories")
public class EventCategory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    @Column(nullable = false)
    private BigDecimal weightage = BigDecimal.ONE;

    @Column(name = "category_type", nullable = false)
    private String categoryType = "GENERAL";

    @Column(name = "winner_points", nullable = false)
    private Integer winnerPoints = 100;

    @Column(name = "runner_up_points", nullable = false)
    private Integer runnerUpPoints = 60;

    @Column(name = "second_runner_up_points", nullable = false)
    private Integer secondRunnerUpPoints = 40;

    @Column(name = "participant_points", nullable = false)
    private Integer participantPoints = 10;

    @Column(name = "disqualified_points", nullable = false)
    private Integer disqualifiedPoints = 0;

    @Column(name = "not_presented_points", nullable = false)
    private Integer notPresentedPoints = 0;

    @Column(nullable = false)
    private boolean active = true;
}
