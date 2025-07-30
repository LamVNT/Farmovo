package com.farmovo.backend.services.impl;

import com.farmovo.backend.dto.response.MailBody;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailServiceImpl {

    private final JavaMailSender javaMailSender;

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
}
