package com.accounting.backend.services;

import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

@Service
public class GenerationService {

    @Value("${ollama.url:http://localhost:11434/api}")
    private String ollamaUrl;

    // Use the same model as frontend: qwen-local
    private static final String GENERATION_MODEL = "qwen-local";

    private final RestTemplate rest = new RestTemplate();
    private final ObjectMapper mapper = new ObjectMapper();

    /**
     * Generate text using Ollama.
     * 
     * @param prompt The input prompt
     * @param stream Whether to stream the response (if false, returns complete text)
     * @return Generated text response
     */
    public String generateResponse(String prompt, boolean stream) throws Exception {
        if (prompt == null) prompt = "";

        String url = ollamaUrl;
        if (!url.endsWith("/generate")) 
            url = url + (url.endsWith("/") ? "generate" : "/generate");

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> body = Map.of(
            "model", GENERATION_MODEL,
            "prompt", prompt,
            "stream", stream
        );

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

        String resp = rest.postForObject(url, request, String.class);
        if (resp == null) throw new Exception("Empty generation response");

        // For non-streaming: Ollama returns JSON with "response" field
        // For streaming: returns NDJSON, we handle it differently
        if (!stream) {
            JsonNode root = mapper.readTree(resp);
            if (root.has("response")) {
                return root.get("response").asText();
            }
            throw new Exception("Unexpected generation response shape: " + root.toString());
        }

        // For streaming, return the raw response (caller handles NDJSON parsing)
        return resp;
    }

    /**
     * Generate text (non-streaming, simpler API).
     */
    public String generate(String prompt) throws Exception {
        return generateResponse(prompt, false);
    }
}
