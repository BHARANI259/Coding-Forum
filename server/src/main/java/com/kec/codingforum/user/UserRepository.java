package com.kec.codingforum.user;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmailIgnoreCase(String email);

    boolean existsByEmailIgnoreCase(String email);

    boolean existsByEmailIgnoreCaseAndIdNot(String email, Long id);

    Optional<User> findByStudentId(Long studentId);

    Optional<User> findByFacultyId(Long facultyId);

    List<User> findByStudentIdIn(Collection<Long> studentIds);

    List<User> findByFacultyIdIn(Collection<Long> facultyIds);
}
