package com.kec.codingforum.audit;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    @Query("""
            select log from AuditLog log
            where (:action is null or log.action = :action)
              and (:outcome is null or log.outcome = :outcome)
              and (:actorEmail is null or lower(log.actorEmail) like lower(concat('%', :actorEmail, '%')))
            order by log.createdAt desc
            """)
    Page<AuditLog> search(
            @Param("action") String action,
            @Param("outcome") String outcome,
            @Param("actorEmail") String actorEmail,
            Pageable pageable
    );
}
