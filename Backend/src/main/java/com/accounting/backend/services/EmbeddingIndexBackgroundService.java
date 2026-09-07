package com.accounting.backend.services;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import com.accounting.backend.entities.Contract;
import com.accounting.backend.repositories.ContractRepository;

/** Runs local-model indexing away from the company-creation HTTP request. */
@Service
public class EmbeddingIndexBackgroundService {

    private static final String FILE_SYSTEM_ROOT = "../FileSystem";
    private final ContractRepository contractRepository;
    private final ArticleEmbeddingIndexService articleEmbeddingIndexService;
    private final org.springframework.core.task.TaskExecutor embeddingIndexExecutor;
    private final Map<Long, IndexState> states = new ConcurrentHashMap<>();

    public EmbeddingIndexBackgroundService(ContractRepository contractRepository,
            ArticleEmbeddingIndexService articleEmbeddingIndexService,
            @org.springframework.beans.factory.annotation.Qualifier("embeddingIndexExecutor") org.springframework.core.task.TaskExecutor embeddingIndexExecutor) {
        this.contractRepository = contractRepository;
        this.articleEmbeddingIndexService = articleEmbeddingIndexService;
        this.embeddingIndexExecutor = embeddingIndexExecutor;
    }

    public void queueIndex(Long contractId) {
        states.put(contractId, new IndexState("indexing", null));
        embeddingIndexExecutor.execute(() -> buildIndex(contractId));
    }

    @Async("embeddingIndexExecutor")
    public void buildIndex(Long contractId) {
        try {
            Contract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new IllegalArgumentException("Contract not found"));
            Path folder = Path.of(contract.getFilePath()).getParent();
            if (folder == null || contract.getOcrData() == null || contract.getOcrData().isBlank()) {
                throw new IllegalStateException("Contract has no OCR data to index");
            }
            articleEmbeddingIndexService.reindexContract(contract, folder.toString(), contract.getOcrData());
            states.put(contractId, new IndexState("ready", null));
        } catch (Exception e) {
            states.put(contractId, new IndexState("failed", e.getMessage()));
        }
    }

    public Map<String, String> status(Long contractId) {
        IndexState state = states.get(contractId);
        if (state != null) return state.asMap();
        return indexFileExists(contractId)
            ? new IndexState("ready", null).asMap()
            : new IndexState("not_indexed", null).asMap();
    }

    private boolean indexFileExists(Long contractId) {
        return contractRepository.findById(contractId).map(contract -> {
            Path folder = Path.of(FILE_SYSTEM_ROOT, contract.getFilePath()).getParent();
            return folder != null && Files.exists(folder.resolve(ArticleEmbeddingIndexService.INDEX_FILE_NAME));
        }).orElse(false);
    }

    private record IndexState(String status, String message) {
        Map<String, String> asMap() {
            return message == null ? Map.of("status", status) : Map.of("status", status, "message", message);
        }
    }
}
