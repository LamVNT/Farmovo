package com.farmovo.backend.services.impl;

import com.farmovo.backend.dto.request.SendLoginInfoRequestDto;
import com.farmovo.backend.dto.response.MailBody;
import com.farmovo.backend.validator.InputUserValidation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailServiceImpl {

    private final JavaMailSender javaMailSender;

    @Autowired
    private InputUserValidation inputUserValidation;

    public EmailServiceImpl(JavaMailSender javaMailSender) {
        this.javaMailSender = javaMailSender;
    }

    public void sendSimpleMessage(MailBody mailBody){
        try {
            System.out.println("=== EmailServiceImpl: Gửi email ===");
            System.out.println("To: " + mailBody.to());
            System.out.println("Subject: " + mailBody.subject());
            
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(mailBody.to());
            message.setFrom("khongmanhphuc2003@gmail.com");// username va password
            message.setSubject(mailBody.subject());
            message.setText(mailBody.text());

            javaMailSender.send(message);
            System.out.println("Email sent successfully!");
        } catch (Exception e) {
            System.err.println("EmailServiceImpl: Lỗi khi gửi email");
            System.err.println("Error: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Không thể gửi email: " + e.getMessage(), e);
        }
    }

    public void sendLoginInfoEmail(SendLoginInfoRequestDto request) {
        try {
            System.out.println("=== EmailServiceImpl: Gửi email thông tin đăng nhập ===");
            System.out.println("To: " + request.getEmail());
            
            // Validate request
            inputUserValidation.validateSendLoginInfoRequest(request);
            
            String subject = "Thông tin đăng nhập - Hệ thống Farmovo";
            String text = buildLoginInfoEmailText(request);
            
            MailBody mailBody = MailBody.builder()
                    .to(request.getEmail())
                    .subject(subject)
                    .text(text)
                    .build();
            
            sendSimpleMessage(mailBody);
            System.out.println("Email thông tin đăng nhập đã được gửi thành công!");
            
        } catch (Exception e) {
            System.err.println("EmailServiceImpl: Lỗi khi gửi email thông tin đăng nhập");
            System.err.println("Error: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Không thể gửi email thông tin đăng nhập: " + e.getMessage(), e);
        }
    }

    private String buildLoginInfoEmailText(SendLoginInfoRequestDto request) {
        StringBuilder text = new StringBuilder();
        text.append("Xin chào ").append(request.getFullName()).append(",\n\n");
        text.append("Tài khoản của bạn đã được tạo thành công trong hệ thống Farmovo.\n\n");
        text.append("Thông tin đăng nhập:\n");
        text.append("- Tên đăng nhập: ").append(request.getUsername()).append("\n");
        text.append("- Mật khẩu: ").append(request.getPassword()).append("\n");
        text.append("- Cửa hàng: ").append(request.getStoreName()).append("\n\n");
        text.append("Lưu ý:\n");
        text.append("- Vui lòng đổi mật khẩu sau khi đăng nhập lần đầu.\n");
        text.append("- Không chia sẻ thông tin đăng nhập với người khác.\n");
        text.append("- Nếu có vấn đề, vui lòng liên hệ quản trị viên.\n\n");
        text.append("Trân trọng,\n");
        text.append("Đội ngũ Farmovo");
        
        return text.toString();
    }
}
