package com.kec.codingforum.notification;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@RestController
@RequestMapping("/api/admin/mail")
@PreAuthorize("hasRole('SUPER_ADMIN')")
public class AdminMailController {

    private final EmailService emailService;

    public AdminMailController(EmailService emailService) {
        this.emailService = emailService;
    }

    @PostMapping("/test")
    @ResponseStatus(HttpStatus.ACCEPTED)
    public MailTestResponse sendTestMail(@Valid @RequestBody MailTestRequest request) {
        if (!emailService.isEnabled()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "SMTP email is disabled. Set NOTIFICATION_EMAIL_ENABLED=true and configure MAIL_USERNAME and MAIL_PASSWORD."
            );
        }
        String body = """
                KEC Coding Forum SMTP test email

                Your SMTP configuration is working.

                Sent at: %s

                This is an automated test message from KEC Coding Forum.
                """.formatted(LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy hh:mm a")));
        emailService.sendPlainTextEmail(request.to(), "KEC Coding Forum SMTP Test", body);
        return new MailTestResponse("SMTP test email queued successfully.");
    }

    public record MailTestRequest(
            @NotBlank(message = "Recipient email is required.")
            @Email(message = "Recipient email must be valid.")
            String to
    ) {
    }

    public record MailTestResponse(String message) {
    }
}
