//package com.farmovo.backend.controller;
//
//import com.farmovo.backend.jwt.JwtUtils;
//import com.farmovo.backend.dto.request.LoginRequest;
//import com.farmovo.backend.dto.response.LoginResponse;
//import com.farmovo.backend.models.User;
//import com.farmovo.backend.repositories.UserRepository;
//import org.springframework.beans.factory.annotation.Autowired;
//import org.springframework.http.ResponseEntity;
//import org.springframework.security.authentication.AuthenticationManager;
//import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
//import org.springframework.security.core.Authentication;
//import org.springframework.security.core.context.SecurityContextHolder;
//import org.springframework.security.core.userdetails.UserDetails;
//import org.springframework.web.bind.annotation.*;
//
//import java.util.List;
//import java.util.stream.Collectors;
//
//@RestController
//@RequestMapping("")
//public class LoginController {
//
//
//    @Autowired
//    private UserRepository userRepository;
//
//
//    @Autowired
//    AuthenticationManager authenticationManager;
//
//    @Autowired
//    JwtUtils jwtUtils;
//
//    @PostMapping("/signin")
//    public ResponseEntity<?> authenticationUser(@RequestBody LoginRequest loginRequest) {
//
//        Authentication authentication;
////        try {
////            authentication = authenticationManager.authenticate
////                    (new UsernamePasswordAuthenticationToken(loginRequest.getUsername(), loginRequest.getPassword()));
////        } catch (AuthenticationException e) {
////            Map<String, Object> map = new HashMap<>();
////            map.put("error", "Invalid username or password");
////            map.put("status", false);
////            return new ResponseEntity<Object>(map, HttpStatus.NOT_FOUND);
////        }
//
//        // đã xử lý lỗi
//        authentication = authenticationManager.authenticate
//                (new UsernamePasswordAuthenticationToken(loginRequest.getUsername(), loginRequest.getPassword()));
//
//
//        SecurityContextHolder.getContext().setAuthentication(authentication);
//
//        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
//
//        String jwtToken = jwtUtils.generateTokenFromUsername(userDetails);
//
//        List<String> roles = userDetails.getAuthorities().stream()
//                .map(item -> item.getAuthority())
//                .collect(Collectors.toList());
//
//        LoginResponse loginResponse = new LoginResponse(jwtToken, userDetails.getUsername(), roles);
//        return ResponseEntity.ok(loginResponse);
//    }
//
//
//    @GetMapping("/admin/listuser")
//    public List<User> getAllUsers() {
//        return userRepository.findAll();
//    }
//}
