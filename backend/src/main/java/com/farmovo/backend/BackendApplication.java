package com.farmovo.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;


@SpringBootApplication
public class BackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(BackendApplication.class, args);
	}

//public static void main(String[] args) {
//	BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
//	String hashed = encoder.encode("12345");
//	System.out.println(hashed);

//}
}

//import org.springframework.beans.factory.annotation.Autowired;
//import org.springframework.boot.CommandLineRunner;
//import org.springframework.boot.SpringApplication;
//import org.springframework.boot.autoconfigure.SpringBootApplication;
//import org.springframework.security.core.userdetails.UserDetails;
//import org.springframework.security.core.userdetails.UserDetailsService;
//
//@SpringBootApplication
//public class BackendApplication implements CommandLineRunner {
//
//	@Autowired
//	private UserDetailsService userDetailsService;
//
//	public static void main(String[] args) {
//		SpringApplication.run(BackendApplication.class, args);
//	}
//
//	@Override
//	public void run(String... args) {
//		try {
//			UserDetails user = userDetailsService.loadUserByUsername("admin");
//
//			System.out.println("==== Thông tin User ====");
//			System.out.println("Username: " + user.getUsername());
//			System.out.println("Password: " + user.getPassword());
//
//			System.out.println("==== Các Role (Authorities) ====");
//			user.getAuthorities().forEach(auth -> {
//				System.out.println("- " + auth.getAuthority());
//			});
//
//		} catch (Exception e) {
//			System.err.println("Không tìm thấy user hoặc lỗi khác: " + e.getMessage());
//		}
//	}
//}



