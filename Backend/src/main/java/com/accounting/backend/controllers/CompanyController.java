package com.accounting.backend.controllers;

import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.accounting.backend.dtos.CreateCompanyRequest;
import com.accounting.backend.entities.Company;
import com.accounting.backend.entities.Contract;
import com.accounting.backend.entities.User;
import com.accounting.backend.enums.ActionType;
import com.accounting.backend.enums.CompanyStatus;
import com.accounting.backend.enums.ContractStatus;
import com.accounting.backend.enums.ContractType;
import com.accounting.backend.enums.EntityType;
import com.accounting.backend.repositories.CompanyRepository;
import com.accounting.backend.repositories.ContractRepository;
import com.accounting.backend.repositories.UserRepository;
import com.accounting.backend.security.JwtService;
import com.accounting.backend.services.ActivityLogService;
import com.accounting.backend.services.FileService;


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

    @Autowired
    private ActivityLogService activityLogService;
    @Autowired
    private FileService fileService;

    @GetMapping
    public List<Company> getAllCompanies() {
        List<Company> companies = companyRepository.findAll();

        List<Contract> contracts = contractController.getAllContracts();
        for (Company company : companies) {
            company.setContracts(contracts.stream()
                .filter(contract -> contract.getCompany().getId().equals(company.getId()))
                .toList());
        }

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
    public Company createCompany(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody Company company) {
        company.setCreatedAt(LocalDateTime.now());
        Company saved = companyRepository.save(company);
        Long callerId = extractUserId(authHeader);
        if (callerId != null) {
            Map<String, Object> meta = new HashMap<>();
            meta.put("companyName", saved.getName());
            activityLogService.logAction(callerId, null, EntityType.COMPANY, saved.getId(),
                ActionType.CREATE, "تم إنشاء شركة: " + saved.getName(), meta);
        }
        return saved;
    }

    @PutMapping("/{id}")
    public Company updateCompany(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long id,
            @RequestBody Company companyDetails) {
        Company company = companyRepository.findById(id).orElseThrow();
        company.setName(companyDetails.getName());
        company.setCompanyType(companyDetails.getCompanyType());
        company.setCommercialRegNo(companyDetails.getCommercialRegNo() + LocalDate.now().toString());
        company.setTaxId(companyDetails.getTaxId());
        company.setStatus(companyDetails.getStatus());
        company.setUpdatedAt(LocalDateTime.now());
        Company saved = companyRepository.save(company);
        Long callerId = extractUserId(authHeader);
        if (callerId != null) {
            Map<String, Object> meta = new HashMap<>();
            meta.put("companyName", saved.getName());
            activityLogService.logAction(callerId, null, EntityType.COMPANY, saved.getId(),
                ActionType.UPDATE, "تم تحديث الشركة: " + saved.getName(), meta);
        }
        return saved;
    }

    @DeleteMapping("/{id}")
    public void deleteCompany(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long id) {
        Company company = companyRepository.findById(id).orElse(null);
        if (company == null) return;
        String name = company.getName();
        companyRepository.deleteById(id);
        Long callerId = extractUserId(authHeader);
        if (callerId != null) {
            Map<String, Object> meta = new HashMap<>();
            meta.put("companyName", name);
            activityLogService.logAction(callerId, null, EntityType.COMPANY, id,
                ActionType.DELETE, "تم حذف الشركة: " + name, meta);
        }
    }

    @PostMapping(
        value = "/with-contract",
        consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public ResponseEntity<?> createCompanyWithContract(
            @RequestPart("company") CreateCompanyRequest request,
            @RequestPart("pdf") MultipartFile pdfFile,
            @RequestPart("ocrJson") String ocrJson,
            @RequestHeader("Authorization") String authHeader) {

        // Resolve the authenticated user from the JWT token
        User user = null;
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            try {
                String token = authHeader.substring(7);
                Long userId = jwtService.extractUserId(token);
                user = userRepository.findById(userId).orElse(null);
            } catch (Exception e) {
                // Token parsing failed - fall through to fallback
            }
        }
        // Development fallback: if no valid auth, use the first user in the database
        if (user == null) {
            return ResponseEntity.status(401).body("Unauthorized: Invalid or missing token");
        }

        // Create and save the company
        Company company = new Company();
        company.setName(request.getCompany_name());
        company.setCompanyType(request.getCompany_type());
        company.setCommercialRegNo(request.getCommercial_register_number() + LocalDate.now().toString());
        company.setStatus(CompanyStatus.ACTIVE);
        company.setCreatedAt(LocalDateTime.now());
        company.setUpdatedAt(LocalDateTime.now());
        Company savedCompany = companyRepository.save(company);

        String companyFolder = savedCompany.getId() + " - " + savedCompany.getName();
        // TODO: remove the opration from the database if folder creation fails
        try {

            fileService.createFolder(companyFolder);
            fileService.createFolder(companyFolder + "/CreationContract");
            fileService.createFolder(companyFolder + "/EditingContracts");
            fileService.createFolder(companyFolder + "/OtherTypesContracts");
            
            fileService.saveFile(companyFolder + "/CreationContract", pdfFile);
            fileService.saveJsonFile(companyFolder + "/CreationContract", "ocrData.json", ocrJson);
        } catch (IOException e) {
            // TODO Auto-generated catch block
            e.printStackTrace();
        }

        // Create and save the establishment contract
        Contract contract = new Contract();
        contract.setType(ContractType.CREATING);
        contract.setCompany(savedCompany);
        contract.setCreatedBy(user);
        contract.setStatus(ContractStatus.APPROVED);
        contract.setFilePath(companyFolder + "/CreationContract/" + pdfFile.getOriginalFilename());
        contract.setOcrData(ocrJson);
        contract.setCreatedAt(LocalDateTime.now());
        contract.setUpdatedAt(LocalDateTime.now());

        contractRepository.save(contract);

        savedCompany.setContracts(Collections.singletonList(contract));
        

        Map<String, Object> meta = new HashMap<>();
        meta.put("companyName", savedCompany.getName());
        activityLogService.logAction(
            user.getId(), null, EntityType.COMPANY, savedCompany.getId(),
            ActionType.CREATE, "تم إنشاء شركة بعقد: " + savedCompany.getName(), meta);

        return ResponseEntity.ok(savedCompany);
    }

    private String escapeJson(String str) {
        if (str == null) return "";
        return str.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n").replace("\r", "\\r");
    }

    private Long extractUserId(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) return null;
        try {
            return jwtService.extractUserId(authHeader.substring(7).trim());
        } catch (Exception e) {
            return null;
        }
    }
}


