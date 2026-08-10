package com.kec.codingforum.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.Map;
import java.util.UUID;

@Service
public class JwtService {

    private final SecretKey secretKey;
    private final String jwtSecret;
    private final long expirationMinutes;
    private final String issuer;
    private final String audience;
    private final boolean failOnDefaultSecrets;

    public JwtService(
            @Value("${app.jwt.secret}") String jwtSecret,
            @Value("${app.jwt.expiration-minutes}") long expirationMinutes,
            @Value("${app.jwt.issuer:kec-coding-forum}") String issuer,
            @Value("${app.jwt.audience:kec-coding-forum-web}") String audience,
            @Value("${app.security.fail-on-default-secrets:false}") boolean failOnDefaultSecrets
    ) {
        this.jwtSecret = jwtSecret;
        this.secretKey = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
        this.expirationMinutes = expirationMinutes;
        this.issuer = issuer;
        this.audience = audience;
        this.failOnDefaultSecrets = failOnDefaultSecrets;
    }

    @PostConstruct
    void validateSecretConfiguration() {
        if (jwtSecret == null || jwtSecret.getBytes(StandardCharsets.UTF_8).length < 32) {
            throw new IllegalStateException("JWT_SECRET must be at least 32 bytes.");
        }
        if (failOnDefaultSecrets && jwtSecret.contains("dev-only-auth-secret")) {
            throw new IllegalStateException("JWT_SECRET must be replaced before production startup.");
        }
        if (expirationMinutes < 5 || expirationMinutes > 24 * 60) {
            throw new IllegalStateException("JWT_EXPIRATION_MINUTES must be between 5 and 1440.");
        }
    }

    public String createToken(CustomUserPrincipal principal) {
        Instant now = Instant.now();
        return Jwts.builder()
                .id(UUID.randomUUID().toString())
                .subject(principal.getEmail())
                .issuer(issuer)
                .audience()
                .add(audience)
                .and()
                .claims(Map.of(
                        "userId", principal.getUserId(),
                        "role", principal.getRole()
                ))
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plusSeconds(expirationMinutes * 60)))
                .signWith(secretKey)
                .compact();
    }

    public Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(secretKey)
                .requireIssuer(issuer)
                .requireAudience(audience)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
