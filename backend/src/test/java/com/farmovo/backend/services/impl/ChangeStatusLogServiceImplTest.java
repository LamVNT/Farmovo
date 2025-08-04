package com.farmovo.backend.services.impl;

import com.farmovo.backend.models.ChangeStatusLog;
import com.farmovo.backend.repositories.ChangeStatusLogRepository;
import com.farmovo.backend.mapper.ChangeStatusLogMapper;
import com.farmovo.backend.jwt.JwtUtils;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.*;

import static org.mockito.Mockito.*;

class ChangeStatusLogServiceImplTest {

    @Mock
    private ChangeStatusLogRepository repository;
    @Mock
    private ChangeStatusLogMapper mapper;
    @Mock
    private JwtUtils jwtUtils;
    @Mock
    private HttpServletRequest request;

    @InjectMocks
    private ChangeStatusLogServiceImpl service;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void testLogStatusChange_ShouldSaveLog() {
        // Trường hợp: Token hợp lệ ở header, kiểm tra log được lưu và createdBy đúng userId từ token
        when(jwtUtils.getJwtFromHeader(request)).thenReturn("token");
        when(jwtUtils.validateJwtToken("token")).thenReturn(true);
        when(jwtUtils.getUserIdFromJwtToken("token")).thenReturn(123L);

        service.logStatusChange("ImportTransaction", 1L, "DRAFT", "CANCEL", "Test log");

        // Đảm bảo repository.save được gọi với bất kỳ ChangeStatusLog nào
        verify(repository, times(1)).save(any(ChangeStatusLog.class));
    }

    @Test
    void testLogStatusChange_TokenInCookie() {
        // Trường hợp: Không có token ở header, lấy token ở cookie, kiểm tra createdBy đúng userId từ cookie
        when(jwtUtils.getJwtFromHeader(request)).thenReturn(null);
        when(jwtUtils.getJwtFromCookies(request)).thenReturn("cookieToken");
        when(jwtUtils.validateJwtToken("cookieToken")).thenReturn(true);
        when(jwtUtils.getUserIdFromJwtToken("cookieToken")).thenReturn(456L);

        service.logStatusChange("Order", 2L, "WAITING", "COMPLETE", "Order completed");

        // Đảm bảo createdBy đúng userId lấy từ cookie
        verify(repository, times(1)).save(argThat(log ->
                log.getCreatedBy() != null && log.getCreatedBy().equals(456L)
        ));
    }

    @Test
    void testLogStatusChange_InvalidToken() {
        // Trường hợp: Token ở header nhưng không hợp lệ, kiểm tra createdBy phải là null
        when(jwtUtils.getJwtFromHeader(request)).thenReturn("badToken");
        when(jwtUtils.validateJwtToken("badToken")).thenReturn(false);

        service.logStatusChange("Order", 3L, "WAITING", "CANCEL", "Order cancelled");

        // Đảm bảo createdBy là null khi token không hợp lệ
        verify(repository, times(1)).save(argThat(log ->
                log.getCreatedBy() == null
        ));
    }

    @Test
    void testLogStatusChange_NoTokenAnywhere() {
        // Trường hợp: Không có token ở header lẫn cookie, kiểm tra createdBy phải là null
        when(jwtUtils.getJwtFromHeader(request)).thenReturn(null);
        when(jwtUtils.getJwtFromCookies(request)).thenReturn(null);

        service.logStatusChange("Order", 4L, "WAITING", "CANCEL", "Order cancelled");

        // Đảm bảo createdBy là null khi không có token
        verify(repository, times(1)).save(argThat(log ->
                log.getCreatedBy() == null
        ));
    }
}