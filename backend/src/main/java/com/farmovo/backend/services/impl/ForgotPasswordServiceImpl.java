package com.farmovo.backend.services.impl;

import com.farmovo.backend.models.ForgotPassword;
import com.farmovo.backend.models.User;
import com.farmovo.backend.repositories.ForgotPasswordRepository;
import com.farmovo.backend.repositories.UserRepository;
import com.farmovo.backend.services.ForgotPasswordService;
import com.farmovo.backend.services.impl.EmailServiceImpl;
import com.farmovo.backend.dto.response.MailBody;
import com.farmovo.backend.validator.EmailValidator;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Date;
import java.util.Map;


@Service
public class ForgotPasswordServiceImpl implements ForgotPasswordService {
    @Autowired
    private ForgotPasswordRepository forgotPasswordRepository;

    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private EmailServiceImpl emailService;
    
    @Autowired
    private EmailValidator emailValidator;

    @Transactional
    @Override
    public String verifyOtp(Integer otp, String email) {
        // 1. Tìm User qua email
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Email not found: " + email));

        // 2. Tìm ForgotPassword bản ghi tương ứng
        ForgotPassword fp = forgotPasswordRepository.findByOtpAndUser(otp, user)
                .orElseThrow(() -> new RuntimeException("Invalid OTP for email " + email));

        // 3. Kiểm tra OTP hết hạn
        if (fp.getExpirationTime().before(new Date())) {
            forgotPasswordRepository.delete(fp);
            return "OTP expired";
        }

        // 4. Nếu hợp lệ → Xóa luôn để tránh reuse
        forgotPasswordRepository.delete(fp);

        return "OTP verified successfully";
    }
    
    @Override
    @Transactional
    public Map<String, Object> sendOtpForForgotPassword(String email) {
        // Sanitize email
        String sanitizedEmail = emailValidator.sanitizeEmail(email);
        
        // Tìm user (có thể null nếu email không tồn tại)
        User user = userRepository.findByEmail(sanitizedEmail).orElse(null);
        
        // Xóa OTP cũ nếu có user
        if (user != null) {
            forgotPasswordRepository.deleteByUserId(user.getId());
        }
        
        // Tạo OTP mới
        int otp = generateOtp();
        Date expirationTime = new Date(System.currentTimeMillis() + 70 * 1000);
        
        // Gửi email OTP nếu user tồn tại
        if (user != null) {
            MailBody mailBody = MailBody.builder()
                    .to(sanitizedEmail)
                    .subject("OTP for Forgot Password")
                    .text("Mã OTP của bạn là: " + otp + "\nMã sẽ hết hạn trong 70 giây.")
                    .build();
            emailService.sendSimpleMessage(mailBody);
            
            // Lưu OTP vào database
            ForgotPassword newFp = ForgotPassword.builder()
                    .otp(otp)
                    .expirationTime(expirationTime)
                    .user(user)
                    .build();
            forgotPasswordRepository.save(newFp);
        }
        
        // Luôn trả về success để tránh user enumeration
        return Map.of(
            "message", "Nếu email đã đăng ký, OTP sẽ được gửi đến email của bạn.",
            "expirationTime", expirationTime.getTime()
        );
    }
    
    private int generateOtp() {
        return new java.util.Random().nextInt(900000) + 100000; // 6-digit OTP
    }
}
