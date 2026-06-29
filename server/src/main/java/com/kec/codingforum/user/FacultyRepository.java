package com.kec.codingforum.user;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface FacultyRepository extends JpaRepository<Faculty, Long>, JpaSpecificationExecutor<Faculty> {

    boolean existsByFacultyCodeIgnoreCase(String facultyCode);

    boolean existsByEmailIgnoreCase(String email);
}
