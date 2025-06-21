package com.farmovo.backend.jwt;

import com.farmovo.backend.services.impl.JwtAuthenticationService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class AuthTokenFilter extends OncePerRequestFilter {

    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private JwtAuthenticationService jwtAuthenticationService;

    private static final Logger authTokenlogger = LoggerFactory.getLogger(AuthTokenFilter.class);


    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {

        authTokenlogger.debug("AuthTokenFilter called for URI: {}", request.getRequestURL());
        try {
            String jwt = extractJwtFromRequest(request);
            if (jwt != null && jwtUtils.validateJwtToken(jwt)) {
                jwtAuthenticationService.setAuthenticationFromToken(jwt, request);
            }
        } catch (Exception e) {
            authTokenlogger.error("Cannot set user authentication", e);
        }
        filterChain.doFilter(request, response);
    }


    private String extractJwtFromRequest(HttpServletRequest request) {
        // Ưu tiên lấy JWT từ Cookie (vì bạn dùng HttpOnly Cookie)
        if (request.getCookies() != null) {
            for (Cookie cookie : request.getCookies()) {
                if ("jwt".equals(cookie.getName())) {
                    return cookie.getValue();
                }
            }
        }

        // Fallback: nếu không có cookie, có thể lấy từ header nếu bạn cho phép
        return jwtUtils.getJwtFromHeader(request);
    }

}
