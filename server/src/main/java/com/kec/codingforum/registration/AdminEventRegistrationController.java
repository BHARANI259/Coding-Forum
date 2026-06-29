package com.kec.codingforum.registration;

import com.kec.codingforum.registration.dto.EventRegistrationDto;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/events/{eventId}/registrations")
@PreAuthorize("hasRole('SUPER_ADMIN')")
public class AdminEventRegistrationController {

    private final RegistrationService registrationService;

    public AdminEventRegistrationController(RegistrationService registrationService) {
        this.registrationService = registrationService;
    }

    @GetMapping
    public List<EventRegistrationDto> registrations(@PathVariable Long eventId) {
        return registrationService.getEventRegistrationsForAdmin(eventId);
    }
}
