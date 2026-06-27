package com.accounting.backend.entities;

import com.accounting.backend.enums.CompanyStatus;
import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "companies")
public class Company {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "company_name", nullable = false, columnDefinition = "TEXT")
    private String companyName;

    @Column(name = "company_address", columnDefinition = "TEXT")
    private String companyAddress;

    @Column(name = "company_type", nullable = false)
    private String companyType;

    @Column(name = "law_number")
    private String lawNumber;

    @Column(name = "law_year")
    private String lawYear;

    @Column(name = "company_capital", columnDefinition = "TEXT")
    private String companyCapital;

    @Column(name = "commercial_register_number")
    private String commercialRegisterNumber;

    @Column(name = "approval_date")
    private String approvalDate;

    @Column(name = "real_estate_registry_minutes_number", columnDefinition = "TEXT")
    private String realEstateRegistryMinutesNumber;

    @Column(name = "company_duration", columnDefinition = "TEXT")
    private String companyDuration;

    @Column(name = "company_activity", columnDefinition = "TEXT")
    private String companyActivity;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CompanyStatus status = CompanyStatus.ACTIVE;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @Transient
    private List<Contract> contracts;

    // ==========================
    // Getters & Setters
    // ==========================

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getCompanyName() {
        return companyName;
    }

    public void setCompanyName(String companyName) {
        this.companyName = companyName;
    }

    public String getCompanyAddress() {
        return companyAddress;
    }

    public void setCompanyAddress(String companyAddress) {
        this.companyAddress = companyAddress;
    }

    public String getCompanyType() {
        return companyType;
    }

    public void setCompanyType(String companyType) {
        this.companyType = companyType;
    }

    public String getLawNumber() {
        return lawNumber;
    }

    public void setLawNumber(String lawNumber) {
        this.lawNumber = lawNumber;
    }

    public String getLawYear() {
        return lawYear;
    }

    public void setLawYear(String lawYear) {
        this.lawYear = lawYear;
    }

    public String getCompanyCapital() {
        return companyCapital;
    }

    public void setCompanyCapital(String companyCapital) {
        this.companyCapital = companyCapital;
    }

    public String getCommercialRegisterNumber() {
        return commercialRegisterNumber;
    }

    public void setCommercialRegisterNumber(String commercialRegisterNumber) {
        this.commercialRegisterNumber = commercialRegisterNumber;
    }

    public String getApprovalDate() {
        return approvalDate;
    }

    public void setApprovalDate(String approvalDate) {
        this.approvalDate = approvalDate;
    }

    public String getRealEstateRegistryMinutesNumber() {
        return realEstateRegistryMinutesNumber;
    }

    public void setRealEstateRegistryMinutesNumber(String realEstateRegistryMinutesNumber) {
        this.realEstateRegistryMinutesNumber = realEstateRegistryMinutesNumber;
    }

    public String getCompanyDuration() {
        return companyDuration;
    }

    public void setCompanyDuration(String companyDuration) {
        this.companyDuration = companyDuration;
    }

    public String getCompanyActivity() {
        return companyActivity;
    }

    public void setCompanyActivity(String companyActivity) {
        this.companyActivity = companyActivity;
    }

    public CompanyStatus getStatus() {
        return status;
    }

    public void setStatus(CompanyStatus status) {
        this.status = status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public LocalDateTime getDeletedAt() {
        return deletedAt;
    }

    public void setDeletedAt(LocalDateTime deletedAt) {
        this.deletedAt = deletedAt;
    }

    public List<Contract> getContracts() {
        return contracts;
    }

    public void setContracts(List<Contract> contracts) {
        this.contracts = contracts;
    }

    @Override
    public String toString() {
        return "Company{" +
                "id=" + id +
                ", companyName='" + companyName + '\'' +
                ", companyAddress='" + companyAddress + '\'' +
                ", companyType='" + companyType + '\'' +
                ", lawNumber='" + lawNumber + '\'' +
                ", lawYear='" + lawYear + '\'' +
                ", companyCapital='" + companyCapital + '\'' +
                ", commercialRegisterNumber='" + commercialRegisterNumber + '\'' +
                ", approvalDate='" + approvalDate + '\'' +
                ", realEstateRegistryMinutesNumber='" + realEstateRegistryMinutesNumber + '\'' +
                ", companyDuration='" + companyDuration + '\'' +
                ", companyActivity='" + companyActivity + '\'' +
                ", status=" + status +
                '}';
    }
}