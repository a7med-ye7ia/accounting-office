package com.accounting.backend.controllers;

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

import com.accounting.backend.entities.ContractApproval;
import com.accounting.backend.repositories.ContractApprovalRepository;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/api/contract-approvals")
public class ContractApprovalController {

    @Autowired
    private ContractApprovalRepository contractApprovalRepository;

    @GetMapping
    public List<ContractApproval> getAllContractApprovals() {
        return contractApprovalRepository.findAll();
    }

    @GetMapping("/{id}")
    public Optional<ContractApproval> getContractApprovalById(@PathVariable Long id) {
        return contractApprovalRepository.findById(id);
    }

    @PostMapping
    public ContractApproval createContractApproval(@RequestBody ContractApproval contractApproval) {
        return contractApprovalRepository.save(contractApproval);
    }

    @PutMapping("/{id}")
    public ContractApproval updateContractApproval(@PathVariable Long id, @RequestBody ContractApproval contractApprovalDetails) {
        ContractApproval contractApproval = contractApprovalRepository.findById(id).orElseThrow();
        contractApproval.setContract(contractApprovalDetails.getContract());
        contractApproval.setApprovedBy(contractApprovalDetails.getApprovedBy());
        contractApproval.setStatus(contractApprovalDetails.getStatus());
        contractApproval.setComment(contractApprovalDetails.getComment());
        contractApproval.setApprovedAt(contractApprovalDetails.getApprovedAt());
        return contractApprovalRepository.save(contractApproval);
    }

    @DeleteMapping("/{id}")
    public void deleteContractApproval(@PathVariable Long id) {
        contractApprovalRepository.deleteById(id);
    }
}