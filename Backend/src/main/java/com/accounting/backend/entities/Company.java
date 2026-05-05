package com.accounting.backend.entities;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import com.accounting.backend.enums.CompanyType;
import com.accounting.backend.enums.CompanyStatus;

@Entity
@Table(name = "companies")
public class Company {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(name = "company_type", nullable = false)
    private CompanyType companyType;

    @Column(name = "commercial_reg_no", unique = true)
    private String commercialRegNo;

    @Column(name = "tax_id", unique = true)
    private String taxId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CompanyStatus status = CompanyStatus.ACTIVE;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    // @OneToMany(mappedBy = "company", cascade = CascadeType.ALL, orphanRemoval = true)
    // private List<Contract> contracts = new ArrayList<>();

    @Transient
    private List<Contract> contracts;

    // Getters and setters

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public CompanyType getCompanyType() { return companyType; }
    public void setCompanyType(CompanyType companyType) { this.companyType = companyType; }

    public String getCommercialRegNo() { return commercialRegNo; }
    public void setCommercialRegNo(String commercialRegNo) { this.commercialRegNo = commercialRegNo; }

    public String getTaxId() { return taxId; }
    public void setTaxId(String taxId) { this.taxId = taxId; }

    public CompanyStatus getStatus() { return status; }
    public void setStatus(CompanyStatus status) { this.status = status; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public LocalDateTime getDeletedAt() { return deletedAt; }
    public void setDeletedAt(LocalDateTime deletedAt) { this.deletedAt = deletedAt; }

    public List<Contract> getContracts() { return contracts; }
    public void setContracts(List<Contract> contracts) { this.contracts = contracts; }
    @Override
    public String toString() {
        return "Company [id=" + id + ", name=" + name + ", companyType=" + companyType + ", commercialRegNo="
                + commercialRegNo + ", taxId=" + taxId + ", status=" + status + ", createdAt=" + createdAt
                + ", updatedAt=" + updatedAt + ", deletedAt=" + deletedAt + ", contracts=" + contracts + "]";
    }

    
}