package com.farmovo.backend.controller;

import com.farmovo.backend.dto.response.ChangePassword;
import com.farmovo.backend.dto.response.MailBody;
import com.farmovo.backend.models.ForgotPassword;
import com.farmovo.backend.models.User;
import com.farmovo.backend.repositories.UserRepository;
import com.farmovo.backend.repositories.ForgotPasswordRepository;
import com.farmovo.backend.services.ForgotPasswordService;
import com.farmovo.backend.services.impl.EmailService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.Date;
import java.util.Objects;
import java.util.Random;

@RestController
@RequestMapping("/api/forgot-password")
public class ForgotPasswordController {

    private final UserRepository userRepository;

    private final EmailService emailService;

    private final ForgotPasswordRepository forgotPasswordRepository;

    private final PasswordEncoder passwordEncoder;

    private final ForgotPasswordService forgotPasswordService;

    public ForgotPasswordController(UserRepository userRepository, EmailService emailService, ForgotPasswordRepository forgotPasswordRepository, PasswordEncoder passwordEncoder, ForgotPasswordService forgotPasswordService) {
        this.userRepository = userRepository;
        this.emailService = emailService;
        this.forgotPasswordRepository = forgotPasswordRepository;
        this.passwordEncoder = passwordEncoder;
        this.forgotPasswordService = forgotPasswordService;
    }


    @Transactional
    @PostMapping("/verifyMail/{email}")
    public ResponseEntity<String> verifyMail(@PathVariable String email) {
        try {
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("❌ Email không tồn tại: " + email));
            forgotPasswordRepository.deleteByUserId(user.getId());

            // 3. Tạo mã OTP mới
            int otp = otpGenerator();

            // 4. Gửi email chứa OTP
            MailBody mailBody = MailBody.builder()
                    .to(email)
                    .subject("OTP for Forgot Password")
                    .text("Mã OTP của bạn là: " + otp + "\nMã sẽ hết hạn trong 70 giây.")
                    .build();
            emailService.sendSimpleMessage(mailBody);

            // 5. Lưu bản ghi ForgotPassword mới
            ForgotPassword newFp = ForgotPassword.builder()
                    .otp(otp)
                    .expirationTime(new Date(System.currentTimeMillis() + 70 * 1000))
                    .user(user)
                    .build();
            forgotPasswordRepository.save(newFp);

            return ResponseEntity.ok("OTP đã được gửi đến email của bạn.");
        } catch (Exception ex) {
            String errorMessage = "Gửi email OTP thất bại. Chi tiết: " + ex.getMessage();
            throw new RuntimeException(errorMessage, ex);
        }
    }


    @PostMapping("/verifyOtp/{otp}/{email}")
    public ResponseEntity<String> verifyOtp(@PathVariable Integer otp, @PathVariable String email) {
        String result = forgotPasswordService.verifyOtp(otp, email);
        if (result.equals("OTP expired")) {
            return new ResponseEntity<>("OTP has expired", HttpStatus.EXPECTATION_FAILED);
        }
        return ResponseEntity.ok(result);
    }

    @PostMapping("/change-password/{email}")
    public ResponseEntity<String> changePasswordHadler(@RequestBody ChangePassword changePassword,
                                                       @PathVariable String email){
        if(!Objects.equals(changePassword.password(), changePassword.repeatPassword())){
            return new ResponseEntity<>("Please enter the password again",
                    HttpStatus.EXPECTATION_FAILED);
        }


        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Email not found: " + email));
//        String encodePassword = passwordEncoder.encode(changePassword.password());
        // khi nao doi thanh password ko ma hoa thi bo comment
        userRepository.updatePassword(email, changePassword.password());
        forgotPasswordRepository.deleteByUserId(user.getId());

        return ResponseEntity.ok("Password has been changed!");
    }

    private Integer otpGenerator(){
        Random random = new Random();
        return random.nextInt(100_000,999_999);
    }
}
