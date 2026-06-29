package com.kec.codingforum.event;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Optional;

public interface EventCategoryRepository extends JpaRepository<EventCategory, Long>, JpaSpecificationExecutor<EventCategory> {

    boolean existsByNameIgnoreCase(String name);

    Optional<EventCategory> findByNameIgnoreCase(String name);
}
