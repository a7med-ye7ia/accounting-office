package com.accounting.backend.controllers;

import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.fasterxml.jackson.databind.ObjectMapper;

import com.accounting.backend.entities.Company;
import com.accounting.backend.entities.Contract;
import com.accounting.backend.entities.User;
import com.accounting.backend.enums.ActionType;
import com.accounting.backend.enums.ContractStatus;
import com.accounting.backend.enums.ContractType;
import com.accounting.backend.enums.EntityType;
import com.accounting.backend.repositories.CompanyRepository;
import com.accounting.backend.repositories.ContractRepository;
import com.accounting.backend.repositories.TaskRepository;
import com.accounting.backend.repositories.UserRepository;
import com.accounting.backend.security.JwtService;
import com.accounting.backend.services.ActivityLogService;
import com.accounting.backend.services.FileService;
import com.accounting.backend.services.PdfService;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/api/contracts")
public class ContractController {

    @Autowired
    private ContractRepository contractRepository;
    @Autowired
    private CompanyRepository companyRepository;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private JwtService jwtService;
    @Autowired
    private ActivityLogService activityLogService;
    @Autowired
    private FileService fileService;
    @Autowired
    private PdfService pdfService;
    @Autowired
    private TaskRepository taskRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @GetMapping
    public List<Contract> getAllContracts() {
        return contractRepository.findAll();
    }

    @GetMapping("/{id}")
    public Optional<Contract> getContractById(@PathVariable Long id) {
        return contractRepository.findById(id);
    }

    @GetMapping("/creating/{companyId}")
    public ResponseEntity<Contract> getCreatingContractByCompanyId(@PathVariable Long companyId) {
        List<Contract> contracts = contractRepository.findByCompany_IdAndType(companyId, ContractType.CREATING);
        if (contracts.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(contracts.get(0));
    }

    @GetMapping("/updating/{companyId}")
    public ResponseEntity<List<Contract>> getUpdatingContractByCompanyId(@PathVariable Long companyId) {
        List<Contract> contracts = contractRepository.findByCompany_IdAndType(companyId, ContractType.UPDATING);
        if (contracts.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(contracts);
    }

    @PostMapping
    public Contract createContract(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody Contract contract) {
        contract.setCreatedAt(LocalDateTime.now());
        Contract saved = contractRepository.save(contract);
        Long callerId = extractUserId(authHeader);
        if (callerId != null) {
            Map<String, Object> meta = new HashMap<>();
            if (saved.getType() != null) meta.put("contractType", saved.getType().name());
            if (saved.getCompany() != null) meta.put("companyName", saved.getCompany().getName());
            activityLogService.logAction(callerId, null, EntityType.CONTRACT, saved.getId(),
                ActionType.CREATE, "تم إنشاء عقد", meta);
        }
        return saved;
    }

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> uploadContract(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestParam("companyId") Long companyId,
            @RequestParam("type") String type,
            @RequestParam("file") MultipartFile file) {

        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body("File is required");
        }

        ContractType contractType;
        try {
            contractType = parseContractType(type);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body("Invalid contract type");
        }

        Company company = companyRepository.findById(companyId).orElse(null);
        if (company == null) {
            return ResponseEntity.notFound().build();
        }

        User user = resolveUser(authHeader);
        if (user == null) {
            return ResponseEntity.status(401).body("Unauthorized: Invalid or missing token");
        }

        String companyFolder = company.getId() + " - " + company.getName();
        String contractFolder = switch (contractType) {
            case CREATING -> "CreationContract";
            case UPDATING -> "EditingContracts";
            case OTHER -> "OtherTypesContracts";
        };

        try {
            fileService.createFolder(companyFolder);
            fileService.createFolder(companyFolder + "/" + contractFolder);
            fileService.saveFile(companyFolder + "/" + contractFolder, file);
        } catch (IOException e) {
            return ResponseEntity.internalServerError().body("Upload failed");
        }

        Contract contract = new Contract();
        contract.setType(contractType);
        contract.setCompany(company);
        contract.setCreatedBy(user);
        contract.setStatus(ContractStatus.APPROVED);
        contract.setFilePath(companyFolder + "/" + contractFolder + "/" + file.getOriginalFilename());
        contract.setCreatedAt(LocalDateTime.now());
        contract.setUpdatedAt(LocalDateTime.now());

        Contract saved = contractRepository.save(contract);
        Map<String, Object> meta = new HashMap<>();
        meta.put("contractType", saved.getType().name());
        meta.put("companyName", company.getName());
        activityLogService.logAction(user.getId(), null, EntityType.CONTRACT, saved.getId(),
            ActionType.CREATE, "تم رفع عقد", meta);

        return ResponseEntity.ok(saved);
    }

    @PostMapping("/amendments/generate")
    public ResponseEntity<?> generateAndSaveAmendmentContract(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody GenerateAmendmentContractRequest request) {

        if (request == null || request.getCompanyId() == null || request.getPdf() == null) {
            return ResponseEntity.badRequest().body("companyId and pdf payload are required");
        }

        Company company = companyRepository.findById(request.getCompanyId()).orElse(null);
        if (company == null) {
            return ResponseEntity.notFound().build();
        }

        User user = resolveUser(authHeader);
        if (user == null) {
            return ResponseEntity.status(401).body("Unauthorized: Invalid or missing token");
        }

        try {
            PdfController.PdfRequest pdfRequest = request.getPdf();
            byte[] pdfBytes = pdfService.generateAmendmentPdf(
                pdfRequest.getContractTitle(),
                pdfRequest.getCompanyName(),
                pdfRequest.getCompanyLegalLine(),
                pdfRequest.getIntroText(),
                pdfRequest.getCompanyCapital(),
                pdfRequest.getContractDate(),
                pdfRequest.getPartners(),
                toPdfSections(pdfRequest.getSections())
            );

            String companyFolder = company.getId() + " - " + company.getName();
            String contractFolder = "EditingContracts";
            String fileName = safePdfFileName(request.getFileName());
            String relativeFolder = companyFolder + "/" + contractFolder;
            fileService.createFolder(companyFolder);
            fileService.createFolder(relativeFolder);
            fileService.saveBytes(relativeFolder, fileName, pdfBytes);

            Contract contract = new Contract();
            contract.setType(ContractType.UPDATING);
            contract.setCompany(company);
            contract.setCreatedBy(user);
            // Amendment stays pending until the manager approves it via task review
            contract.setStatus(ContractStatus.PENDING_APPROVAL);
            contract.setFilePath(relativeFolder + "/" + fileName);
            contract.setOcrData(objectMapper.writeValueAsString(pdfRequest));
            contract.setCreatedAt(LocalDateTime.now());
            contract.setUpdatedAt(LocalDateTime.now());
            if (request.getTaskId() != null) {
                taskRepository.findById(request.getTaskId()).ifPresent(contract::setTask);
            }

            Contract saved = contractRepository.save(contract);
            Map<String, Object> meta = new HashMap<>();
            meta.put("contractType", saved.getType().name());
            meta.put("companyName", company.getName());
            meta.put("filePath", saved.getFilePath());
            activityLogService.logAction(user.getId(), null, EntityType.CONTRACT, saved.getId(),
                ActionType.CREATE, "Generated amendment contract", meta);

            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Failed to generate amendment contract");
        }
    }
    @PutMapping("/{id}")
    public Contract updateContract(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long id,
            @RequestBody Contract contractDetails) {
        Contract contract = contractRepository.findById(id).orElseThrow();
        contract.setType(contractDetails.getType());
        contract.setCompany(contractDetails.getCompany());
        contract.setCreatedBy(contractDetails.getCreatedBy());
        contract.setFilePath(contractDetails.getFilePath());
        contract.setStatus(contractDetails.getStatus());
        contract.setUpdatedAt(LocalDateTime.now());
        Contract saved = contractRepository.save(contract);
        Long callerId = extractUserId(authHeader);
        if (callerId != null) {
            Map<String, Object> meta = new HashMap<>();
            if (saved.getType() != null) meta.put("contractType", saved.getType().name());
            if (saved.getCompany() != null) meta.put("companyName", saved.getCompany().getName());
            activityLogService.logAction(callerId, null, EntityType.CONTRACT, saved.getId(),
                ActionType.UPDATE, "تم تحديث العقد", meta);
        }
        return saved;
    }

    @DeleteMapping("/{id}")
    public void deleteContract(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long id) {
        Contract contract = contractRepository.findById(id).orElse(null);
        if (contract == null) return;
        contractRepository.deleteById(id);
        Long callerId = extractUserId(authHeader);
        if (callerId != null) {
            Map<String, Object> meta = new HashMap<>();
            if (contract.getCompany() != null) meta.put("companyName", contract.getCompany().getName());
            activityLogService.logAction(callerId, null, EntityType.CONTRACT, id,
                ActionType.DELETE, "تم حذف العقد", meta);
        }
    }

    private List<Map<String, Object>> toPdfSections(List<PdfController.PdfRequest.SectionRequest> sections) {
        List<Map<String, Object>> sectionsForService = new java.util.ArrayList<>();
        if (sections == null) return sectionsForService;

        for (PdfController.PdfRequest.SectionRequest s : sections) {
            Map<String, Object> m = new HashMap<>();
            m.put("id", s.getId());
            m.put("selectedArticleId", s.getSelectedArticleId());
            m.put("selectedArticleTitle", s.getSelectedArticleTitle());
            m.put("beforeText", s.getBeforeText());
            m.put("afterText", s.getAfterText());
            m.put("modelOutput", s.getModelOutput());
            m.put("amendmentTitle", s.getAmendmentTitle());
            m.put("embeddingScore", s.getEmbeddingScore());
            sectionsForService.add(m);
        }
        return sectionsForService;
    }

    private String safePdfFileName(String fileName) {
        String safe = fileName == null ? "" : fileName.replaceAll("[\\\\/]+", "_").trim();
        if (safe.isBlank()) {
            safe = "amendment_" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss")) + ".pdf";
        }
        if (!safe.toLowerCase().endsWith(".pdf")) {
            safe = safe + ".pdf";
        }
        return safe;
    }
    private Long extractUserId(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) return null;
        try {
            return jwtService.extractUserId(authHeader.substring(7).trim());
        } catch (Exception e) {
            return null;
        }
    }

    private User resolveUser(String authHeader) {
        Long userId = extractUserId(authHeader);
        if (userId == null) return null;
        return userRepository.findById(userId).orElse(null);
    }

    public static class GenerateAmendmentContractRequest {
        private Long companyId;
        private Long taskId;
        private String fileName;
        private PdfController.PdfRequest pdf;

        public Long getCompanyId() { return companyId; }
        public void setCompanyId(Long companyId) { this.companyId = companyId; }

        public Long getTaskId() { return taskId; }
        public void setTaskId(Long taskId) { this.taskId = taskId; }

        public String getFileName() { return fileName; }
        public void setFileName(String fileName) { this.fileName = fileName; }

        public PdfController.PdfRequest getPdf() { return pdf; }
        public void setPdf(PdfController.PdfRequest pdf) { this.pdf = pdf; }
    }
    private ContractType parseContractType(String type) {
        String normalized = type == null ? "" : type.trim().toUpperCase();
        return switch (normalized) {
            case "ESTABLISHMENT", "CREATING" -> ContractType.CREATING;
            case "AMENDMENT", "UPDATING" -> ContractType.UPDATING;
            case "OTHER" -> ContractType.OTHER;
            default -> ContractType.valueOf(normalized);
        };
    }
}
