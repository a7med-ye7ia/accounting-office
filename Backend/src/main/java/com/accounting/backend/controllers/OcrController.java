package com.accounting.backend.controllers;

import com.accounting.backend.entities.ContractDocument;
import com.accounting.backend.services.AssemblyService;
import com.accounting.backend.services.OcrService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ocr")
@CrossOrigin(origins = "*")
public class OcrController {

    private final OcrService ocrService;
    private final AssemblyService assemblyService;

    public OcrController(OcrService ocrService, AssemblyService assemblyService) {
        this.ocrService      = ocrService;
        this.assemblyService = assemblyService;
    }

    @PostMapping("/extract")
    public ResponseEntity<ContractDocument> extractOcrData(
            @RequestParam("file")   MultipartFile file,
            @RequestParam("fileId") String fileId) {

        if (file.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        String contentType = file.getContentType();
        if (contentType == null || !contentType.equals("application/pdf")) {
            return ResponseEntity.badRequest().build();
        }

        try {
            List<Map<String, Object>> chunks = ocrService.processPdf(file, fileId);
            ContractDocument result          = assemblyService.assemble(chunks);
        
            // ── Save result to disk for inspection ────────────────────────────────
            String json = new com.fasterxml.jackson.databind.ObjectMapper()
                    .writerWithDefaultPrettyPrinter()
                    .writeValueAsString(result);
            java.nio.file.Files.writeString(
                    java.nio.file.Path.of(fileId + "_result.json"), json);
            System.out.println("✅ Result saved to: " + fileId + "_result.json");
            // ─────────────────────────────────────────────────────────────────────
        
            return ResponseEntity.ok(result);
        
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).build();
        }
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        return ResponseEntity.ok(ocrService.pingCloud());
    }

    @PostMapping("/test-predict")
    public ResponseEntity<Map<String, Object>> testPredict(
        @RequestParam("image1")     MultipartFile image1,
        @RequestParam("image2")     MultipartFile image2,
        @RequestParam("fileId")     String fileId,
        @RequestParam("pageStart")  int pageStart) {
    return ResponseEntity.ok(ocrService.testPredict(image1, image2, fileId, pageStart));
}
}