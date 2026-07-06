package com.accounting.backend.controllers;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
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

import com.accounting.backend.entities.Contract;
import com.accounting.backend.enums.ActionType;
import com.accounting.backend.enums.EntityType;
import com.accounting.backend.repositories.ContractRepository;
import com.accounting.backend.security.JwtService;
import com.accounting.backend.services.ActivityLogService;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/api/contracts")
public class ContractController {

    @Autowired
    private ContractRepository contractRepository;
    @Autowired
    private JwtService jwtService;
    @Autowired
    private ActivityLogService activityLogService;

    @GetMapping
    public List<Contract> getAllContracts() {
        return contractRepository.findAll();
    }

    @GetMapping("/{id}")
    public Optional<Contract> getContractById(@PathVariable Long id) {
        return contractRepository.findById(id);
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

    private Long extractUserId(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) return null;
        try {
            return jwtService.extractUserId(authHeader.substring(7).trim());
        } catch (Exception e) {
            return null;
        }
    }
}
