package com.accounting.backend.controllers;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.accounting.backend.entities.Company;
import com.accounting.backend.repositories.CompanyRepository;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/api/companies")
public class CompanyController {

    @Autowired
    private CompanyRepository companyRepository;

    @GetMapping
    public List<Company> getAllCompanies() {
        return companyRepository.findAll();
    }

    @GetMapping("/{id}")
    public Optional<Company> getCompanyById(@PathVariable Long id) {
        return companyRepository.findById(id);
    }

    @PostMapping
    public Company createCompany(@RequestBody Company company) {
        company.setCreatedAt(LocalDateTime.now());
        return companyRepository.save(company);
    }

    @PutMapping("/{id}")
    public Company updateCompany(@PathVariable Long id, @RequestBody Company companyDetails) {
        Company company = companyRepository.findById(id).orElseThrow();
        company.setName(companyDetails.getName());
        company.setCompanyType(companyDetails.getCompanyType());
        company.setCommercialRegNo(companyDetails.getCommercialRegNo());
        company.setTaxId(companyDetails.getTaxId());
        company.setStatus(companyDetails.getStatus());
        company.setUpdatedAt(LocalDateTime.now());
        return companyRepository.save(company);
    }

    @DeleteMapping("/{id}")
    public void deleteCompany(@PathVariable Long id) {
        // TODO : handle the delete logic (soft delete)
        companyRepository.deleteById(id);
    }
}