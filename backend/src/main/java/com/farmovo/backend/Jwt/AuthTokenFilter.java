package com.farmovo.backend.Jwt;

import com.farmovo.backend.services.impl.JwtAuthenticationService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
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
        String jwt = jwtUtils.getJwtFromHeader(request);
        if (jwt == null) {
            authTokenlogger.debug("No JWT found in request header");
        }
        return jwt;
    }
}
