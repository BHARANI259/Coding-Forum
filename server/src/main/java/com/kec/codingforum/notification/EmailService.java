package com.kec.codingforum.notification;

import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private final JavaMailSender mailSender;
    private final boolean enabled;
    private final String fromName;
    private final String username;

    public EmailService(
            JavaMailSender mailSender,
            @Value("${app.notifications.email-enabled:false}") boolean enabled,
            @Value("${app.notifications.from-name:KEC Coding Forum}") String fromName,
            @Value("${spring.mail.username:}") String username
    ) {
        this.mailSender = mailSender;
        this.enabled = enabled;
        this.fromName = fromName;
        this.username = username;
    }

    public void sendEmail(String to, String subject, String htmlBody) {
        if (!enabled || username == null || username.isBlank()) {
            return;
        }
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true);
            helper.setTo(to);
            helper.setFrom(username, fromName);
            helper.setSubject(subject);
            helper.setText(htmlBody, true);
            mailSender.send(message);
        } catch (Exception exception) {
            throw new IllegalStateException(exception.getMessage(), exception);
        }
    }

    public boolean isEnabled() {
        return enabled && username != null && !username.isBlank();
    }
}
