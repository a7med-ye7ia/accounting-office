package com.accounting.backend.dtos;

public class ArticleSearchResult {
    private String articleId;
    private String content;
    private double score;
    private Long companyId;

    public ArticleSearchResult(String articleId, String content, double score, Long companyId) {
        this.articleId = articleId;
        this.content = content;
        this.score = score;
        this.companyId = companyId;
    }

    public String getArticleId() {
        return articleId;
    }

    public void setArticleId(String articleId) {
        this.articleId = articleId;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public double getScore() {
        return score;
    }

    public void setScore(double score) {
        this.score = score;
    }

    public Long getCompanyId() {
        return companyId;
    }

    public void setCompanyId(Long companyId) {
        this.companyId = companyId;
    }
}
