package com.kec.codingforum.notification;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.kec.codingforum.notification.dto.NotificationDto;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;

import java.io.IOException;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class WebSocketNotificationService {

    private final Map<Long, Set<WebSocketSession>> sessions = new ConcurrentHashMap<>();
    private final ObjectMapper objectMapper;
    private final boolean enabled;

    public WebSocketNotificationService(ObjectMapper objectMapper, @Value("${app.notifications.websocket-enabled:true}") boolean enabled) {
        this.objectMapper = objectMapper;
        this.enabled = enabled;
    }

    public void register(Long userId, WebSocketSession session) {
        if (!enabled) {
            return;
        }
        sessions.computeIfAbsent(userId, key -> ConcurrentHashMap.newKeySet()).add(session);
    }

    public void unregister(Long userId, WebSocketSession session) {
        Set<WebSocketSession> userSessions = sessions.get(userId);
        if (userSessions != null) {
            userSessions.remove(session);
        }
    }

    public void send(Long userId, NotificationDto notification) {
        if (!enabled) {
            return;
        }
        Set<WebSocketSession> userSessions = sessions.get(userId);
        if (userSessions == null || userSessions.isEmpty()) {
            return;
        }
        try {
            TextMessage message = new TextMessage(objectMapper.writeValueAsString(notification));
            for (WebSocketSession session : userSessions) {
                if (session.isOpen()) {
                    session.sendMessage(message);
                }
            }
        } catch (IOException ignored) {
            // Real-time delivery is best effort; REST polling remains the fallback.
        }
    }
}
