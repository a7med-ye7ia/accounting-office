package com.accounting.backend.services;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;

import com.accounting.backend.dtos.ArticleSearchResult;
import com.accounting.backend.entities.Contract;
import com.accounting.backend.enums.ContractType;
import com.accounting.backend.repositories.ContractRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

@Service
public class ArticleSearchService {

    private static final String FILE_SYSTEM_ROOT = "../FileSystem";

    private final EmbeddingService embeddingService;
    private final ContractRepository contractRepository;
    private final ArticleEmbeddingIndexService articleEmbeddingIndexService;
    private final ObjectMapper mapper = new ObjectMapper();

    public ArticleSearchService(EmbeddingService embeddingService,
            ContractRepository contractRepository,
            ArticleEmbeddingIndexService articleEmbeddingIndexService) {
        this.embeddingService = embeddingService;
        this.contractRepository = contractRepository;
        this.articleEmbeddingIndexService = articleEmbeddingIndexService;
    }

    /** Ranks the company contract's OCR articles using its persistent per-article index. */
    public List<ArticleSearchResult> searchArticles(Long companyId, String query, int topK) throws Exception {
        if (query == null || query.isBlank() || topK < 1) return Collections.emptyList();

        Contract contract = contractRepository.findByCompany_IdAndType(companyId, ContractType.CREATING)
            .stream()
            .findFirst()
            .orElseGet(() -> contractRepository.findByCompany_Id(companyId)
                .stream()
                .findFirst()
                .orElse(null));
        if (contract == null || contract.getFilePath() == null) return Collections.emptyList();

        List<Double> queryVector = embeddingService.getEmbedding(query);
        if (queryVector == null || queryVector.isEmpty()) return Collections.emptyList();

        Path contractDirectory = Path.of(FILE_SYSTEM_ROOT, contract.getFilePath()).getParent();
        if (contractDirectory == null) return Collections.emptyList();

        Path ocrPath = contractDirectory.resolve("ocrData.json");
        String ocrJson = null;
        if (Files.exists(ocrPath)) {
            ocrJson = Files.readString(ocrPath);
        } else if (contract.getOcrData() != null && !contract.getOcrData().isBlank()) {
            ocrJson = contract.getOcrData();
        }

        if (ocrJson == null || ocrJson.isBlank()) return Collections.emptyList();

        Path relativeFolder = Path.of(contract.getFilePath()).getParent();
        Path indexPath = contractDirectory.resolve(ArticleEmbeddingIndexService.INDEX_FILE_NAME);

        if (!Files.exists(indexPath) && relativeFolder != null) {
            articleEmbeddingIndexService.indexContract(contract, relativeFolder.toString(), ocrJson);
        }

        if (!Files.exists(indexPath)) return Collections.emptyList();

        JsonNode indexRoot = mapper.readTree(Files.readString(indexPath));
        try {
            verifyIndex(indexRoot, contract, ocrJson, queryVector.size());
        } catch (IllegalStateException e) {
            if (relativeFolder != null) {
                articleEmbeddingIndexService.reindexContract(contract, relativeFolder.toString(), ocrJson);
                indexRoot = mapper.readTree(Files.readString(indexPath));
            }
        }

        Map<String, String> articleTextById = articleTextById(mapper.readTree(ocrJson));
        List<ArticleSearchResult> results = new ArrayList<>();
        for (JsonNode indexedArticle : indexRoot.path("articles")) {
            String articleId = indexedArticle.path("articleId").asText();
            String articleText = articleTextById.get(articleId);
            JsonNode vectorNode = indexedArticle.path("embedding");
            if (articleText == null || !vectorNode.isArray()) continue;

            List<Double> vector = mapper.convertValue(vectorNode,
                mapper.getTypeFactory().constructCollectionType(List.class, Double.class));
            results.add(new ArticleSearchResult(articleId, articleText,
                cosineSimilarity(queryVector, vector), companyId));
        }

        results.sort(Comparator.comparingDouble(ArticleSearchResult::getScore).reversed());
        return results.subList(0, Math.min(topK, results.size()));
    }

    private void verifyIndex(JsonNode index, Contract contract, String ocrJson, int queryDimensions) {
        if (index.path("schemaVersion").asInt() != 1
                || index.path("contractId").asLong() != contract.getId()
                || !ArticleEmbeddingIndexService.sha256(ocrJson).equals(index.path("sourceHash").asText())) {
            throw new IllegalStateException("Article embedding index is stale; re-index this contract");
        }
        if (index.path("dimensions").asInt() != queryDimensions) {
            throw new IllegalStateException("Article embedding index uses an incompatible model");
        }
    }

    private Map<String, String> articleTextById(JsonNode ocrRoot) {
        Map<String, String> articles = new HashMap<>();
        for (JsonNode article : ocrRoot.path("articles")) {
            String id = ArticleEmbeddingIndexService.articleId(article);
            String text = ArticleEmbeddingIndexService.articleText(article);
            if (id != null && text != null) articles.put(id, text);
        }
        return articles;
    }

    private double cosineSimilarity(List<Double> a, List<Double> b) {
        if (a.size() != b.size() || a.isEmpty()) return 0.0;
        double dot = 0.0, aMagnitude = 0.0, bMagnitude = 0.0;
        for (int i = 0; i < a.size(); i++) {
            dot += a.get(i) * b.get(i);
            aMagnitude += a.get(i) * a.get(i);
            bMagnitude += b.get(i) * b.get(i);
        }
        if (aMagnitude == 0.0 || bMagnitude == 0.0) return 0.0;
        return dot / (Math.sqrt(aMagnitude) * Math.sqrt(bMagnitude));
    }
}
