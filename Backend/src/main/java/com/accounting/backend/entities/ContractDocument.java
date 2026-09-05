package com.accounting.backend.entities;

import java.util.List;

public class ContractDocument {

    private String company_name;
    private String company_address;
    private String company_type;
    private LawReference law_reference;
    private String company_capital;
    private String commercial_register_number;
    private String approval_date;
    private String real_estate_registry_minutes_number;
    private String company_duration;
    private String company_activity;
    private List<Article> articles;

    public ContractDocument() {}

    public String getCompany_name() { return company_name; }
    public void setCompany_name(String company_name) { this.company_name = company_name; }

    public String getCompany_address() { return company_address; }
    public void setCompany_address(String company_address) { this.company_address = company_address; }

    public String getCompany_type() { return company_type; }
    public void setCompany_type(String company_type) { this.company_type = company_type; }

    public LawReference getLaw_reference() { return law_reference; }
    public void setLaw_reference(LawReference law_reference) { this.law_reference = law_reference; }

    public String getCompany_capital() { return company_capital; }
    public void setCompany_capital(String company_capital) { this.company_capital = company_capital; }

    public String getCommercial_register_number() { return commercial_register_number; }
    public void setCommercial_register_number(String v) { this.commercial_register_number = v; }

    public String getApproval_date() { return approval_date; }
    public void setApproval_date(String approval_date) { this.approval_date = approval_date; }

    public String getReal_estate_registry_minutes_number() { return real_estate_registry_minutes_number; }
    public void setReal_estate_registry_minutes_number(String v) { this.real_estate_registry_minutes_number = v; }

    public String getCompany_duration() { return company_duration; }
    public void setCompany_duration(String company_duration) { this.company_duration = company_duration; }

    public String getCompany_activity() { return company_activity; }
    public void setCompany_activity(String company_activity) { this.company_activity = company_activity; }

    public List<Article> getArticles() { return articles; }
    public void setArticles(List<Article> articles) { this.articles = articles; }

    // ── Inner classes ─────────────────────────────────────────────────────────

    public static class LawReference {
        private String law_number;
        private String law_year;

        public LawReference() {}

        public String getLaw_number() { return law_number; }
        public void setLaw_number(String law_number) { this.law_number = law_number; }

        public String getLaw_year() { return law_year; }
        public void setLaw_year(String law_year) { this.law_year = law_year; }
    }

    public static class Article {
        private String id;
        private String value;

        public Article() {}

        public String getId() { return id; }
        public void setId(String id) { this.id = id; }

        public String getValue() { return value; }
        public void setValue(String value) { this.value = value; }
    }
}