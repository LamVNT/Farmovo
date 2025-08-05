package com.farmovo.backend.jwt;

import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;

@Component
public class JwtUtils {
    private static final Logger logger = LoggerFactory.getLogger(JwtUtils.class);

    @Value("${spring.app.jwtSecret}")
    private String jwtSecret;

    @Value("${spring.app.jwtExpirationMs}")
    private int jwtExpirationMs;

    // Lấy JWT từ header Authorization
    public String getJwtFromHeader(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        logger.debug("Authorization header: {}", bearerToken);
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }

    // Lấy JWT từ cookie tên "jwt"
    public String getJwtFromCookies(HttpServletRequest request) {
        if (request.getCookies() != null) {
            for (Cookie cookie : request.getCookies()) {
                if ("jwt".equals(cookie.getName())) {
                    return cookie.getValue();
                }
            }
        }
        return null;
    }

    // Lấy username từ token
    public String getUsernameFromJwtToken(String token) {
        return Jwts.parser().verifyWith(key())
                .build()
                .parseSignedClaims(token)
                .getPayload()
                .getSubject();
    }

    // ✅ Chỉ giữ 1 method getUserIdFromJwtToken
    public Long getUserIdFromJwtToken(String token) {
        Object userIdObj = Jwts.parser().verifyWith(key())
                .build()
                .parseSignedClaims(token)
                .getPayload()
                .get("userId");
        if (userIdObj != null) {
            try {
                return Long.valueOf(userIdObj.toString());
            } catch (NumberFormatException e) {
                logger.warn("userId in JWT is not a valid Long: {}", userIdObj);
            }
        }
        return null;
    }

    // ✅ Method với expiry time mặc định từ config
    public String generateTokenWithUserId(UserDetails userDetails, Long userId) {
        return generateTokenWithUserId(userDetails, userId, jwtExpirationMs);
    }

    // ✅ Method với expiry time tùy chỉnh (cho Remember Me)
    public String generateTokenWithUserId(UserDetails userDetails, Long userId, long expirationMs) {
        String username = userDetails.getUsername();
        return Jwts.builder()
                .subject(username)
                .claim("userId", userId)
                .issuedAt(new Date())
                .expiration(new Date((new Date()).getTime() + expirationMs))
                .signWith(key())
                .compact();
    }

    // Tạo key từ jwtSecret
    private SecretKey key() {
        return Keys.hmacShaKeyFor(Decoders.BASE64.decode(jwtSecret));
    }

    // Kiểm tra token hợp lệ
    public boolean validateJwtToken(String authToken) {
        try {
            Jwts.parser().verifyWith(key()).build().parseSignedClaims(authToken);
            return true;
        } catch (MalformedJwtException e) {
            logger.error("Invalid JWT signature: {}", e.getMessage());
        } catch (ExpiredJwtException e) {
            logger.error("Expired JWT signature: {}", e.getMessage());
        } catch (UnsupportedJwtException e) {
            logger.error("Unsupported JWT signature: {}", e.getMessage());
        } catch (IllegalArgumentException e) {
            logger.error("Empty JWT claims string: {}", e.getMessage());
        }
        return false;
    }

    // Ưu tiên lấy token từ header, nếu không có thì lấy từ cookie
    public String getJwtFromRequest(HttpServletRequest request) {
        String token = getJwtFromHeader(request);
        if (token == null && request.getCookies() != null) {
            for (jakarta.servlet.http.Cookie cookie : request.getCookies()) {
                if ("jwt".equals(cookie.getName())) {
                    token = cookie.getValue();
                    break;
                }
            }
        }
        return token;
    }
}
