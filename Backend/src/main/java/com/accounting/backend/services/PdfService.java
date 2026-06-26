package com.accounting.backend.services;

import com.openhtmltopdf.pdfboxout.PdfRendererBuilder;

import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;

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
            String introText,
            String companyCapital,
            String contractDate,
            java.util.List<com.accounting.backend.dto.PartnerDto> partners,
            java.util.List<java.util.Map<String, Object>> requestSections) throws Exception {
        // 1. Build the model for Thymeleaf
        Context context = new Context();
        context.setVariable("contractTitle", contractTitle != null && !contractTitle.isBlank() ? contractTitle : "عقد تعديل");
        context.setVariable("companyName", companyName != null ? companyName : "");
        context.setVariable("companyLegalLine", companyLegalLine != null ? companyLegalLine : "");
        context.setVariable("companyLegalLineHeader", formatCompanyLegalLine(companyLegalLine != null ? companyLegalLine : ""));
        context.setVariable("introText", introText != null ? introText : "");
        context.setVariable("companyCapital", companyCapital != null ? companyCapital : "");
        
        java.time.LocalDate today = java.time.LocalDate.now();
        String defaultDate = String.format("%d/%d/%d", today.getDayOfMonth(), today.getMonthValue(), today.getYear());
        String finalDate = (contractDate != null && !contractDate.isBlank()) ? contractDate : defaultDate;
        String weekDay = getArabicWeekDay(finalDate);
        String dateString = String.format("انه في يوم %s الموافق %s", weekDay, finalDate);
        context.setVariable("dateString", dateString);
        context.setVariable("partners", partners != null && !partners.isEmpty() ? partners : getDefaultPartners());

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

        try (ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {
            PdfRendererBuilder builder = new PdfRendererBuilder();

            builder.useUnicodeBidiSplitter(new com.openhtmltopdf.bidi.support.ICUBidiSplitter.ICUBidiSplitterFactory());
            builder.useUnicodeBidiReorderer(new com.openhtmltopdf.bidi.support.ICUBidiReorderer());

            builder.useFont(this::openArabicFont, "Noto Naskh", 400, PdfRendererBuilder.FontStyle.NORMAL, true);
            builder.useFont(this::openArabicFont, "Noto Naskh", 700, PdfRendererBuilder.FontStyle.NORMAL, true);

            builder.withHtmlContent(htmlContent, getClass().getResource("/").toExternalForm());
            builder.toStream(outputStream);
            builder.run();

            return outputStream.toByteArray();
        }
    }

    private InputStream openArabicFont() {
        try {
            return new ClassPathResource("fonts/NotoNaskhArabic-Regular.ttf").getInputStream();
        } catch (IOException e) {
            throw new UncheckedIOException("Failed to load Arabic font", e);
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

    private String formatCompanyLegalLine(String input) {
        if (input == null || input.isBlank()) return "";
        String[] words = input.trim().split("\\s+");
        StringBuilder acronyms = new StringBuilder();
        StringBuilder restOfText = new StringBuilder();
        boolean found = false;

        for (String word : words) {
            if (!found) {
                if (word.equals("خاضعة") || word.equals("خاضعه")) {
                    found = true;
                    restOfText.append(word).append(" ");
                } else {
                    if (!word.isEmpty()) {
                        acronyms.append(word.charAt(0)).append(".");
                    }
                }
            } else {
                restOfText.append(word).append(" ");
            }
        }

        if (!found) return input; // Return original if keyword not found

        if (acronyms.length() > 0 && acronyms.charAt(acronyms.length() - 1) == '.') {
            acronyms.setLength(acronyms.length() - 1);
        }

        if (acronyms.length() > 0) {
            return "(" + acronyms.toString() + ") " + restOfText.toString().trim();
        } else {
            return restOfText.toString().trim();
        }
    }

    private String getArabicWeekDay(String dateStr) {
        try {
            java.time.LocalDate date;
            if (dateStr.contains("/")) {
                String[] parts = dateStr.split("/");
                int d = Integer.parseInt(parts[0]);
                int m = Integer.parseInt(parts[1]);
                int y = Integer.parseInt(parts[2]);
                date = java.time.LocalDate.of(y, m, d);
            } else if (dateStr.contains("-")) {
                date = java.time.LocalDate.parse(dateStr);
            } else {
                return "الخميس"; // Default fallback if format is strange
            }
            java.time.DayOfWeek day = date.getDayOfWeek();
            switch (day) {
                case SATURDAY: return "السبت";
                case SUNDAY: return "الأحد";
                case MONDAY: return "الإثنين";
                case TUESDAY: return "الثلاثاء";
                case WEDNESDAY: return "الأربعاء";
                case THURSDAY: return "الخميس";
                case FRIDAY: return "الجمعة";
                default: return "الخميس";
            }
        } catch (Exception e) {
            return "الخميس"; // Default fallback
        }
    }

    private java.util.List<com.accounting.backend.dto.PartnerDto> getDefaultPartners() {
        java.util.List<com.accounting.backend.dto.PartnerDto> list = new java.util.ArrayList<>();
        com.accounting.backend.dto.PartnerDto p1 = new com.accounting.backend.dto.PartnerDto();
        p1.setTitle("السيد");
        p1.setName("ادهم ايهاب");
        p1.setRole("مالك");
        list.add(p1);
        com.accounting.backend.dto.PartnerDto p2 = new com.accounting.backend.dto.PartnerDto();
        p2.setTitle("السيده");
        p2.setName("مريم محمد");
        p2.setRole("شريكه");
        list.add(p2);
        return list;
    }
}
