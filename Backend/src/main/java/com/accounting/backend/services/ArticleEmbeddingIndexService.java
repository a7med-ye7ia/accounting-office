package com.accounting.backend.services;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import com.accounting.backend.entities.Contract;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;

/** Builds the persistent, per-contract search index used by article Smart Search. */
@Service
public class ArticleEmbeddingIndexService {

    public static final String INDEX_FILE_NAME = "article-embeddings.json";
    private static final String FILE_SYSTEM_ROOT = "../FileSystem";
    private static final String EMBEDDING_MODEL = "qwen3-embedding:0.6b";
    private static final int BATCH_SIZE = 16;
    private static final Logger log = LoggerFactory.getLogger(ArticleEmbeddingIndexService.class);

    private final EmbeddingService embeddingService;
    private final FileService fileService;
    private final ObjectMapper mapper = new ObjectMapper();

    public ArticleEmbeddingIndexService(EmbeddingService embeddingService, FileService fileService) {
        this.embeddingService = embeddingService;
        this.fileService = fileService;
    }

    /** Creates one index file for a contract; OCR remains the source of article text. */
    public void indexContract(Contract contract, String contractFolder, String ocrJson) throws Exception {
        JsonNode ocrRoot = mapper.readTree(ocrJson);
        JsonNode articles = ocrRoot.path("articles");
        if (!articles.isArray()) throw new IllegalArgumentException("OCR data does not contain an articles array");

        ObjectNode index = mapper.createObjectNode();
        index.put("schemaVersion", 1);
        index.put("contractId", contract.getId());
        index.put("companyId", contract.getCompany().getId());
        index.put("sourceFile", "ocrData.json");
        index.put("sourceHash", sha256(ocrJson));
        index.put("embeddingModel", EMBEDDING_MODEL);
        index.put("generatedAt", Instant.now().toString());
        ArrayNode indexedArticles = index.putArray("articles");

        List<PendingArticle> pendingArticles = new ArrayList<>();
        for (JsonNode article : articles) {
            String articleId = articleId(article);
            String text = articleText(article);
            if (articleId == null || text == null || text.length() < 5) continue;
            pendingArticles.add(new PendingArticle(articleId, text));
        }

        if (pendingArticles.isEmpty()) throw new IllegalArgumentException("OCR data contains no indexable articles");

        Integer dimensions = null;
        for (int start = 0; start < pendingArticles.size(); start += BATCH_SIZE) {
            List<PendingArticle> batch = pendingArticles.subList(start,
                Math.min(start + BATCH_SIZE, pendingArticles.size()));
            List<List<Double>> embeddings = embeddingService.getEmbeddings(
                batch.stream().map(PendingArticle::text).toList());
            if (embeddings.size() != batch.size()) {
                throw new IllegalStateException("Embedding service returned the wrong number of vectors");
            }

            for (int i = 0; i < batch.size(); i++) {
                PendingArticle article = batch.get(i);
                List<Double> embedding = embeddings.get(i);
                if (embedding == null || embedding.isEmpty()) {
                    throw new IllegalStateException("Embedding returned no vector for article " + article.articleId());
                }
                if (dimensions == null) dimensions = embedding.size();
                else if (dimensions != embedding.size()) {
                    throw new IllegalStateException("Embedding dimensions differ between articles");
                }

                ObjectNode indexedArticle = indexedArticles.addObject();
                indexedArticle.put("articleId", article.articleId());
                indexedArticle.put("textHash", sha256(article.text()));
                indexedArticle.set("embedding", mapper.valueToTree(embedding));
            }
        }

        index.put("dimensions", dimensions);
        fileService.saveJsonFile(contractFolder, INDEX_FILE_NAME,
            mapper.writerWithDefaultPrettyPrinter().writeValueAsString(index));
    }

    /**
     * Incremental re-index: reads the existing index, compares per-article textHash,
     * and only re-embeds articles whose text actually changed (or are new).
     * Articles that were deleted from the OCR are removed from the index.
     * Falls back to full indexContract() if no existing index is found.
     */
    public void reindexContract(Contract contract, String contractFolder, String ocrJson) throws Exception {
        Path indexPath = Path.of(FILE_SYSTEM_ROOT, contractFolder, INDEX_FILE_NAME);
        if (!Files.exists(indexPath)) {
            log.info("No existing index for contract {}; performing full index", contract.getId());
            indexContract(contract, contractFolder, ocrJson);
            return;
        }

        JsonNode ocrRoot = mapper.readTree(ocrJson);
        JsonNode articles = ocrRoot.path("articles");
        if (!articles.isArray()) throw new IllegalArgumentException("OCR data does not contain an articles array");

        // Build a map of current article text from OCR
        Map<String, String> currentArticleTexts = new HashMap<>();
        for (JsonNode article : articles) {
            String id = articleId(article);
            String text = articleText(article);
            if (id != null && text != null && text.length() >= 5) {
                currentArticleTexts.put(id, text);
            }
        }
        if (currentArticleTexts.isEmpty()) throw new IllegalArgumentException("OCR data contains no indexable articles");

        // Read existing index and build a map of articleId -> {textHash, embedding}
        JsonNode existingIndex = mapper.readTree(Files.readString(indexPath));
        Map<String, ExistingArticleEntry> existingEntries = new HashMap<>();
        for (JsonNode entry : existingIndex.path("articles")) {
            String id = entry.path("articleId").asText();
            String hash = entry.path("textHash").asText();
            JsonNode embedding = entry.path("embedding");
            if (id != null && !id.isBlank() && embedding.isArray()) {
                existingEntries.put(id, new ExistingArticleEntry(hash, embedding));
            }
        }

        // Determine which articles need re-embedding
        List<PendingArticle> toEmbed = new ArrayList<>();
        List<String> unchanged = new ArrayList<>();
        for (Map.Entry<String, String> entry : currentArticleTexts.entrySet()) {
            String id = entry.getKey();
            String text = entry.getValue();
            String newHash = sha256(text);
            ExistingArticleEntry existing = existingEntries.get(id);
            if (existing != null && newHash.equals(existing.textHash())) {
                unchanged.add(id);
            } else {
                toEmbed.add(new PendingArticle(id, text));
            }
        }

        log.info("Incremental reindex for contract {}: {} unchanged, {} to re-embed",
            contract.getId(), unchanged.size(), toEmbed.size());

        // If nothing changed, update sourceHash and timestamp
        if (toEmbed.isEmpty()) {
            ObjectNode updatedIndex = (ObjectNode) existingIndex;
            updatedIndex.put("sourceHash", sha256(ocrJson));
            updatedIndex.put("generatedAt", Instant.now().toString());
            fileService.saveJsonFile(contractFolder, INDEX_FILE_NAME,
                mapper.writerWithDefaultPrettyPrinter().writeValueAsString(updatedIndex));
            log.info("No articles changed for contract {}; updated sourceHash only", contract.getId());
            return;
        }

        // Embed only the changed/new articles
        Map<String, JsonNode> newEmbeddings = new HashMap<>();
        Integer dimensions = existingIndex.has("dimensions") ? existingIndex.get("dimensions").asInt() : null;
        for (int start = 0; start < toEmbed.size(); start += BATCH_SIZE) {
            List<PendingArticle> batch = toEmbed.subList(start,
                Math.min(start + BATCH_SIZE, toEmbed.size()));
            List<List<Double>> embeddings = embeddingService.getEmbeddings(
                batch.stream().map(PendingArticle::text).toList());
            if (embeddings.size() != batch.size()) {
                throw new IllegalStateException("Embedding service returned the wrong number of vectors");
            }
            for (int i = 0; i < batch.size(); i++) {
                List<Double> embedding = embeddings.get(i);
                if (embedding == null || embedding.isEmpty()) {
                    throw new IllegalStateException("Embedding returned no vector for article " + batch.get(i).articleId());
                }
                if (dimensions == null) dimensions = embedding.size();
                newEmbeddings.put(batch.get(i).articleId(), mapper.valueToTree(embedding));
            }
        }

        // Build the updated index, preserving unchanged embeddings
        ObjectNode index = mapper.createObjectNode();
        index.put("schemaVersion", 1);
        index.put("contractId", contract.getId());
        index.put("companyId", contract.getCompany().getId());
        index.put("sourceFile", "ocrData.json");
        index.put("sourceHash", sha256(ocrJson));
        index.put("embeddingModel", EMBEDDING_MODEL);
        index.put("generatedAt", Instant.now().toString());
        ArrayNode indexedArticles = index.putArray("articles");

        for (JsonNode article : articles) {
            String id = articleId(article);
            String text = articleText(article);
            if (id == null || text == null || text.length() < 5) continue;

            ObjectNode indexedArticle = indexedArticles.addObject();
            indexedArticle.put("articleId", id);
            indexedArticle.put("textHash", sha256(text));

            if (newEmbeddings.containsKey(id)) {
                indexedArticle.set("embedding", newEmbeddings.get(id));
            } else {
                ExistingArticleEntry existing = existingEntries.get(id);
                if (existing != null) {
                    indexedArticle.set("embedding", existing.embedding());
                }
            }
        }

        index.put("dimensions", dimensions);
        fileService.saveJsonFile(contractFolder, INDEX_FILE_NAME,
            mapper.writerWithDefaultPrettyPrinter().writeValueAsString(index));
        log.info("Incremental reindex complete for contract {}: re-embedded {} articles", contract.getId(), toEmbed.size());
    }

    public static String articleId(JsonNode article) {
        if (article.hasNonNull("id") && !article.get("id").asText().isBlank()) return article.get("id").asText();
        if (article.hasNonNull("article_number") && !article.get("article_number").asText().isBlank()) return article.get("article_number").asText();
        return null;
    }

    public static String articleText(JsonNode article) {
        for (String field : List.of("value", "text", "value_ocr")) {
            if (article.hasNonNull(field)) {
                String text = article.get(field).asText().trim();
                if (!text.isEmpty()) return text;
            }
        }
        return null;
    }

    public static String sha256(String value) {
        try {
            byte[] hash = MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8));
            StringBuilder out = new StringBuilder(hash.length * 2);
            for (byte b : hash) out.append(String.format("%02x", b));
            return out.toString();
        } catch (Exception e) {
            throw new IllegalStateException("Unable to calculate content hash", e);
        }
    }

    private record PendingArticle(String articleId, String text) {}
    private record ExistingArticleEntry(String textHash, JsonNode embedding) {}
}
