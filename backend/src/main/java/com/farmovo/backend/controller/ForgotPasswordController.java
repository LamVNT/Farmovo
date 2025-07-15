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


    //send mail
    @PostMapping("/verifyMail/{email}")
    public ResponseEntity<String> verifyMail(@PathVariable String email){

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Email not found: " + email));

        int otp = otpGenerator();
        MailBody mailBody = MailBody.builder()
                .to(email)
                .text("This is the OTP for your Forgot Password request: " + otp)
                .subject("OTP for Forgot Password")
                .build();

        ForgotPassword fp = ForgotPassword.builder()
                .otp(otp)
                .expirationTime(new Date(System.currentTimeMillis() + 70*1000))
                .user(user)
                .build();

        emailService.sendSimpleMessage(mailBody);
        forgotPasswordRepository.save(fp);

        return ResponseEntity.ok("Email sent for verification!");
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

//        String encodePassword = passwordEncoder.encode(changePassword.password());
        // khi nao doi thanh password ko ma hoa thi bo comment
        userRepository.updatePassword(email, changePassword.password());

        return ResponseEntity.ok("Password has been changed!");



    }
    private Integer otpGenerator(){
        Random random = new Random();
        return random.nextInt(100_000,999_999);

    }
}
