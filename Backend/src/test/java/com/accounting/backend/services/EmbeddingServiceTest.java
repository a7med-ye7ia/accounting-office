package com.accounting.backend.services;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import org.junit.jupiter.api.Test;

class EmbeddingServiceTest {

    @Test
    void testTruncateAtSentenceBoundary_UnderLimit_NoChange() {
        String input = "هذه مادة قانونية قصيرة للغاية.";
        String result = EmbeddingService.truncateAtSentenceBoundary(input, 100);
        assertEquals(input, result);
    }

    @Test
    void testTruncateAtSentenceBoundary_OverLimit_TruncatesAtSentenceOrSpaceBoundary() {
        String input = "المادة الأولى: تأسست الشركة وفقا لأحكام القانون. المادة الثانية: مقر الشركة في مدينة الرياض. المادة الثالثة: غرض الشركة هو التجارة.";
        // Limit to 60 characters
        String result = EmbeddingService.truncateAtSentenceBoundary(input, 60);
        // Should break at period boundary without splitting mid-sentence
        assertEquals("المادة الأولى: تأسست الشركة وفقا لأحكام القانون.", result);
    }

    @Test
    void testValidateInput_EmptyText_ThrowsException() {
        EmbeddingService service = new EmbeddingService();
        assertThrows(IllegalArgumentException.class, () -> service.getEmbedding(""));
        assertThrows(IllegalArgumentException.class, () -> service.getEmbedding("   "));
    }
}
