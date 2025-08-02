package com.farmovo.backend.controller;

import com.farmovo.backend.dto.request.ZoneRequestDto;
import com.farmovo.backend.dto.response.ZoneResponseDto;
import com.farmovo.backend.services.ZoneService;
import com.farmovo.backend.services.UserService;
import com.farmovo.backend.jwt.JwtUtils;
import com.farmovo.backend.models.User;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/zones")
public class ZoneController {
    
    private static final Logger logger = LoggerFactory.getLogger(ZoneController.class);

    @Autowired
    private ZoneService zoneService;
    @Autowired
    private UserService userService;
    @Autowired
    private JwtUtils jwtUtils;

    @GetMapping
    public ResponseEntity<List<ZoneResponseDto>> getAllZones(HttpServletRequest request) {
        try {
            String token = jwtUtils.getJwtFromRequest(request);
            if (token == null) {
                // Nếu không có token, trả về tất cả zones (có thể cần xem xét lại logic này)
                return ResponseEntity.ok(zoneService.getAllZones());
            }
            
            Long userId = jwtUtils.getUserIdFromJwtToken(token);
            if (userId == null) {
                // Nếu không lấy được userId từ token, trả về tất cả zones
                return ResponseEntity.ok(zoneService.getAllZones());
            }
            
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
        } catch (Exception e) {
            // Log lỗi và trả về tất cả zones như fallback
            logger.error("Error in getAllZones: ", e);
            return ResponseEntity.ok(zoneService.getAllZones());
        }
    }

    @PostMapping
    public ResponseEntity<ZoneResponseDto> createZone(@Valid @RequestBody ZoneRequestDto request, HttpServletRequest httpRequest) {
        try {
            String token = jwtUtils.getJwtFromRequest(httpRequest);
            if (token == null) {
                return ResponseEntity.status(401).build(); // Unauthorized
            }
            
            Long userId = jwtUtils.getUserIdFromJwtToken(token);
            if (userId == null) {
                return ResponseEntity.status(401).build(); // Unauthorized
            }
            
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
        } catch (Exception e) {
            logger.error("Error in createZone: ", e);
            return ResponseEntity.status(500).build(); // Internal Server Error
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<ZoneResponseDto> updateZone(@PathVariable Long id, @Valid @RequestBody ZoneRequestDto request, HttpServletRequest httpRequest) {
        try {
            String token = jwtUtils.getJwtFromRequest(httpRequest);
            if (token == null) {
                return ResponseEntity.status(401).build(); // Unauthorized
            }
            
            Long userId = jwtUtils.getUserIdFromJwtToken(token);
            if (userId == null) {
                return ResponseEntity.status(401).build(); // Unauthorized
            }
            
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
        } catch (Exception e) {
            logger.error("Error in updateZone: ", e);
            return ResponseEntity.status(500).build(); // Internal Server Error
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteZone(@Valid @PathVariable Long id) {
        try {
            zoneService.deleteZone(id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            logger.error("Error in deleteZone: ", e);
            return ResponseEntity.status(500).build(); // Internal Server Error
        }
    }


    /// để get zone ở bên import nha
    @GetMapping("/zones-by-store/{id}")
    public ResponseEntity<List<ZoneResponseDto>> getZonesByStore(@PathVariable Long storeId) {
        List<ZoneResponseDto> zones = zoneService.getZonesByStoreId(storeId);
        return ResponseEntity.ok(zones);
    }

}
