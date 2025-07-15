package com.farmovo.backend.services.impl;

import com.farmovo.backend.models.ForgotPassword;
import com.farmovo.backend.models.User;
import com.farmovo.backend.repositories.ForgotPasswordRepository;
import com.farmovo.backend.repositories.UserRepository;
import com.farmovo.backend.services.ForgotPasswordService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Date;


@Service
public class ForgotPasswordServiceImpl implements ForgotPasswordService {
    @Autowired
    private ForgotPasswordRepository forgotPasswordRepository;

    @Autowired
    private UserRepository userRepository;

    @Transactional
    @Override
    public String verifyOtp(Integer otp, String email) {
        // 1. Tìm User qua email
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Email not found: " + email));

        // 2. Tìm ForgotPassword bản ghi tương ứng
        ForgotPassword fp = forgotPasswordRepository.findByOtpAndUserId(otp, user.getId())
                .orElseThrow(() -> new RuntimeException("Invalid OTP for email " + email));

        // 3. Kiểm tra OTP hết hạn chưa
        if (fp.getExpirationTime().before(Date.from(Instant.now()))) {
            // Ngắt quan hệ trước khi xóa
            user.setForgotPassword(null);
            fp.setUser(null);
            userRepository.save(user);

            forgotPasswordRepository.delete(fp);
            forgotPasswordRepository.flush();

            return "OTP expired";
        }

        // 4. Nếu hợp lệ → XÓA LUÔN để tránh reuse
        user.setForgotPassword(null);
        fp.setUser(null);
        userRepository.save(user);

        forgotPasswordRepository.delete(fp);
        forgotPasswordRepository.flush();

        return "OTP verify!";
    }

}
