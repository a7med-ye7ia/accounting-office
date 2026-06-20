package com.accounting.backend.services;

import com.openhtmltopdf.pdfboxout.PdfRendererBuilder;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.io.ByteArrayOutputStream;

@Service
public class PdfService {

    private final TemplateEngine templateEngine;

    public PdfService(TemplateEngine templateEngine) {
        this.templateEngine = templateEngine;
    }

        public byte[] generateAmendmentPdf(
            String contractTitle,
            String companyName,
            String companyLegalLine,
            java.util.List<java.util.Map<String, Object>> requestSections) throws Exception {
        // 1. Build the model for Thymeleaf
        Context context = new Context();
        context.setVariable("contractTitle", contractTitle != null && !contractTitle.isBlank() ? contractTitle : "عقد تعديل");
        context.setVariable("companyName", companyName != null ? companyName : "");
        context.setVariable("companyLegalLine", companyLegalLine != null ? companyLegalLine : "");

        java.util.List<java.util.Map<String, Object>> sectionsModel = new java.util.ArrayList<>();
        java.util.List<String> articleLabels = new java.util.ArrayList<>();
        if (requestSections != null) {
            for (java.util.Map<String, Object> s : requestSections) {
                String before = s.get("beforeText") != null ? String.valueOf(s.get("beforeText")) : "";
                String after = s.get("afterText") != null ? String.valueOf(s.get("afterText")) : (s.get("modelOutput") != null ? String.valueOf(s.get("modelOutput")) : "");
                String selectedArticleId = s.get("selectedArticleId") != null ? String.valueOf(s.get("selectedArticleId")) : "";
                String ordinal = "";
                if (!selectedArticleId.isBlank()) {
                    ordinal = toArabicOrdinalFeminine(selectedArticleId);
                }
                String sectionTitleBefore = ordinal.isEmpty() ? "المادة قبل التعديل" : String.format("المادة %s قبل التعديل", ordinal);
                String sectionTitleAfter = ordinal.isEmpty() ? "المادة بعد التعديل" : String.format("المادة %s بعد التعديل", ordinal);

                java.util.Map<String, Object> map = new java.util.HashMap<>();
                map.put("sectionTitleBefore", sectionTitleBefore);
                map.put("sectionTitleAfter", sectionTitleAfter);
                map.put("beforeText", before);
                map.put("afterText", after);
                map.put("selectedArticleTitle", s.get("selectedArticleTitle"));
                sectionsModel.add(map);

                if (s.get("selectedArticleId") != null && !String.valueOf(s.get("selectedArticleId")).isBlank()) {
                    articleLabels.add("المادة " + toArabicOrdinalFeminine(String.valueOf(s.get("selectedArticleId"))));
                } else if (s.get("selectedArticleTitle") != null && !String.valueOf(s.get("selectedArticleTitle")).isBlank()) {
                    articleLabels.add(String.valueOf(s.get("selectedArticleTitle")));
                }
            }
        }

        context.setVariable("sections", sectionsModel);
        context.setVariable("articleLabels", articleLabels);

        String htmlContent = templateEngine.process("pdf-template", context);

        // 2. Convert HTML to PDF using OpenHTMLToPDF
        // 2. Convert HTML to PDF using OpenHTMLToPDF
        try (ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {
            PdfRendererBuilder builder = new PdfRendererBuilder();
            
            // Enable Arabic / RTL text shaping
            builder.useFastMode();
            builder.useUnicodeBidiSplitter(new com.openhtmltopdf.bidi.support.ICUBidiSplitter.ICUBidiSplitterFactory());
            builder.useUnicodeBidiReorderer(new com.openhtmltopdf.bidi.support.ICUBidiReorderer());
            
            // ---> ADD THIS LINE TO LOAD THE FONT DIRECTLY <---
            builder.useFont(
                () -> getClass().getResourceAsStream("/fonts/NotoNaskhArabic-Regular.ttf"),
                "Noto Naskh"
            );
            
            builder.withHtmlContent(htmlContent, getClass().getResource("/").toExternalForm());
            builder.toStream(outputStream);
            builder.run();

            return outputStream.toByteArray();
        }
    }

    // Convert numeric article id to an Arabic feminine ordinal word (1..20). Falls back to numeric if unknown.
    private String toArabicOrdinalFeminine(String idStr) {
        try {
            int n = Integer.parseInt(idStr);
            String[] ord = new String[]{"", "الأولى", "الثانية", "الثالثة", "الرابعة", "الخامسة", "السادسة", "السابعة", "الثامنة", "التاسعة", "العاشرة", "الحادية عشرة", "الثانية عشرة", "الثالثة عشرة", "الرابعة عشرة", "الخامسة عشرة", "السادسة عشرة", "السابعة عشرة", "الثامنة عشرة", "التاسعة عشرة", "العشرون"};
            if (n >= 1 && n < ord.length) return ord[n];
            return "رقم " + idStr;
        } catch (NumberFormatException e) {
            return "رقم " + idStr;
        }
    }
}