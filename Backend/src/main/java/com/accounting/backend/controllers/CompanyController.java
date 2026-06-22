package com.accounting.backend.controllers;

import java.time.LocalDateTime;
import java.util.Collections;
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
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.accounting.backend.dtos.CreateCompanyRequest;
import com.accounting.backend.entities.Company;
import com.accounting.backend.entities.Contract;
import com.accounting.backend.entities.User;
import com.accounting.backend.enums.CompanyStatus;
import com.accounting.backend.enums.CompanyType;
import com.accounting.backend.enums.ContractStatus;
import com.accounting.backend.enums.ContractType;
import com.accounting.backend.repositories.CompanyRepository;
import com.accounting.backend.repositories.ContractRepository;
import com.accounting.backend.repositories.UserRepository;
import com.accounting.backend.security.JwtService;


@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/api/companies")
public class CompanyController {

    @Autowired
    private CompanyRepository companyRepository;

    @Autowired
    private ContractController contractController;

    @Autowired
    private ContractRepository contractRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtService jwtService;

    @GetMapping
    public List<Company> getAllCompanies() {
        List<Company> companies = companyRepository.findAll();
        
        List<Contract> contracts = contractController.getAllContracts();
        for (Company company : companies) {
            company.setContracts(contracts.stream()
                .filter(contract -> contract.getCompany().getId().equals(company.getId()))
                .toList());
        }
        
        System.out.println("==================================");
        for(Company company : companies) {
            System.out.println(company);
        }
        System.out.println("==================================");
        return companies;
    }

    @GetMapping("/{id}")
    public Optional<Company> getCompanyById(@PathVariable Long id) {
        Company company = companyRepository.findById(id).orElseThrow();
        List<Contract> contracts = contractController.getAllContracts();
        company.setContracts(contracts.stream()
            .filter(contract -> contract.getCompany().getId().equals(company.getId()))
            .toList());

        System.out.println(company);
        return Optional.of(company);
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

    @PostMapping("/with-contract")
    public Company createCompanyWithContract(
            @RequestBody CreateCompanyRequest request,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {

        // Resolve the authenticated user from the JWT token
        User user = null;
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            try {
                String token = authHeader.substring(7);
                Long userId = jwtService.extractUserId(token);
                user = userRepository.findById(userId).orElse(null);
            } catch (Exception e) {
                // Token parsing failed — fall through to fallback
            }
        }
        // Development fallback: if no valid auth, use the first user in the database
        if (user == null) {
            user = userRepository.findAll().stream().findFirst().orElseThrow();
        }

        // Create and save the company
        Company company = new Company();
        company.setName(request.getCompany_name());
        company.setCompanyType(CompanyType.LLC);
        company.setCommercialRegNo(request.getCommercial_register_number());
        company.setStatus(CompanyStatus.ACTIVE);
        company.setCreatedAt(LocalDateTime.now());
        company.setUpdatedAt(LocalDateTime.now());
        Company savedCompany = companyRepository.save(company);

        // Create and save the establishment contract
        Contract contract = new Contract();
        contract.setType(ContractType.CREATING);
        contract.setCompany(savedCompany);
        contract.setCreatedBy(user);
        contract.setStatus(ContractStatus.DRAFT);
        contract.setCreatedAt(LocalDateTime.now());
        contract.setUpdatedAt(LocalDateTime.now());

        // Store the OCR request as JSON in ocrData
        try {
            StringBuilder json = new StringBuilder();
            json.append("{");
            json.append("\"company_name\":\"").append(escapeJson(request.getCompany_name())).append("\",");
            json.append("\"company_address\":\"").append(escapeJson(request.getCompany_address())).append("\",");
            json.append("\"company_type\":\"").append(escapeJson(request.getCompany_type())).append("\",");
            json.append("\"company_capital\":\"").append(escapeJson(request.getCompany_capital())).append("\",");
            json.append("\"commercial_register_number\":\"").append(escapeJson(request.getCommercial_register_number())).append("\",");
            json.append("\"approval_date\":\"").append(escapeJson(request.getApproval_date())).append("\",");
            json.append("\"company_duration\":\"").append(escapeJson(request.getCompany_duration())).append("\",");
            json.append("\"company_activity\":\"").append(escapeJson(request.getCompany_activity())).append("\"");
            json.append("}");
            contract.setOcrData(json.toString());
        } catch (Exception e) {
            contract.setOcrData(null);
        }

        contractRepository.save(contract);

        // Populate the transient contracts list on the company
        savedCompany.setContracts(Collections.singletonList(contract));

        return savedCompany;
    }

    private String escapeJson(String str) {
        if (str == null) return "";
        return str.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n").replace("\r", "\\r");
    }
}