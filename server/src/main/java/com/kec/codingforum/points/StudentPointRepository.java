package com.kec.codingforum.points;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface StudentPointRepository extends JpaRepository<StudentPoint, Long> {

    void deleteByReason(String reason);

    void deleteByStudentIdAndEventIdAndReason(Long studentId, Long eventId, String reason);

    List<StudentPoint> findByStudentIdOrderByCreatedAtDesc(Long studentId);

    List<StudentPoint> findByReason(String reason);

    List<StudentPoint> findByEventIdOrderByCreatedAtDesc(Long eventId);

    List<StudentPoint> findByDepartmentIdOrderByCreatedAtDesc(Long departmentId);
}
