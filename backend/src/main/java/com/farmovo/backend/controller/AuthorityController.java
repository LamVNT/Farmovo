package com.farmovo.backend.controller;

import com.farmovo.backend.models.Authority;
import com.farmovo.backend.repositories.AuthorityRepository;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/authorities")
@CrossOrigin(origins = "http://localhost:5173", allowedHeaders = "*", allowCredentials = "true")
public class AuthorityController {
    private static final Logger logger = LogManager.getLogger(AuthorityController.class);

    @Autowired
    private AuthorityRepository authorityRepository;

    @GetMapping("/admin/roleList")
    public List<Authority> getAllAuthorities() {
        logger.info("Fetching all authorities");
        return authorityRepository.findAll();
    }
}