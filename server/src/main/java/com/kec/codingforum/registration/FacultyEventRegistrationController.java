package com.kec.codingforum.registration;

import com.kec.codingforum.registration.dto.EventRegistrationDto;
import com.kec.codingforum.security.SecurityUtils;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/faculty/events/{eventId}/registrations")
@PreAuthorize("hasRole('FACULTY')")
public class FacultyEventRegistrationController {

    private final RegistrationService registrationService;

    public FacultyEventRegistrationController(RegistrationService registrationService) {
        this.registrationService = registrationService;
    }

    @GetMapping
    public List<EventRegistrationDto> registrations(@PathVariable Long eventId) {
        return registrationService.getEventRegistrationsForFaculty(eventId, SecurityUtils.getCurrentFacultyId());
    }
}
