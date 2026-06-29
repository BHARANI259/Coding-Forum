package com.kec.codingforum.notification;

import org.springframework.stereotype.Service;

@Service
public class NotificationTemplateService {

    public String subject(String type, String title) {
        return switch (type) {
            case "EVENT_PUBLISHED" -> "New Event Published: " + title;
            case "REGISTRATION_COMPLETED" -> "Registration Confirmed: " + title;
            case "TEAM_JOINED" -> "Team Update: " + title;
            case "RESULT_PUBLISHED" -> "Results Published: " + title;
            case "EVENT_COMPLETED" -> "Event Completed: " + title;
            case "REGISTRATION_CLOSED" -> "Registration Closed: " + title;
            case "ROUND_UPDATED" -> "Round Updated: " + title;
            case "PROBLEM_STATEMENT_UPDATED" -> "Problem Statement Updated: " + title;
            default -> title;
        };
    }

    public String htmlBody(String title, String message) {
        return """
                <div style="font-family:Arial,sans-serif;color:#1F2937">
                  <h2 style="margin-bottom:4px">KEC Coding Forum</h2>
                  <h3 style="color:#6D4CC2">%s</h3>
                  <p style="line-height:1.6">%s</p>
                  <hr/>
                  <p style="font-size:12px;color:#6B7280">This is an automated message from KEC Coding Forum.</p>
                </div>
                """.formatted(escape(title), escape(message));
    }

    private String escape(String value) {
        if (value == null) {
            return "";
        }
        return value.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;");
    }
}
