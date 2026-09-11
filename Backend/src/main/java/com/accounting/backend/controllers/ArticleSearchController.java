package com.accounting.backend.controllers;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.accounting.backend.dtos.ArticleSearchResult;
import com.accounting.backend.services.ArticleSearchService;

@RestController
@RequestMapping("/api/articles")
@CrossOrigin(origins = "*")
public class ArticleSearchController {

    @Autowired
    private ArticleSearchService articleSearchService;

    /**
     * Search articles by semantic similarity.
     *
     * Request body:
     * {
     *   "companyId": 123,
     *   "query": "تصميم البرمجيات",
     *   "topK": 5
     * }
     *
     * Response: List of articles ranked by similarity score
     */
    @PostMapping("/search")
    public ResponseEntity<?> searchArticles(@RequestBody Map<String, Object> body) {
        try {
            Long companyId = Long.parseLong(body.get("companyId").toString());
            String query = (String) body.get("query");
            int topK = body.containsKey("topK") ? Integer.parseInt(body.get("topK").toString()) : 5;

            List<ArticleSearchResult> results = articleSearchService.searchArticles(companyId, query, topK);
            return ResponseEntity.ok(results);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }
}
