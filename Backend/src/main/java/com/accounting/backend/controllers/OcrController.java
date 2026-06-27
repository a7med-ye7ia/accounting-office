package com.accounting.backend.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.accounting.backend.entities.ContractDocument;
import com.accounting.backend.services.ContracteService;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/api/ocr")
public class OcrController {

    @Autowired
    private ContracteService contracteService;

    @PostMapping("/extract")
    public ResponseEntity<ContractDocument> extractOcrData(@RequestParam("file") MultipartFile file) {
        
        // get random json temp
        int randomNum = (int) (Math.random() * 6) + 1; // Generates a random number between 1 and 3
        String fileName = "file_00" + randomNum;
        ContractDocument result = null;
        try {
            result = contracteService.getcontracte(fileName);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).build();
        }
        return ResponseEntity.ok(result);
    }
}
