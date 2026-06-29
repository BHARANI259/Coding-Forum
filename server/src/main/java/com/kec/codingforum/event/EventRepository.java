package com.kec.codingforum.event;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;
import java.util.Optional;

public interface EventRepository extends JpaRepository<Event, Long>, JpaSpecificationExecutor<Event> {

    List<Event> findByInchargesIdOrderByStartDatetimeDesc(Long facultyId);

    Optional<Event> findByIdAndInchargesId(Long id, Long facultyId);

    List<Event> findByStatusInOrderByStartDatetimeAsc(List<String> statuses);
}
