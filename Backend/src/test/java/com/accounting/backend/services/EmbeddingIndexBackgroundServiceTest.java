package com.accounting.backend.services;

import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.springframework.core.task.SyncTaskExecutor;

import com.accounting.backend.entities.Company;
import com.accounting.backend.entities.Contract;
import com.accounting.backend.repositories.ContractRepository;

class EmbeddingIndexBackgroundServiceTest {

    private ContractRepository contractRepository;
    private ArticleEmbeddingIndexService indexService;
    private EmbeddingIndexBackgroundService backgroundService;

    @BeforeEach
    void setUp() {
        contractRepository = mock(ContractRepository.class);
        indexService = mock(ArticleEmbeddingIndexService.class);
        // Use SyncTaskExecutor to test asynchronous method logic synchronously in unit tests
        backgroundService = new EmbeddingIndexBackgroundService(contractRepository, indexService, new SyncTaskExecutor());
    }

    @Test
    void testQueueIndex_Success_SetsStatusReady() throws Exception {
        Long contractId = 1L;
        Contract contract = new Contract();
        contract.setId(contractId);
        contract.setFilePath("company_1/CreationContract/contract.pdf");
        contract.setOcrData("{\"articles\":[{\"id\":\"A1\",\"value\":\"Text\"}]}");

        when(contractRepository.findById(contractId)).thenReturn(Optional.of(contract));

        backgroundService.queueIndex(contractId);

        Map<String, String> status = backgroundService.status(contractId);
        assertEquals("ready", status.get("status"));
        verify(indexService).indexContract(any(), any(), any());
    }

    @Test
    void testQueueIndex_Failure_SetsStatusFailedWithMessage() throws Exception {
        Long contractId = 2L;
        Contract contract = new Contract();
        contract.setId(contractId);
        contract.setFilePath("company_2/CreationContract/contract.pdf");
        contract.setOcrData("{\"articles\":[]}");

        when(contractRepository.findById(contractId)).thenReturn(Optional.of(contract));
        doThrow(new IllegalArgumentException("OCR data contains no indexable articles"))
            .when(indexService).indexContract(any(), any(), any());

        backgroundService.queueIndex(contractId);

        Map<String, String> status = backgroundService.status(contractId);
        assertEquals("failed", status.get("status"));
        assertEquals("OCR data contains no indexable articles", status.get("message"));
    }

    @Test
    void testStatus_UnindexedContract_ReturnsNotIndexed() {
        when(contractRepository.findById(anyLong())).thenReturn(Optional.empty());
        Map<String, String> status = backgroundService.status(999L);
        assertEquals("not_indexed", status.get("status"));
    }
}
