package com.accounting.backend.services;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.accounting.backend.dtos.ArticleSearchResult;
import com.accounting.backend.entities.Company;
import com.accounting.backend.repositories.CompanyRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

@Service
public class ArticleSearchService {

    @Autowired
    private EmbeddingService embeddingService;

    @Autowired
    private CompanyRepository companyRepository;

    private final ObjectMapper mapper = new ObjectMapper();
    private static final String FILE_SYSTEM_ROOT = "../FileSystem";

    /**
     * Search for articles in a company's contracts by semantic similarity
     * (cosine similarity in embedding space).
     *
     * @param companyId   Company ID to search within
     * @param query       Query text (will be embedded)
     * @param topK        Number of top results to return
     * @return            List of articles ranked by similarity score
     */
    public List<ArticleSearchResult> searchArticles(Long companyId, String query, int topK)
            throws Exception {
        // Validate company exists
        Optional<Company> company = companyRepository.findById(companyId);
        if (!company.isPresent()) {
            return Collections.emptyList();
        }

        // Get query embedding
        List<Double> queryVector = embeddingService.getEmbedding(query);
        if (queryVector == null || queryVector.isEmpty()) {
            return Collections.emptyList();
        }

        // Load OCR and embedding data from FileSystem
        String companyFolder = companyId + " - " + company.get().getName();
        List<ArticleSearchResult> results = new ArrayList<>();

        try {
            Path creationContractPath = Path.of(FILE_SYSTEM_ROOT, companyFolder, "CreationContract");
            Path ocrPath = creationContractPath.resolve("ocrData.json");
            Path embeddingPath = creationContractPath.resolve("embedding.json");

            if (!Files.exists(ocrPath) || !Files.exists(embeddingPath)) {
                return Collections.emptyList();
            }

            // Parse OCR data
            String ocrContent = Files.readString(ocrPath);
            JsonNode ocrData = mapper.readTree(ocrContent);

            // Parse embedding vector
            String embeddingContent = Files.readString(embeddingPath);
            List<Double> contractVector = mapper.readValue(embeddingContent,
                    mapper.getTypeFactory().constructCollectionType(List.class, Double.class));

            // For now: single contract similarity score
            // (In future: iterate over multiple contracts/articles per company)
            if (ocrData.has("articles") && ocrData.get("articles").isArray()) {
                for (JsonNode article : ocrData.get("articles")) {
                    String articleId = article.has("id") ? article.get("id").asText() : "unknown";
                    String articleText = article.has("value") ? article.get("value").asText() : "";

                    // Compute cosine similarity between query and contract
                    double similarity = cosineSimilarity(queryVector, contractVector);

                    results.add(new ArticleSearchResult(
                            articleId,
                            articleText,
                            similarity,
                            companyId
                    ));
                }
            }
        } catch (IOException e) {
            // Log error but return empty list
            e.printStackTrace();
        }

        // Sort by similarity (descending) and return top K
        results.sort(Comparator.comparingDouble(ArticleSearchResult::getScore).reversed());
        return results.subList(0, Math.min(topK, results.size()));
    }

    /**
     * Compute cosine similarity between two vectors.
     */
    private double cosineSimilarity(List<Double> vecA, List<Double> vecB) {
        if (vecA == null || vecB == null || vecA.isEmpty() || vecB.isEmpty()) {
            return 0.0;
        }

        int minLen = Math.min(vecA.size(), vecB.size());
        double dotProduct = 0.0;
        double magA = 0.0;
        double magB = 0.0;

        for (int i = 0; i < minLen; i++) {
            double a = vecA.get(i);
            double b = vecB.get(i);
            dotProduct += a * b;
            magA += a * a;
            magB += b * b;
        }

        magA = Math.sqrt(magA);
        magB = Math.sqrt(magB);

        if (magA == 0.0 || magB == 0.0) {
            return 0.0;
        }

        return dotProduct / (magA * magB);
    }
}
