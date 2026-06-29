package com.kec.codingforum.config;

import com.kec.codingforum.notification.NotificationWebSocketHandler;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {

    private final NotificationWebSocketHandler notificationWebSocketHandler;
    private final String allowedOrigin;

    public WebSocketConfig(NotificationWebSocketHandler notificationWebSocketHandler, @Value("${app.cors.allowed-origin:http://localhost:3000}") String allowedOrigin) {
        this.notificationWebSocketHandler = notificationWebSocketHandler;
        this.allowedOrigin = allowedOrigin;
    }

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(notificationWebSocketHandler, "/ws").setAllowedOrigins(allowedOrigin);
    }
}
