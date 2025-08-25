package com.farmovo.backend.controller;

import com.farmovo.backend.models.Authority;
import com.farmovo.backend.repositories.AuthorityRepository;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/authorities")
@CrossOrigin(origins = {
        "http://localhost:5173",
        "https://farmovo-frontend-h7esa8cxbsdqa3dd.southeastasia-01.azurewebsites.net",
        "https://farmovo.store",
        "https://www.farmovo.store",
        "https://farmovo.io.vn",
        "https://www.farmovo.io.vn"
}, allowedHeaders = "*", allowCredentials = "true")
public class AuthorityController {
    private static final Logger logger = LogManager.getLogger(AuthorityController.class);

    @Autowired
    private AuthorityRepository authorityRepository;

    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ADMIN')")
    @GetMapping("/admin/roleList")
    public List<Authority> getAllAuthorities() {
        logger.info("Fetching all authorities");
        return authorityRepository.findAll();
    }
}