package com.accounting.backend.controllers;

import java.io.PrintWriter;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.accounting.backend.services.GenerationService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import jakarta.servlet.http.HttpServletResponse;

@RestController
@RequestMapping("/api/generate")
@CrossOrigin(origins = "*")
public class GenerationController {

    @Autowired
    private GenerationService generationService;

    private final ObjectMapper mapper = new ObjectMapper();

    /**
     * Generate text via Ollama (non-streaming).
     *
     * Request body:
     * {
     *   "prompt": "المهمة: ...\n\nالنص الحالي: ..."
     * }
     *
     * Response:
     * {
     *   "response": "generated text here..."
     * }
     */
    @PostMapping
    public ResponseEntity<?> generate(@RequestBody Map<String, String> body) {
        try {
            String prompt = body.getOrDefault("prompt", "");
            String response = generationService.generate(prompt);
            return ResponseEntity.ok(Map.of("response", response));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Generate text with streaming (returns NDJSON).
     * Each line is: {"response": "text chunk"}
     * Frontend reads and accumulates chunks for real-time display.
     */
    @PostMapping(value = "/stream", produces = MediaType.APPLICATION_NDJSON_VALUE)
    public void generateStream(@RequestBody Map<String, String> body, 
                               HttpServletResponse response) {
        response.setContentType("application/x-ndjson");
        response.setHeader("Transfer-Encoding", "chunked");
        
        try {
            String prompt = body.getOrDefault("prompt", "");
            String rawResponse = generationService.generateResponse(prompt, true);
            
            // Parse Ollama's NDJSON stream and forward to client
            PrintWriter out = response.getWriter();
            String[] lines = rawResponse.split("\n");
            
            for (String line : lines) {
                if (line.trim().isEmpty()) continue;
                JsonNode node = mapper.readTree(line);
                
                if (node.has("response")) {
                    // Forward each chunk as-is
                    out.println(mapper.writeValueAsString(Map.of("response", node.get("response").asText())));
                    out.flush();
                }
            }
            
            out.close();
        } catch (Exception e) {
            e.printStackTrace();
            try {
                response.setStatus(500);
                response.getWriter().println("{\"error\":\"" + e.getMessage() + "\"}");
            } catch (Exception ex) {
                ex.printStackTrace();
            }
        }
    }
}

