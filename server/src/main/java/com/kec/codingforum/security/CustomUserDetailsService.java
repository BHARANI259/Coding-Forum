package com.kec.codingforum.security;

import com.kec.codingforum.user.UserRepository;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository users;

    public CustomUserDetailsService(UserRepository users) {
        this.users = users;
    }

    @Override
    public UserDetails loadUserByUsername(String username) {
        return users.findByEmailIgnoreCase(username)
                .map(CustomUserPrincipal::new)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
    }
}

