package com.farmovo.backend.services;

import com.farmovo.backend.dto.response.DashboardSummaryDto;

public interface DashboardService {
    DashboardSummaryDto getSummary();
}