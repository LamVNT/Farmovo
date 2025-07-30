package com.farmovo.backend.controller;

import com.farmovo.backend.dto.response.ChangePassword;
import com.farmovo.backend.dto.response.MailBody;
import com.farmovo.backend.dto.response.OtpVerificationResponse;
import com.farmovo.backend.dto.request.OtpRequest;
import com.farmovo.backend.validator.OtpValidator;
import com.farmovo.backend.models.ForgotPassword;
import com.farmovo.backend.models.User;
import com.farmovo.backend.repositories.UserRepository;
import com.farmovo.backend.repositories.ForgotPasswordRepository;
import com.farmovo.backend.services.ForgotPasswordService;
import com.farmovo.backend.services.impl.EmailServiceImpl;
import com.farmovo.backend.validator.PasswordValidator;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.Date;
import java.util.Objects;
import java.util.Random;
import java.util.Map;


@RestController
@RequestMapping("/api/forgot-password")
public class ForgotPasswordController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EmailServiceImpl emailService;

    @Autowired
    private ForgotPasswordRepository forgotPasswordRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private ForgotPasswordService forgotPasswordService;

    @Autowired
    private OtpValidator otpValidator;


    @Transactional
    @PostMapping("/verifyMail/{email}")
    public ResponseEntity<Object> verifyMail(@PathVariable String email) {
        try {
            System.out.println("=== Gửi OTP cho email: " + email + " ===");
            
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("Email không tồn tại: " + email));
            
            System.out.println("Tìm thấy user: " + user.getUsername());
            
            // Xóa OTP cũ nếu có
            forgotPasswordRepository.deleteByUserId(user.getId());
            System.out.println("Đã xóa OTP cũ");

            // 3. Tạo mã OTP mới
            int otp = otpGenerator();
            Date expirationTime = new Date(System.currentTimeMillis() + 70 * 1000);
            
            System.out.println("Tạo OTP mới: " + otp + ", hết hạn: " + expirationTime);

            // 4. Gửi email chứa OTP
            MailBody mailBody = MailBody.builder()
                    .to(email)
                    .subject("OTP for Forgot Password")
                    .text("Mã OTP của bạn là: " + otp + "\nMã sẽ hết hạn trong 70 giây.")
                    .build();
            emailService.sendSimpleMessage(mailBody);
            System.out.println("Đã gửi email OTP");

            // 5. Lưu bản ghi ForgotPassword mới
            ForgotPassword newFp = ForgotPassword.builder()
                    .otp(otp)
                    .expirationTime(expirationTime)
                    .user(user)
                    .build();
            forgotPasswordRepository.save(newFp);
            System.out.println("Đã lưu OTP vào database");

            // Trả về thông tin bao gồm thời gian hết hạn
            return ResponseEntity.ok(Map.of(
                "message", "OTP đã được gửi đến email của bạn.",
                "expirationTime", expirationTime.getTime()
            ));
        } catch (Exception ex) {
            System.err.println("Lỗi khi gửi OTP: " + ex.getMessage());
            ex.printStackTrace();
            String errorMessage = "Gửi email OTP thất bại. Chi tiết: " + ex.getMessage();
            throw new RuntimeException(errorMessage, ex);
        }
    }


    @PostMapping("/verifyOtp/{email}")
    public ResponseEntity<OtpVerificationResponse> verifyOtp(@PathVariable String email, @RequestBody OtpRequest request) {
        System.out.println("=== Xác minh OTP cho email: " + email + " ===");
        // Validate OTP format
        OtpValidator.ValidationResult validationResult = otpValidator.validateOtp(request);
        if (!validationResult.isValid()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(OtpVerificationResponse.error(validationResult.getErrorMessage(),
                        validationResult.getErrorType()));
        }
        
        try {
            Integer otp = Integer.parseInt(request.otp());
            String result = forgotPasswordService.verifyOtp(otp, email);
            if (result.equals("OTP verified successfully")) {
                return ResponseEntity.ok(OtpVerificationResponse.success("OTP verified successfully"));
            } else {
                return ResponseEntity.ok(OtpVerificationResponse.error(result, "VERIFICATION_FAILED"));
            }
            
        } catch (RuntimeException e) {
            String errorMessage = e.getMessage();
            if (errorMessage.contains("Invalid OTP")) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(OtpVerificationResponse.error("Mã OTP không đúng. Vui lòng kiểm tra lại.", "INVALID_OTP"));
            } else if (errorMessage.contains("Email not found")) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(OtpVerificationResponse.error("Email không tồn tại trong hệ thống.", "EMAIL_NOT_FOUND"));
            } else {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(OtpVerificationResponse.error("Đã xảy ra lỗi khi xác minh OTP.", "UNKNOWN_ERROR"));
            }
        }
    }

    @PostMapping("/change-password/{email}")
    public ResponseEntity<String> changePasswordHadler(@RequestBody ChangePassword changePassword,
                                                       @PathVariable String email){
        if(!Objects.equals(changePassword.password(), changePassword.repeatPassword())){
            return new ResponseEntity<>("Please enter the password again",
                    HttpStatus.EXPECTATION_FAILED);
        }

        // Validate password strength
        PasswordValidator.PasswordValidationResult validationResult = 
            PasswordValidator.validatePassword(changePassword.password());
        
        if (!validationResult.isValid()) {
            return new ResponseEntity<>("Password validation failed: " + validationResult.getErrorMessage(),
                    HttpStatus.BAD_REQUEST);
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Email not found: " + email));
//        String encodePassword = passwordEncoder.encode(changePassword.password());
//        userRepository.updatePassword(email, encodePassword);
        userRepository.updatePassword(email, changePassword.password());
        forgotPasswordRepository.deleteByUserId(user.getId());

        return ResponseEntity.ok("Password has been changed!");
    }

    private Integer otpGenerator(){
        Random random = new Random();
        return random.nextInt(100_000,999_999);
    }

}
