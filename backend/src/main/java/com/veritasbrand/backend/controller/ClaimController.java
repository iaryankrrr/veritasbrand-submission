package com.veritasbrand.backend.controller;

import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestTemplate;
import java.util.Map;

@RestController
@RequestMapping("/api/claims")
@CrossOrigin(origins = "*")
public class ClaimController {

    private final String AI_SERVICE_URL = "https://veritasbrand-ai-1.onrender.com/verify";
	    @PostMapping("/verify")
    public ResponseEntity<Map<String, Object>> verifyClaim(@RequestBody Map<String, String> request) {
        RestTemplate restTemplate = new RestTemplate();
        
        @SuppressWarnings("unchecked")
        Map<String, Object> response = restTemplate.postForObject(AI_SERVICE_URL, request, Map.class);
        
        return ResponseEntity.ok(response);
    }
}