package com.accounting.backend.services;

import java.io.IOException;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
import org.mockito.Mockito;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.accounting.backend.entities.Company;
import com.accounting.backend.entities.Contract;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

class ArticleEmbeddingIndexServiceTest {

    private EmbeddingService embeddingService;
    private FileService fileService;
    private ArticleEmbeddingIndexService indexService;
    private final ObjectMapper mapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        embeddingService = mock(EmbeddingService.class);
        fileService = mock(FileService.class);
        indexService = new ArticleEmbeddingIndexService(embeddingService, fileService);
    }

    @Test
    void testIndexContract_MissingArticleIdOrText_SkipsInvalid() throws Exception {
        Contract contract = createDummyContract();
        String ocrJson = """
            {
              "articles": [
                {"id": "", "value": "Valid text length here"},
                {"id": "A1", "value": ""},
                {"id": "A2", "value": "Short"},
                {"id": "A3", "value": "هذه مادة قانونية صحيحة تزيد عن 5 أحرف"}
              ]
            }
            """;

        when(embeddingService.getEmbeddings(anyList()))
            .thenReturn(List.of(List.of(0.1, 0.2, 0.3)));

        indexService.indexContract(contract, "testFolder", ocrJson);

        verify(fileService).saveJsonFile(eq("testFolder"), eq(ArticleEmbeddingIndexService.INDEX_FILE_NAME), Mockito.argThat(json -> {
            try {
                JsonNode root = mapper.readTree(json);
                JsonNode articles = root.path("articles");
                return articles.isArray() && articles.size() == 1
                    && "A3".equals(articles.get(0).path("articleId").asText());
            } catch (Exception e) {
                return false;
            }
        }));
    }

    @Test
    void testIndexContract_WrongVectorDimensions_ThrowsException() throws Exception {
        Contract contract = createDummyContract();
        String ocrJson = """
            {
              "articles": [
                {"id": "A1", "value": "المادة الأولى من العقد الإداري"},
                {"id": "A2", "value": "المادة الثانية من العقد الإداري"}
              ]
            }
            """;

        // Return dimensions 2 for first article, 3 for second article
        when(embeddingService.getEmbeddings(anyList()))
            .thenReturn(List.of(List.of(0.1, 0.2), List.of(0.1, 0.2, 0.3)));

        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
            indexService.indexContract(contract, "testFolder", ocrJson));
        assertTrue(ex.getMessage().contains("dimensions differ"));
    }

    @Test
    void testIndexContract_BatchingAndOrderingPreserved() throws Exception {
        Contract contract = createDummyContract();
        StringBuilder ocrBuf = new StringBuilder("{\"articles\": [");
        for (int i = 1; i <= 20; i++) {
            if (i > 1) ocrBuf.append(",");
            ocrBuf.append(String.format("{\"id\": \"ART_%d\", \"value\": \"نص المادة رقم %d القانونية\"}", i, i));
        }
        ocrBuf.append("]}");

        // Mock 16 items for batch 1, 4 items for batch 2
        when(embeddingService.getEmbeddings(Mockito.argThat(list -> list != null && list.size() == 16)))
            .thenAnswer(inv -> {
                List<String> texts = inv.getArgument(0);
                return texts.stream().map(t -> List.of(1.0, 0.0, 0.0)).toList();
            });
        when(embeddingService.getEmbeddings(Mockito.argThat(list -> list != null && list.size() == 4)))
            .thenAnswer(inv -> {
                List<String> texts = inv.getArgument(0);
                return texts.stream().map(t -> List.of(0.0, 1.0, 0.0)).toList();
            });

        indexService.indexContract(contract, "testFolder", ocrBuf.toString());

        verify(fileService).saveJsonFile(eq("testFolder"), eq(ArticleEmbeddingIndexService.INDEX_FILE_NAME), Mockito.argThat(json -> {
            try {
                JsonNode root = mapper.readTree(json);
                JsonNode articles = root.path("articles");
                assertEquals(20, articles.size());
                assertEquals("ART_1", articles.get(0).path("articleId").asText());
                assertEquals("ART_16", articles.get(15).path("articleId").asText());
                assertEquals("ART_20", articles.get(19).path("articleId").asText());
                return true;
            } catch (IOException e) {
                return false;
            }
        }));
    }

    private Contract createDummyContract() {
        Company company = new Company();
        company.setId(100L);
        company.setName("Test Co");

        Contract contract = new Contract();
        contract.setId(200L);
        contract.setCompany(company);
        return contract;
    }
}
