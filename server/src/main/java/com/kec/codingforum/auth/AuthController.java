package com.kec.codingforum.auth;

import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/student/login")
    public LoginResponse studentLogin(@Valid @RequestBody LoginRequest request) {
        return authService.login(request, UserRole.STUDENT, "Student");
    }

    @PostMapping("/faculty/login")
    public LoginResponse facultyLogin(@Valid @RequestBody LoginRequest request) {
        return authService.login(request, UserRole.FACULTY, "Faculty");
    }

    @PostMapping("/admin/login")
    public LoginResponse adminLogin(@Valid @RequestBody LoginRequest request) {
        return authService.login(request, UserRole.SUPER_ADMIN, "SuperAdmin");
    }

    @GetMapping("/me")
    public CurrentUserResponse me() {
        return authService.me();
    }

    @PostMapping("/change-password")
    public CurrentUserResponse changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        return authService.changePassword(request);
    }
}

