package com.farmovo.backend.controller;

import com.farmovo.backend.dto.request.ZoneRequestDto;
import com.farmovo.backend.dto.response.ZoneResponseDto;
import com.farmovo.backend.services.ZoneService;
import com.farmovo.backend.services.UserService;
import com.farmovo.backend.jwt.JwtUtils;
import com.farmovo.backend.models.User;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/zones")
public class ZoneController {

    @Autowired
    private ZoneService zoneService;
    @Autowired
    private UserService userService;
    @Autowired
    private JwtUtils jwtUtils;

    @GetMapping
    public ResponseEntity<List<ZoneResponseDto>> getAllZones(HttpServletRequest request) {
        String token = jwtUtils.getJwtFromRequest(request);
        Long userId = jwtUtils.getUserIdFromJwtToken(token);
        User user = userService.getUserById(userId).orElse(null);
        if (user != null && user.getAuthorities() != null) {
            boolean isOwner = user.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("OWNER"));
            boolean isStaff = user.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("STAFF"));
            if (isStaff && user.getStore() != null) {
                return ResponseEntity.ok(zoneService.getZonesByStoreId(user.getStore().getId()));
            }
            // OWNER hoặc quyền khác trả về toàn bộ zone
        }
        return ResponseEntity.ok(zoneService.getAllZones());
    }

    @PostMapping
    public ResponseEntity<ZoneResponseDto> createZone(@Valid @RequestBody ZoneRequestDto request, HttpServletRequest httpRequest) {
        String token = jwtUtils.getJwtFromRequest(httpRequest);
        Long userId = jwtUtils.getUserIdFromJwtToken(token);
        User user = userService.getUserById(userId).orElse(null);
        if (user != null && user.getAuthorities() != null) {
            boolean isOwner = user.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("OWNER"));
            boolean isStaff = user.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("STAFF"));
            if (isStaff) {
                // Staff chỉ được tạo zone trong kho của mình
                if (user.getStore() == null || !user.getStore().getId().equals(request.getStoreId())) {
                    return ResponseEntity.status(403).build(); // Forbidden
                }
            }
            // Owner được tạo ở bất kỳ kho nào
        }
        return ResponseEntity.ok(zoneService.createZone(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ZoneResponseDto> updateZone(@PathVariable Long id, @Valid @RequestBody ZoneRequestDto request, HttpServletRequest httpRequest) {
        String token = jwtUtils.getJwtFromRequest(httpRequest);
        Long userId = jwtUtils.getUserIdFromJwtToken(token);
        User user = userService.getUserById(userId).orElse(null);
        if (user != null && user.getAuthorities() != null) {
            boolean isOwner = user.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("OWNER"));
            boolean isStaff = user.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("STAFF"));
            if (isStaff) {
                // Staff chỉ được cập nhật zone trong kho của mình
                if (user.getStore() == null || !user.getStore().getId().equals(request.getStoreId())) {
                    return ResponseEntity.status(403).build(); // Forbidden
                }
            }
            // Owner được cập nhật ở bất kỳ kho nào
        }
        return ResponseEntity.ok(zoneService.updateZone(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteZone(@Valid @PathVariable Long id) {
        zoneService.deleteZone(id);
        return ResponseEntity.noContent().build();
    }


    /// để get zone ở bên import nha
    @GetMapping("/zones-by-store/{id}")
    public ResponseEntity<List<ZoneResponseDto>> getZonesByStore(@PathVariable Long storeId) {
        List<ZoneResponseDto> zones = zoneService.getZonesByStoreId(storeId);
        return ResponseEntity.ok(zones);
    }

}
