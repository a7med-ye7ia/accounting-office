package com.accounting.backend.controllers;

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

import com.accounting.backend.entities.ContractApproval;
import com.accounting.backend.enums.ActionType;
import com.accounting.backend.enums.EntityType;
import com.accounting.backend.repositories.ContractApprovalRepository;
import com.accounting.backend.security.JwtService;
import com.accounting.backend.services.ActivityLogService;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/api/contract-approvals")
public class ContractApprovalController {

    @Autowired
    private ContractApprovalRepository contractApprovalRepository;
    @Autowired
    private JwtService jwtService;
    @Autowired
    private ActivityLogService activityLogService;

    @GetMapping
    public List<ContractApproval> getAllContractApprovals() {
        return contractApprovalRepository.findAll();
    }

    @GetMapping("/{id}")
    public Optional<ContractApproval> getContractApprovalById(@PathVariable Long id) {
        return contractApprovalRepository.findById(id);
    }

    @PostMapping
    public ContractApproval createContractApproval(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody ContractApproval contractApproval) {
        ContractApproval saved = contractApprovalRepository.save(contractApproval);
        Long callerId = extractUserId(authHeader);
        if (callerId != null) {
            Map<String, Object> meta = new HashMap<>();
            if (saved.getContract() != null) meta.put("contractId", saved.getContract().getId());
            if (saved.getStatus() != null) meta.put("status", saved.getStatus().name());
            activityLogService.logAction(callerId, null, EntityType.CONTRACT_APPROVAL, saved.getId(),
                ActionType.CREATE, "تم إنشاء موافقة عقد", meta);
        }
        return saved;
    }

    @PutMapping("/{id}")
    public ContractApproval updateContractApproval(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long id,
            @RequestBody ContractApproval contractApprovalDetails) {
        ContractApproval contractApproval = contractApprovalRepository.findById(id).orElseThrow();
        contractApproval.setContract(contractApprovalDetails.getContract());
        contractApproval.setApprovedBy(contractApprovalDetails.getApprovedBy());
        contractApproval.setStatus(contractApprovalDetails.getStatus());
        contractApproval.setComment(contractApprovalDetails.getComment());
        contractApproval.setApprovedAt(contractApprovalDetails.getApprovedAt());
        ContractApproval saved = contractApprovalRepository.save(contractApproval);
        Long callerId = extractUserId(authHeader);
        if (callerId != null) {
            Map<String, Object> meta = new HashMap<>();
            if (saved.getStatus() != null) meta.put("status", saved.getStatus().name());
            activityLogService.logAction(callerId, null, EntityType.CONTRACT_APPROVAL, saved.getId(),
                ActionType.UPDATE, "تم تحديث موافقة العقد", meta);
        }
        return saved;
    }

    @DeleteMapping("/{id}")
    public void deleteContractApproval(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long id) {
        contractApprovalRepository.deleteById(id);
        Long callerId = extractUserId(authHeader);
        if (callerId != null) {
            Map<String, Object> meta = new HashMap<>();
            meta.put("approvalId", id);
            activityLogService.logAction(callerId, null, EntityType.CONTRACT_APPROVAL, id,
                ActionType.DELETE, "تم حذف موافقة العقد", meta);
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
