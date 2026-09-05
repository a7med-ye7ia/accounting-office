package com.accounting.backend.controllers;

import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
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
import org.springframework.web.server.ResponseStatusException;

import com.accounting.backend.dtos.CreateCompanyRequest;
import com.accounting.backend.entities.Branch;
import com.accounting.backend.entities.Company;
import com.accounting.backend.entities.Contract;
import com.accounting.backend.entities.Department;
import com.accounting.backend.entities.User;
import com.accounting.backend.enums.ActionType;
import com.accounting.backend.enums.CompanyStatus;
import com.accounting.backend.enums.ContractStatus;
import com.accounting.backend.enums.ContractType;
import com.accounting.backend.enums.EntityType;
import com.accounting.backend.enums.SystemRole;
import com.accounting.backend.repositories.BranchRepository;
import com.accounting.backend.repositories.CompanyRepository;
import com.accounting.backend.repositories.ContractRepository;
import com.accounting.backend.repositories.DepartmentRepository;
import com.accounting.backend.repositories.UserRepository;
import com.accounting.backend.services.ActivityLogService;
import com.accounting.backend.services.AuthorizationService;
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
    private BranchRepository branchRepository;

    @Autowired
    private DepartmentRepository departmentRepository;

    @Autowired
    private AuthorizationService authorizationService;

    @Autowired
    private ActivityLogService activityLogService;

    @Autowired
    private FileService fileService;

    @GetMapping
    public ResponseEntity<List<Company>> getAllCompanies(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        User caller = authorizationService.requireAuthenticatedUser(authHeader);
        Long callerId = caller.getId();
        SystemRole role = authorizationService.getUserRole(callerId);

        List<Company> companies;
        if (role == SystemRole.OWNER) {
            companies = companyRepository.findByDeletedAtIsNull();
        } else if (role == SystemRole.BRANCH_MANAGER || role == SystemRole.EMPLOYEE) {
            Long callerBranch = authorizationService.getUserBranchId(callerId);
            if (callerBranch != null) {
                companies = companyRepository.findByDeletedAtIsNullAndBranch_Id(callerBranch);
                // Also include legacy companies without branch assignment
                List<Company> unassigned = companyRepository.findByDeletedAtIsNull().stream()
                        .filter(c -> c.getBranch() == null)
                        .toList();
                List<Company> combined = new ArrayList<>(companies);
                combined.addAll(unassigned);
                companies = combined;
            } else {
                companies = List.of();
            }
        } else if (role == SystemRole.DEPARTMENT_MANAGER) {
            List<Long> managedDepts = authorizationService.getManagedDepartmentIds(callerId);
            if (!managedDepts.isEmpty()) {
                companies = companyRepository.findByDeletedAtIsNullAndDepartment_IdIn(managedDepts);
            } else {
                companies = List.of();
            }
        } else {
            companies = List.of();
        }

        List<Contract> contracts = contractController.getAllContracts();
        for (Company company : companies) {
            company.setContracts(contracts.stream()
                .filter(contract -> contract.getCompany() != null && contract.getCompany().getId().equals(company.getId()))
                .toList());
        }

        return ResponseEntity.ok(companies);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getCompanyById(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long id) {
        User caller = authorizationService.requireAuthenticatedUser(authHeader);
        Company company = companyRepository.findById(id).orElse(null);
        if (company == null || company.getDeletedAt() != null) {
            return ResponseEntity.notFound().build();
        }

        if (!authorizationService.canViewCompany(caller.getId(), company)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "غير مصرح لك بعرض بيانات هذه الشركة"));
        }

        List<Contract> contracts = contractController.getAllContracts();
        company.setContracts(contracts.stream()
            .filter(contract -> contract.getCompany() != null && contract.getCompany().getId().equals(company.getId()))
            .toList());

        return ResponseEntity.ok(company);
    }

    @PostMapping
    public ResponseEntity<?> createCompany(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody Company company) {
        User caller = authorizationService.requireAuthenticatedUser(authHeader);
        Long callerId = caller.getId();

        if (company.getBranch() == null || company.getBranch().getId() == null ||
            company.getDepartment() == null || company.getDepartment().getId() == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "الفرع والقسم حقول مطلوبة لإنشاء الشركة"));
        }

        Long branchId = company.getBranch().getId();
        Long deptId = company.getDepartment().getId();

        // Validate organizational consistency
        try {
            authorizationService.validateBranchDepartmentConsistency(branchId, deptId);
        } catch (ResponseStatusException rse) {
            return ResponseEntity.status(rse.getStatusCode()).body(Map.of("error", rse.getReason()));
        }

        // Scope check
        if (!authorizationService.canCreateCompany(callerId, branchId, deptId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "غير مصرح لك بإنشاء شركة في هذا النطاق"));
        }

        Branch branch = branchRepository.findById(branchId).orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND, "الفرع غير موجود"));
        Department dept = departmentRepository.findById(deptId).orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND, "القسم غير موجود"));

        company.setBranch(branch);
        company.setDepartment(dept);
        company.setCreatedAt(LocalDateTime.now());
        company.setUpdatedAt(LocalDateTime.now());
        if (company.getStatus() == null) {
            company.setStatus(CompanyStatus.ACTIVE);
        }

        Company saved = companyRepository.save(company);

        Map<String, Object> meta = new HashMap<>();
        meta.put("companyName", saved.getName());
        meta.put("branch", branch.getName());
        meta.put("department", dept.getName());
        activityLogService.logAction(callerId, null, EntityType.COMPANY, saved.getId(),
            ActionType.CREATE, "تم إنشاء شركة: " + saved.getName(), meta);

        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateCompany(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long id,
            @RequestBody Company companyDetails) {
        User caller = authorizationService.requireAuthenticatedUser(authHeader);
        Long callerId = caller.getId();

        Company company = companyRepository.findById(id).orElse(null);
        if (company == null || company.getDeletedAt() != null) {
            return ResponseEntity.notFound().build();
        }

        if (!authorizationService.canManageCompany(callerId, company)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "غير مصرح لك بتعديل بيانات هذه الشركة"));
        }

        // Branch immutability check
        if (companyDetails.getBranch() != null && companyDetails.getBranch().getId() != null) {
            if (company.getBranch() != null && !company.getBranch().getId().equals(companyDetails.getBranch().getId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "لا يمكن تغيير فرع الشركة بعد إنشائها"));
            }
        }

        // Department check
        if (companyDetails.getDepartment() != null && companyDetails.getDepartment().getId() != null) {
            Long currentBranchId = company.getBranch() != null ? company.getBranch().getId() :
                    (companyDetails.getBranch() != null ? companyDetails.getBranch().getId() : null);
            Long newDeptId = companyDetails.getDepartment().getId();

            if (currentBranchId != null) {
                try {
                    authorizationService.validateBranchDepartmentConsistency(currentBranchId, newDeptId);
                } catch (ResponseStatusException rse) {
                    return ResponseEntity.status(rse.getStatusCode()).body(Map.of("error", rse.getReason()));
                }
            }

            // If Department Manager, new department must be in managed departments
            if (authorizationService.isDepartmentManager(callerId)) {
                if (!authorizationService.getManagedDepartmentIds(callerId).contains(newDeptId)) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN)
                            .body(Map.of("error", "لا يمكن لمدير القسم تعيين قسم خارج نطاق إدارته"));
                }
            }

            Department dept = departmentRepository.findById(newDeptId).orElseThrow(() ->
                    new ResponseStatusException(HttpStatus.NOT_FOUND, "القسم غير موجود"));
            company.setDepartment(dept);
        }

        if (companyDetails.getName() != null && !companyDetails.getName().isBlank()) {
            company.setName(companyDetails.getName().trim());
        }
        if (companyDetails.getCompanyType() != null) {
            company.setCompanyType(companyDetails.getCompanyType());
        }
        if (companyDetails.getCommercialRegNo() != null) {
            company.setCommercialRegNo(companyDetails.getCommercialRegNo());
        }
        if (companyDetails.getTaxId() != null) {
            company.setTaxId(companyDetails.getTaxId());
        }
        if (companyDetails.getStatus() != null) {
            company.setStatus(companyDetails.getStatus());
        }
        company.setUpdatedAt(LocalDateTime.now());

        Company saved = companyRepository.save(company);

        Map<String, Object> meta = new HashMap<>();
        meta.put("companyName", saved.getName());
        activityLogService.logAction(callerId, null, EntityType.COMPANY, saved.getId(),
            ActionType.UPDATE, "تم تحديث الشركة: " + saved.getName(), meta);

        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteCompany(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long id) {
        User caller = authorizationService.requireAuthenticatedUser(authHeader);
        Long callerId = caller.getId();

        Company company = companyRepository.findById(id).orElse(null);
        if (company == null || company.getDeletedAt() != null) {
            return ResponseEntity.notFound().build();
        }

        if (!authorizationService.canManageCompany(callerId, company)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "غير مصرح لك بحذف هذه الشركة"));
        }

        String name = company.getName();
        // Safe soft-delete to preserve FK integrity with contracts and tasks
        company.setDeletedAt(LocalDateTime.now());
        companyRepository.save(company);

        Map<String, Object> meta = new HashMap<>();
        meta.put("companyName", name);
        activityLogService.logAction(callerId, null, EntityType.COMPANY, id,
            ActionType.DELETE, "تم حذف الشركة: " + name, meta);

        return ResponseEntity.ok().build();
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

        User user = authorizationService.requireAuthenticatedUser(authHeader);
        Long callerId = user.getId();

        Long branchId = request.getBranch_id();
        Long deptId = request.getDepartment_id();

        // Fallback to caller's primary branch & dept if not explicitly provided in multipart form
        if (branchId == null) {
            branchId = authorizationService.getUserBranchId(callerId);
        }
        if (deptId == null) {
            deptId = authorizationService.getUserDepartmentId(callerId);
        }

        if (branchId != null && deptId != null) {
            authorizationService.validateBranchDepartmentConsistency(branchId, deptId);
        }

        if (branchId != null && deptId != null && !authorizationService.canCreateCompany(callerId, branchId, deptId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "غير مصرح لك بإنشاء شركة في هذا النطاق"));
        }

        // Create and save the company
        Company company = new Company();
        company.setName(request.getCompany_name());
        company.setCompanyType(request.getCompany_type());
        company.setCommercialRegNo(request.getCommercial_register_number());
        company.setStatus(CompanyStatus.ACTIVE);
        company.setCreatedAt(LocalDateTime.now());
        company.setUpdatedAt(LocalDateTime.now());

        if (branchId != null) {
            branchRepository.findById(branchId).ifPresent(company::setBranch);
        }
        if (deptId != null) {
            departmentRepository.findById(deptId).ifPresent(company::setDepartment);
        }

        Company savedCompany = companyRepository.save(company);

        String companyFolder = savedCompany.getId() + " - " + savedCompany.getName();
        try {
            fileService.createFolder(companyFolder);
            fileService.createFolder(companyFolder + "/CreationContract");
            fileService.createFolder(companyFolder + "/EditingContracts");
            fileService.createFolder(companyFolder + "/OtherTypesContracts");
            fileService.saveFile(companyFolder + "/CreationContract", pdfFile);
            fileService.saveJsonFile(companyFolder + "/CreationContract", "ocrData.json", ocrJson);
        } catch (IOException e) {
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
}
