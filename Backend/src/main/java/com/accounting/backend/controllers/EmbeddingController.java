package com.accounting.backend.controllers;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.accounting.backend.services.EmbeddingService;

import java.util.Map;

@RestController
@RequestMapping("/api/embeddings")
@CrossOrigin(origins = "*")
public class EmbeddingController {

    @Autowired
    private EmbeddingService embeddingService;

    @PostMapping
    public ResponseEntity<?> embed(@RequestBody Map<String, String> body) {
        String text = body.getOrDefault("text", "");
        try {
            List<Double> embedding = embeddingService.getEmbedding(text);
            return ResponseEntity.ok(Map.of("embedding", embedding));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }
}
