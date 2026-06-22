package com.accounting.backend.controllers;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/api/ocr")
public class OcrController {

    @PostMapping("/extract")
    public ResponseEntity<Map<String, Object>> extractOcrData(@RequestParam("file") MultipartFile file) {
        Map<String, Object> result = new HashMap<>();

        result.put("company_name", "\u0634\u0631\u0643\u0629 \u0627\u0644\u0646\u0648\u0631 \u0644\u0644\u062a\u062c\u0627\u0631\u0629 \u0648\u0627\u0644\u0627\u0633\u062a\u064a\u0631\u0627\u062f");
        result.put("company_address", "\u0627\u0644\u0642\u0627\u0647\u0631\u0629 - \u0634\u0627\u0631\u0639 \u0627\u0644\u062a\u062d\u0631\u064a\u0631 - \u0639\u0645\u0627\u0631\u0629 15 - \u0627\u0644\u062f\u0648\u0631 \u0627\u0644\u062b\u0627\u0644\u062b");
        result.put("company_type", "\u0634\u0631\u0643\u0629 \u0630\u0627\u062a \u0645\u0633\u0624\u0648\u0644\u064a\u0629 \u0645\u062d\u062f\u0648\u062f\u0629");

        Map<String, String> lawReference = new HashMap<>();
        lawReference.put("law_number", "159");
        lawReference.put("law_year", "1981");
        result.put("law_reference", lawReference);

        result.put("company_capital", "500,000 \u062c\u0646\u064a\u0647 \u0645\u0635\u0631\u064a");
        result.put("commercial_register_number", "12345");
        result.put("approval_date", "2024-01-15");
        result.put("company_duration", "25 \u0633\u0646\u0629");
        result.put("company_activity", "\u0627\u0633\u062a\u064a\u0631\u0627\u062f \u0648\u062a\u0635\u062f\u064a\u0631 \u0627\u0644\u0645\u0648\u0627\u062f \u0627\u0644\u063a\u0630\u0627\u0626\u064a\u0629 \u0648\u0627\u0644\u062a\u062c\u0627\u0631\u0629 \u0627\u0644\u0639\u0627\u0645\u0629");

        List<Map<String, String>> articles = new ArrayList<>();

        Map<String, String> article1 = new HashMap<>();
        article1.put("id", "1");
        article1.put("value", "\u062a\u0623\u0633\u0633\u062a \u0634\u0631\u0643\u0629 \u0630\u0627\u062a \u0645\u0633\u0624\u0648\u0644\u064a\u0629 \u0645\u062d\u062f\u0648\u062f\u0629 \u0637\u0628\u0642\u0627\u064b \u0644\u0623\u062d\u0643\u0627\u0645 \u0627\u0644\u0642\u0627\u0646\u0648\u0646 \u0631\u0642\u0645 159 \u0644\u0633\u0646\u0629 1981 \u0648\u0644\u0627\u0626\u062d\u062a\u0647 \u0627\u0644\u062a\u0646\u0641\u064a\u0630\u064a\u0629 \u0648\u0627\u0644\u062a\u0639\u062f\u064a\u0644\u0627\u062a \u0627\u0644\u0644\u0627\u062d\u0642\u0629");
        articles.add(article1);

        Map<String, String> article2 = new HashMap<>();
        article2.put("id", "2");
        article2.put("value", "\u0631\u0623\u0633 \u0645\u0627\u0644 \u0627\u0644\u0634\u0631\u0643\u0629 \u062e\u0645\u0633\u0645\u0627\u0626\u0629 \u0623\u0644\u0641 \u062c\u0646\u064a\u0647 \u0645\u0635\u0631\u064a \u0645\u0642\u0633\u0645 \u0625\u0644\u0649 \u062d\u0635\u0635 \u0645\u062a\u0633\u0627\u0648\u064a\u0629 \u0627\u0644\u0642\u064a\u0645\u0629 \u0648\u0642\u062f \u062a\u0645 \u0633\u062f\u0627\u062f \u0643\u0627\u0645\u0644 \u0631\u0623\u0633 \u0627\u0644\u0645\u0627\u0644 \u0639\u0646\u062f \u0627\u0644\u062a\u0623\u0633\u064a\u0633");
        articles.add(article2);

        Map<String, String> article3 = new HashMap<>();
        article3.put("id", "3");
        article3.put("value", "\u0645\u062f\u0629 \u0627\u0644\u0634\u0631\u0643\u0629 \u062e\u0645\u0633 \u0648\u0639\u0634\u0631\u0648\u0646 \u0633\u0646\u0629 \u0645\u064a\u0644\u0627\u062f\u064a\u0629 \u062a\u0628\u062f\u0623 \u0645\u0646 \u062a\u0627\u0631\u064a\u062e \u0642\u064a\u062f\u0647\u0627 \u0641\u064a \u0627\u0644\u0633\u062c\u0644 \u0627\u0644\u062a\u062c\u0627\u0631\u064a \u0648\u064a\u062c\u0648\u0632 \u0645\u062f\u0647\u0627 \u0628\u0642\u0631\u0627\u0631 \u0645\u0646 \u0627\u0644\u062c\u0645\u0639\u064a\u0629 \u0627\u0644\u0639\u0627\u0645\u0629 \u063a\u064a\u0631 \u0627\u0644\u0639\u0627\u062f\u064a\u0629");
        articles.add(article3);

        result.put("articles", articles);

        return ResponseEntity.ok(result);
    }
}
