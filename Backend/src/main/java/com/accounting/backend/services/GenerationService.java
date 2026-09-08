package com.accounting.backend.services;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.function.Consumer;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

/** Client for vLLM's OpenAI-compatible Chat Completions API. */
@Service
public class GenerationService {

    @Value("${ai.base-url:http://vllm-generation:8000/v1}")
    private String aiBaseUrl;

    @Value("${ai.api-key:}")
    private String apiKey;

    @Value("${ai.generation-model:qwen-local}")
    private String generationModel;

    @Value("${ai.request-timeout-seconds:120}")
    private int requestTimeoutSeconds;

    private final RestTemplate rest = new RestTemplate();
    private final ObjectMapper mapper = new ObjectMapper();

    public String generate(String prompt) throws Exception {
        HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody(prompt, false), headers());
        String response = rest.postForObject(endpoint("/chat/completions"), request, String.class);
        if (response == null) throw new IllegalStateException("Empty vLLM generation response");

        JsonNode content = mapper.readTree(response).at("/choices/0/message/content");
        if (content.isMissingNode() || content.isNull()) {
            throw new IllegalStateException("Unexpected vLLM generation response shape");
        }
        return content.asText();
    }

    /** Streams vLLM Server-Sent Events and emits only generated text deltas. */
    public void stream(String prompt, Consumer<String> onChunk) throws Exception {
        HttpURLConnection connection = (HttpURLConnection) URI.create(endpoint("/chat/completions")).toURL().openConnection();
        connection.setRequestMethod("POST");
        connection.setDoOutput(true);
        connection.setConnectTimeout(10_000);
        connection.setReadTimeout(requestTimeoutSeconds * 1_000);
        connection.setRequestProperty("Content-Type", MediaType.APPLICATION_JSON_VALUE);
        connection.setRequestProperty("Accept", MediaType.TEXT_EVENT_STREAM_VALUE);
        if (!apiKey.isBlank()) connection.setRequestProperty("Authorization", "Bearer " + apiKey);

        byte[] payload = mapper.writeValueAsBytes(requestBody(prompt, true));
        connection.getOutputStream().write(payload);

        int status = connection.getResponseCode();
        if (status < 200 || status >= 300) {
            throw new IllegalStateException("vLLM generation request failed with HTTP " + status);
        }

        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(connection.getInputStream(), StandardCharsets.UTF_8))) {
            String line;
            while ((line = reader.readLine()) != null) {
                if (!line.startsWith("data:")) continue;
                String data = line.substring("data:".length()).trim();
                if ("[DONE]".equals(data)) return;

                JsonNode delta = mapper.readTree(data).at("/choices/0/delta/content");
                if (!delta.isMissingNode() && !delta.isNull() && !delta.asText().isEmpty()) {
                    onChunk.accept(delta.asText());
                }
            }
        } finally {
            connection.disconnect();
        }
    }

    private Map<String, Object> requestBody(String prompt, boolean stream) {
        return Map.of(
            "model", generationModel,
            "messages", List.of(Map.of("role", "user", "content", prompt == null ? "" : prompt)),
            "stream", stream
        );
    }

    private HttpHeaders headers() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        if (!apiKey.isBlank()) headers.setBearerAuth(apiKey);
        return headers;
    }

    private String endpoint(String path) {
        return aiBaseUrl.replaceAll("/+$", "") + path;
    }
}
