package com.farmovo.backend.utils;

import org.springframework.security.core.GrantedAuthority;

import java.util.Collection;
import java.util.Collections;
import java.util.HashSet;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

public final class RoleUtils {
    private RoleUtils() {}

    public static String normalize(String role) {
        if (role == null) return "";
        String upper = role.toUpperCase();
        return upper.startsWith("ROLE_") ? upper.substring(5) : upper;
    }

    public static Set<String> toNormalizedSet(Collection<? extends GrantedAuthority> authorities) {
        if (authorities == null) return Collections.emptySet();
        return authorities.stream()
                .map(GrantedAuthority::getAuthority)
                .filter(Objects::nonNull)
                .map(RoleUtils::normalize)
                .collect(Collectors.toSet());
    }

    public static boolean hasRole(Collection<? extends GrantedAuthority> authorities, String role) {
        if (role == null) return false;
        String target = normalize(role);
        if (target.isEmpty()) return false;
        return toNormalizedSet(authorities).contains(target);
    }

    public static boolean hasAnyRole(Collection<? extends GrantedAuthority> authorities, String... roles) {
        if (roles == null || roles.length == 0) return false;
        Set<String> target = new HashSet<>();
        for (String r : roles) {
            String n = normalize(r);
            if (!n.isEmpty()) target.add(n);
        }
        if (target.isEmpty()) return false;
        Set<String> userRoles = toNormalizedSet(authorities);
        for (String r : target) {
            if (userRoles.contains(r)) return true;
        }
        return false;
    }
} 