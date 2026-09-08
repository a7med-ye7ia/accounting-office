package com.accounting.backend.services;

import java.util.ArrayList;
import java.util.List;
import java.util.Collections;
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

    @Value("${ai.embedding-base-url:http://vllm-embeddings:8000/v1}")
    private String embeddingBaseUrl;

    @Value("${ai.api-key:}")
    private String apiKey;

    @Value("${ai.embedding.max-input-characters:16000}")
    private int maxInputCharacters;

    @Value("${ai.embedding-model:Qwen/Qwen3-Embedding-0.6B}")
    private String embeddingModel;
    private final RestTemplate rest = new RestTemplate();
    private final ObjectMapper mapper = new ObjectMapper();

    public List<Double> getEmbedding(String text) throws Exception {
        return getEmbeddings(List.of(text == null ? "" : text)).get(0);
    }

    /** Embeds a batch without changing input order. vLLM returns an index for every vector. */
    public List<List<Double>> getEmbeddings(List<String> texts) throws Exception {
        if (texts == null || texts.isEmpty()) return List.of();

        List<String> inputs = new ArrayList<>(texts.size());
        for (String text : texts) inputs.add(validateInput(text));

        String url = embeddingBaseUrl.replaceAll("/+$", "") + "/embeddings";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        if (!apiKey.isBlank()) headers.setBearerAuth(apiKey);

        Map<String, Object> body = Map.of(
            "model", embeddingModel,
            "input", inputs
        );

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

        String resp = rest.postForObject(url, request, String.class);
        if (resp == null) throw new Exception("Empty embedding response");

        JsonNode root = mapper.readTree(resp);

        JsonNode embeddingsNode = root.get("data");
        if (embeddingsNode == null || !embeddingsNode.isArray() || embeddingsNode.size() != inputs.size()) {
            throw new Exception("Unexpected embedding response shape: " + root.toString());
        }

        List<List<Double>> embeddings = new ArrayList<>(Collections.nCopies(inputs.size(), null));
        for (JsonNode item : embeddingsNode) {
            int index = item.path("index").asInt(-1);
            JsonNode embedding = item.get("embedding");
            if (index < 0 || index >= inputs.size()) {
                throw new Exception("Embedding response contains an invalid index");
            }
            if (!embedding.isArray() || embedding.isEmpty()) {
                throw new Exception("Embedding response contains an empty vector");
            }
            if (embeddings.get(index) != null) throw new Exception("Embedding response contains a duplicate index");
            embeddings.set(index, mapper.convertValue(embedding,
                mapper.getTypeFactory().constructCollectionType(List.class, Double.class)));
        }
        if (embeddings.stream().anyMatch(java.util.Objects::isNull)) {
            throw new Exception("Embedding response omitted an input vector");
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
