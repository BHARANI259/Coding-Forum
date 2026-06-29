package com.kec.codingforum.registration;

import com.kec.codingforum.registration.dto.MyRegistrationDto;
import com.kec.codingforum.registration.dto.RegistrationDto;
import com.kec.codingforum.registration.dto.RegisterIndividualRequest;
import com.kec.codingforum.security.SecurityUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/student")
@PreAuthorize("hasRole('STUDENT')")
public class StudentRegistrationController {

    private final RegistrationService registrationService;

    public StudentRegistrationController(RegistrationService registrationService) {
        this.registrationService = registrationService;
    }

    @PostMapping("/events/{eventId}/register")
    public RegistrationDto registerIndividual(@PathVariable Long eventId, @RequestBody(required = false) RegisterIndividualRequest request) {
        return registrationService.registerIndividual(eventId, SecurityUtils.getCurrentStudentId(), request == null ? null : request.problemStatementId());
    }

    @GetMapping("/registrations")
    public List<MyRegistrationDto> myRegistrations() {
        return registrationService.getMyRegistrations(SecurityUtils.getCurrentStudentId());
    }

}
