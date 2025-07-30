package com.farmovo.backend.services.impl;

import com.farmovo.backend.exceptions.BadRequestException;
import com.farmovo.backend.jwt.JwtUtils;
import com.farmovo.backend.models.User;
import com.farmovo.backend.services.UserService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Service;

import java.util.Collection;
import java.util.List;

@Service
public class JwtAuthenticationService {

    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private UserDetailsService userDetailsService;

    @Autowired
    private UserService userService;

    public void setAuthenticationFromToken(String jwt, HttpServletRequest request) {
        String username = jwtUtils.getUsernameFromJwtToken(jwt);

        UserDetails userDetails = userDetailsService.loadUserByUsername(username);

        UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());

        authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

        SecurityContextHolder.getContext().setAuthentication(authentication);
    }

    public User extractAuthenticatedUser(HttpServletRequest request) {
        String token = jwtUtils.getJwtFromCookies(request);
        if (token == null) token = jwtUtils.getJwtFromHeader(request);
        if (token == null || !jwtUtils.validateJwtToken(token)) {
            throw new BadRequestException("Token không hợp lệ hoặc đã hết hạn");
        }

        Long userId = jwtUtils.getUserIdFromJwtToken(token);
        return userService.getUserById(userId)
                .orElseThrow(() -> new BadRequestException("Không tìm thấy thông tin người dùng"));
    }

    public List<String> getUserRoles(User user) {
        Collection<? extends GrantedAuthority> authorities = user.getAuthorities();
        if (authorities == null || authorities.isEmpty()) {
            return List.of();
        }

        return authorities.stream()
                .map(GrantedAuthority::getAuthority)
                .map(role -> role.startsWith("ROLE_") ? role.substring(5) : role)
                .toList();
    }

}

