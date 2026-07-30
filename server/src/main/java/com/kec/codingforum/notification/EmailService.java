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
    private final String fromAddress;

    public EmailService(
            JavaMailSender mailSender,
            @Value("${app.notifications.email-enabled:false}") boolean enabled,
            @Value("${app.notifications.from-name:KEC Coding Forum}") String fromName,
            @Value("${spring.mail.username:}") String username,
            @Value("${app.notifications.from-address:}") String fromAddress
    ) {
        this.mailSender = mailSender;
        this.enabled = enabled;
        this.fromName = fromName;
        this.username = username;
        this.fromAddress = fromAddress;
    }

    public void sendEmail(String to, String subject, String htmlBody) {
        send(to, subject, htmlBody, true);
    }

    public void sendPlainTextEmail(String to, String subject, String body) {
        send(to, subject, body, false);
    }

    private void send(String to, String subject, String body, boolean html) {
        if (!enabled || username == null || username.isBlank()) {
            return;
        }
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true);
            helper.setTo(to);
            helper.setFrom(resolvedFromAddress(), fromName);
            helper.setSubject(subject);
            helper.setText(body, html);
            mailSender.send(message);
        } catch (Exception exception) {
            throw new IllegalStateException(exception.getMessage(), exception);
        }
    }

    public boolean isEnabled() {
        return enabled && username != null && !username.isBlank();
    }

    private String resolvedFromAddress() {
        if (fromAddress != null && !fromAddress.isBlank()) {
            return fromAddress;
        }
        return username;
    }
}
