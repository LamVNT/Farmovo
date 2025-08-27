package com.farmovo.backend.controller;

import com.farmovo.backend.dto.response.DashboardSummaryDto;
import com.farmovo.backend.models.User;
import com.farmovo.backend.services.DashboardService;
import com.farmovo.backend.services.impl.JwtAuthenticationService;
import com.farmovo.backend.utils.RoleUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    @Autowired
    private DashboardService dashboardService;

    @Autowired
    private JwtAuthenticationService jwtAuthenticationService;

    @GetMapping("/summary")
    public DashboardSummaryDto getSummary(HttpServletRequest request) {
        try {
            User user = jwtAuthenticationService.extractAuthenticatedUser(request);
            var roles = jwtAuthenticationService.getUserRoles(user);

            // Nếu là Staff, chỉ lấy dữ liệu của kho được phân công
            if (roles.contains("STAFF") && user != null && user.getStore() != null) {
                return dashboardService.getSummaryByStore(user.getStore().getId());
            }

            // Owner/Admin xem tổng quan tất cả
            return dashboardService.getSummary();
        } catch (Exception e) {
            // Fallback: trả về tổng quan tất cả
            return dashboardService.getSummary();
        }
    }
}