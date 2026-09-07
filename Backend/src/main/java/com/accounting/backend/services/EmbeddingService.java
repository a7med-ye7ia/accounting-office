package com.accounting.backend.services;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

@Service
public class EmbeddingService {

    @Value("${ollama.url:http://localhost:11434/api}")
    private String ollamaUrl;

    // Keep model in sync with frontend: qwen3-embedding:0.6b
    private static final String EMBEDDING_MODEL = "qwen3-embedding:0.6b";
    // Max context length for the embedding model (safe limit); typically qwen has ~2048 token limit
    private static final int MAX_TEXT_LENGTH = 2000; // ~500-800 tokens

    private final RestTemplate rest = new RestTemplate();
    private final ObjectMapper mapper = new ObjectMapper();

    public List<Double> getEmbedding(String text) throws Exception {
        if (text == null) text = "";
        
        // Truncate to max context length to avoid "input length exceeds context length" error
        if (text.length() > MAX_TEXT_LENGTH) {
            text = text.substring(0, MAX_TEXT_LENGTH);
        }

        String url = ollamaUrl;
        if (!url.endsWith("/embeddings")) url = url + (url.endsWith("/") ? "embeddings" : "/embeddings");

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> body = Map.of(
            "model", EMBEDDING_MODEL,
            "prompt", text
        );

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

        String resp = rest.postForObject(url, request, String.class);
        if (resp == null) throw new Exception("Empty embedding response");

        JsonNode root = mapper.readTree(resp);

        // Try common response shapes
        JsonNode embeddingNode = null;
        if (root.has("embedding")) embeddingNode = root.get("embedding");
        else if (root.has("data") && root.get("data").has("embedding")) embeddingNode = root.get("data").get("embedding");
        else if (root.has("result") && root.get("result").has("embedding")) embeddingNode = root.get("result").get("embedding");

        if (embeddingNode == null || !embeddingNode.isArray()) {
            throw new Exception("Unexpected embedding response shape: " + root.toString());
        }

        return mapper.convertValue(embeddingNode, mapper.getTypeFactory().constructCollectionType(List.class, Double.class));
    }
}
