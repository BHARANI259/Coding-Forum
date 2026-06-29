package com.kec.codingforum.user;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;
import java.util.Optional;

public interface StudentRepository extends JpaRepository<Student, Long>, JpaSpecificationExecutor<Student> {

    boolean existsByRegisterNumberIgnoreCase(String registerNumber);

    boolean existsByEmailIgnoreCase(String email);

    Optional<Student> findByRegisterNumberIgnoreCase(String registerNumber);

    List<Student> findByDepartmentIdOrderByRegisterNumberAsc(Long departmentId);
}
