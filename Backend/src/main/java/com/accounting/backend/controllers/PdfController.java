package com.accounting.backend.controllers;

import com.accounting.backend.dto.PartnerDto;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.accounting.backend.services.PdfService;

@RestController
@RequestMapping("/api/pdf")
@CrossOrigin(origins = "*")
public class PdfController {

    private final PdfService pdfService;

    public PdfController(PdfService pdfService) {
        this.pdfService = pdfService;
    }

    @PostMapping("/generate")
    public ResponseEntity<byte[]> generatePdf(@RequestBody PdfRequest request) {
        try {
            java.util.List<java.util.Map<String, Object>> sectionsForService = new java.util.ArrayList<>();
            if (request.getSections() != null) {
                for (PdfRequest.SectionRequest s : request.getSections()) {
                    java.util.Map<String, Object> m = new java.util.HashMap<>();
                    m.put("id", s.getId());
                    m.put("selectedArticleId", s.getSelectedArticleId());
                    m.put("selectedArticleTitle", s.getSelectedArticleTitle());
                    m.put("beforeText", s.getBeforeText());
                    m.put("afterText", s.getAfterText());
                    m.put("modelOutput", s.getModelOutput());
                    m.put("embeddingScore", s.getEmbeddingScore());
                    sectionsForService.add(m);
                }
            }

            byte[] pdfBytes = pdfService.generateAmendmentPdf(
                request.getContractTitle(),
                request.getCompanyName(),
                request.getCompanyLegalLine(),
                request.getIntroText(),
                request.getCompanyCapital(),
                request.getContractDate(),
                request.getPartners(),
                sectionsForService
            );

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("attachment", "report.pdf");

            return ResponseEntity.ok()
                    .headers(headers)
                    .body(pdfBytes);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    public static class PdfRequest {
        private String contractTitle;
        private String companyName;
        private String companyLegalLine;
        private String introText;
        private String companyCapital;
        private String contractDate;
        private java.util.List<PartnerDto> partners;
        private java.util.List<SectionRequest> sections;

        public String getContractTitle() { return contractTitle; }
        public void setContractTitle(String contractTitle) { this.contractTitle = contractTitle; }

        public String getCompanyName() { return companyName; }
        public void setCompanyName(String companyName) { this.companyName = companyName; }

        public String getCompanyLegalLine() { return companyLegalLine; }
        public void setCompanyLegalLine(String companyLegalLine) { this.companyLegalLine = companyLegalLine; }

        public String getIntroText() { return introText; }
        public void setIntroText(String introText) { this.introText = introText; }

        public String getCompanyCapital() { return companyCapital; }
        public void setCompanyCapital(String companyCapital) { this.companyCapital = companyCapital; }

        public String getContractDate() { return contractDate; }
        public void setContractDate(String contractDate) { this.contractDate = contractDate; }

        public java.util.List<PartnerDto> getPartners() { return partners; }
        public void setPartners(java.util.List<PartnerDto> partners) { this.partners = partners; }

        public java.util.List<SectionRequest> getSections() { return sections; }
        public void setSections(java.util.List<SectionRequest> sections) { this.sections = sections; }

        public static class SectionRequest {
            private String id;
            private String selectedArticleId;
            private String selectedArticleTitle;
            private String beforeText;
            private String afterText;
            private String modelOutput;
            private Double embeddingScore;

            public String getId() { return id; }
            public void setId(String id) { this.id = id; }
            public String getSelectedArticleId() { return selectedArticleId; }
            public void setSelectedArticleId(String selectedArticleId) { this.selectedArticleId = selectedArticleId; }
            public String getSelectedArticleTitle() { return selectedArticleTitle; }
            public void setSelectedArticleTitle(String selectedArticleTitle) { this.selectedArticleTitle = selectedArticleTitle; }
            public String getBeforeText() { return beforeText; }
            public void setBeforeText(String beforeText) { this.beforeText = beforeText; }
            public String getAfterText() { return afterText; }
            public void setAfterText(String afterText) { this.afterText = afterText; }
            public String getModelOutput() { return modelOutput; }
            public void setModelOutput(String modelOutput) { this.modelOutput = modelOutput; }
            public Double getEmbeddingScore() { return embeddingScore; }
            public void setEmbeddingScore(Double embeddingScore) { this.embeddingScore = embeddingScore; }
        }
    }
}