package com.accounting.backend.services;

import java.util.ArrayList;
import java.util.List;
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
public class EmbeddingService {

    @Value("${ollama.url:http://localhost:11434/api}")
    private String ollamaUrl;

    @Value("${ai.embedding.max-input-characters:16000}")
    private int maxInputCharacters;

    // Keep model in sync with frontend: qwen3-embedding:0.6b
    private static final String EMBEDDING_MODEL = "qwen3-embedding:0.6b";
    private final RestTemplate rest = new RestTemplate();
    private final ObjectMapper mapper = new ObjectMapper();

    public List<Double> getEmbedding(String text) throws Exception {
        return getEmbeddings(List.of(text == null ? "" : text)).get(0);
    }

    /** Embeds a batch without changing input order. Ollama returns one vector per input item. */
    public List<List<Double>> getEmbeddings(List<String> texts) throws Exception {
        if (texts == null || texts.isEmpty()) return List.of();

        List<String> inputs = new ArrayList<>(texts.size());
        for (String text : texts) inputs.add(validateInput(text));

        String url = ollamaUrl;
        if (!url.endsWith("/embed")) url = url + (url.endsWith("/") ? "embed" : "/embed");

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> body = Map.of(
            "model", EMBEDDING_MODEL,
            "input", inputs,
            "truncate", false,
            "keep_alive", "10m"
        );

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

        String resp = rest.postForObject(url, request, String.class);
        if (resp == null) throw new Exception("Empty embedding response");

        JsonNode root = mapper.readTree(resp);

        JsonNode embeddingsNode = root.get("embeddings");
        if (embeddingsNode == null || !embeddingsNode.isArray() || embeddingsNode.size() != inputs.size()) {
            throw new Exception("Unexpected embedding response shape: " + root.toString());
        }

        List<List<Double>> embeddings = new ArrayList<>(embeddingsNode.size());
        for (JsonNode embedding : embeddingsNode) {
            if (!embedding.isArray() || embedding.isEmpty()) {
                throw new Exception("Embedding response contains an empty vector");
            }
            embeddings.add(mapper.convertValue(embedding,
                mapper.getTypeFactory().constructCollectionType(List.class, Double.class)));
        }
        return embeddings;
    }

    private String validateInput(String text) {
        String value = text == null ? "" : text.trim();
        if (value.isEmpty()) throw new IllegalArgumentException("Embedding input cannot be empty");
        if (value.length() > maxInputCharacters) {
            value = truncateAtSentenceBoundary(value, maxInputCharacters);
        }
        return value;
    }

    public static String truncateAtSentenceBoundary(String text, int maxChars) {
        if (text == null || text.length() <= maxChars) return text;
        String truncated = text.substring(0, maxChars);
        int lastBreak = Math.max(truncated.lastIndexOf('\n'),
                        Math.max(truncated.lastIndexOf(". "),
                        Math.max(truncated.lastIndexOf("؛"),
                        Math.max(truncated.lastIndexOf("،"), truncated.lastIndexOf(' ')))));
        if (lastBreak > maxChars / 2) {
            return truncated.substring(0, lastBreak).trim();
        }
        return truncated.trim();
    }
}
