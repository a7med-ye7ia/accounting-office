package com.accounting.backend.services;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.rendering.PDFRenderer;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.MediaType;
import org.springframework.http.client.MultipartBodyBuilder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class OcrService {
    @Value("${ocr.api.url}")
    private String ocrApiUrl;
    private static final float RENDER_DPI = 200f;
    private final WebClient webClient;
    private final ObjectMapper objectMapper = new ObjectMapper();

public OcrService() {
    this.webClient = WebClient.builder()
            .codecs(config -> config
                    .defaultCodecs()
                    .maxInMemorySize(20 * 1024 * 1024))
            .build();
}

    // ── Main entry point called by controller ─────────────────────────────────
    public List<Map<String, Object>> processPdf(MultipartFile pdfFile, String fileId)
            throws Exception {

        // Step 1: PDF → list of JPEG byte arrays
        List<byte[]> pageImages = pdfToImages(pdfFile);
        int totalPages = pageImages.size();

        System.out.printf("PDF loaded | file=%s | pages=%d%n", fileId, totalPages);

        if (totalPages < 2) {
            throw new IllegalArgumentException(
                "PDF must have at least 2 pages, got: " + totalPages);
        }

        // Step 2: overlapping pairs loop (0,1), (1,2), ... (N-2, N-1)
        List<Map<String, Object>> chunks = new ArrayList<>();

        for (int i = 0; i < totalPages - 1; i++) {
            int pageStart = i + 1; // 1-indexed for the API
            System.out.printf("Processing pages %d & %d of %d...%n",
                    pageStart, pageStart + 1, totalPages);

            Map<String, Object> chunk = callPredictEndpoint(
                    pageImages.get(i),
                    pageImages.get(i + 1),
                    fileId,
                    pageStart
            );

            chunks.add(chunk);
            System.out.printf("Pages %d & %d done | json_valid=%s%n",
                    pageStart, pageStart + 1, chunk.get("json_valid"));
        }

        System.out.printf("All %d pairs processed for %s%n", chunks.size(), fileId);
        return chunks;
    }

    // ── PDF → List of JPEG byte arrays using PDFBox ───────────────────────────
    private List<byte[]> pdfToImages(MultipartFile pdfFile) throws Exception {
        List<byte[]> images = new ArrayList<>();
    
        try (PDDocument document = PDDocument.load(pdfFile.getBytes())) {
            PDFRenderer renderer = new PDFRenderer(document);
            int pageCount = document.getNumberOfPages();
    
            for (int i = 0; i < pageCount; i++) {
                BufferedImage pageImage = renderer.renderImageWithDPI(i, RENDER_DPI);
    
                ByteArrayOutputStream baos = new ByteArrayOutputStream();
                ImageIO.write(pageImage, "JPEG", baos);
                images.add(baos.toByteArray());
            }
        }
    
        return images;
    }

    // ── Single POST /predict call to Lightning AI ─────────────────────────────
    @SuppressWarnings("unchecked")
    Map<String, Object> callPredictEndpoint(
            byte[] image1Bytes,
            byte[] image2Bytes,
            String fileId,
            int pageStart) throws Exception {

        // Build multipart form body
        MultipartBodyBuilder bodyBuilder = new MultipartBodyBuilder();

        bodyBuilder.part("image1", new ByteArrayResource(image1Bytes) {
            @Override
            public String getFilename() { return "page_" + pageStart + ".jpg"; }
        }).contentType(MediaType.IMAGE_JPEG);

        bodyBuilder.part("image2", new ByteArrayResource(image2Bytes) {
            @Override
            public String getFilename() { return "page_" + (pageStart + 1) + ".jpg"; }
        }).contentType(MediaType.IMAGE_JPEG);

        bodyBuilder.part("file_id", fileId);
        bodyBuilder.part("page_start", String.valueOf(pageStart));

        // Call the API — 90s timeout to handle slow inference
        String responseBody = webClient.post()
                .uri(ocrApiUrl + "/predict")
                .contentType(MediaType.MULTIPART_FORM_DATA)
                .body(BodyInserters.fromMultipartData(bodyBuilder.build()))
                .retrieve()
                .bodyToMono(String.class)
                .timeout(java.time.Duration.ofSeconds(300))
                .block();

        return objectMapper.readValue(responseBody, Map.class);
    }

    public Map<String, Object> pingCloud() {
        Map<String, Object> response = new HashMap<>();
        try {
            String result = webClient.get()
                    .uri(ocrApiUrl + "/health")
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(java.time.Duration.ofSeconds(10))
                    .block();
    
            response.put("status",       "ok");
            response.put("spring",       "ok");
            response.put("lightning_ai", result);
    
        } catch (Exception e) {
            response.put("status",       "error");
            response.put("spring",       "ok");
            response.put("lightning_ai", "unreachable: " + e.getMessage());
        }
        return response;
    }

    public Map<String, Object> testImages(MultipartFile image1, MultipartFile image2) {
        try {
            MultipartBodyBuilder bodyBuilder = new MultipartBodyBuilder();
    
            bodyBuilder.part("image1", new ByteArrayResource(image1.getBytes()) {
                @Override
                public String getFilename() { return image1.getOriginalFilename(); }
            }).contentType(MediaType.IMAGE_JPEG);
    
            bodyBuilder.part("image2", new ByteArrayResource(image2.getBytes()) {
                @Override
                public String getFilename() { return image2.getOriginalFilename(); }
            }).contentType(MediaType.IMAGE_JPEG);
    
            String response = webClient.post()
                    .uri(ocrApiUrl + "/test-images")
                    .contentType(MediaType.MULTIPART_FORM_DATA)
                    .body(BodyInserters.fromMultipartData(bodyBuilder.build()))
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(java.time.Duration.ofSeconds(90))
                    .block();
    
            return objectMapper.readValue(response, Map.class);
    
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("status", "error");
            error.put("message", e.getMessage());
            return error;
        }
    }
    public Map<String, Object> testPredict(MultipartFile image1,MultipartFile image2,String fileId,int pageStart) {
        try {
            return callPredictEndpoint(
                    image1.getBytes(),
                    image2.getBytes(),
                    fileId,
                    pageStart
            );
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("status",  "error");
            error.put("message", e.getMessage());
            return error;
        }
    }
}