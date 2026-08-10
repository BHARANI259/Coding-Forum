package com.kec.codingforum.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class SecurityHeadersFilter extends OncePerRequestFilter {

    private final String csp;
    private final String cspReportOnly;
    private final boolean cspEnforced;
    private final boolean hstsEnabled;

    public SecurityHeadersFilter(
            @Value("${app.security.csp:default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'}") String csp,
            @Value("${app.security.csp-report-only:default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'}") String cspReportOnly,
            @Value("${app.security.csp-enforced:false}") boolean cspEnforced,
            @Value("${app.security.hsts-enabled:true}") boolean hstsEnabled
    ) {
        this.csp = csp;
        this.cspReportOnly = cspReportOnly;
        this.cspEnforced = cspEnforced;
        this.hstsEnabled = hstsEnabled;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        response.setHeader("X-Content-Type-Options", "nosniff");
        response.setHeader("X-Frame-Options", "DENY");
        response.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
        response.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
        response.setHeader("Cross-Origin-Opener-Policy", "same-origin");
        if (cspEnforced) {
            response.setHeader("Content-Security-Policy", csp);
        } else {
            response.setHeader("Content-Security-Policy-Report-Only", cspReportOnly);
        }
        if (hstsEnabled && isHttps(request)) {
            response.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
        }

        if (request.getRequestURI().startsWith("/api/")) {
            response.setHeader("Cache-Control", "no-store");
            response.setHeader("Pragma", "no-cache");
        }

        filterChain.doFilter(request, response);
    }

    private boolean isHttps(HttpServletRequest request) {
        String forwardedProto = request.getHeader("X-Forwarded-Proto");
        return request.isSecure() || "https".equalsIgnoreCase(forwardedProto);
    }
}
