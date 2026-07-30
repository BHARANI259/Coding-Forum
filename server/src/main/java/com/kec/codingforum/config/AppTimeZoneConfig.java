package com.kec.codingforum.config;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

import java.util.TimeZone;

@Configuration
public class AppTimeZoneConfig {

    private final String timeZone;

    public AppTimeZoneConfig(@Value("${app.time-zone:Asia/Kolkata}") String timeZone) {
        this.timeZone = timeZone;
    }

    @PostConstruct
    public void configureDefaultTimeZone() {
        TimeZone.setDefault(TimeZone.getTimeZone(timeZone));
    }
}
