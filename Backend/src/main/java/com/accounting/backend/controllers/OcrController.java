package com.accounting.backend.controllers;

import com.accounting.backend.entities.ContractDocument;
import com.accounting.backend.services.AssemblyService;
import com.accounting.backend.services.OcrService;
import com.accounting.backend.services.ContracteService;
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
    private final ContracteService contractService;

    public OcrController(OcrService ocrService, AssemblyService assemblyService, ContracteService contractService) {
        this.ocrService      = ocrService;
        this.assemblyService = assemblyService;
        this.contractService = contractService;
    }

    @PostMapping("/extract2")
    public ResponseEntity<ContractDocument> extractOcrData2(@RequestParam("file") MultipartFile file, @RequestParam("fileId") String fileId) throws InterruptedException {
        
        // get random json temp
        int randomNum = (int) (Math.random() * 30) + 1; // Generates a random number between 1 and 3
        String fileName = "file_00" + randomNum;
        ContractDocument result = null;
        try {
            result = contractService.getcontracte(fileName);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).build();
        }
        return ResponseEntity.ok(result);
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