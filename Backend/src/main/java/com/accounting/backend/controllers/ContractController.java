package com.accounting.backend.controllers;

import com.accounting.backend.entities.Contract;
import com.accounting.backend.repositories.ContractRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@CrossOrigin(origins = "http://localhost:5173")
@RequestMapping("/api/contracts")
public class ContractController {

    @Autowired
    private ContractRepository contractRepository;

    @GetMapping
    public List<Contract> getAllContracts() {
        return contractRepository.findAll();
    }

    @GetMapping("/{id}")
    public Optional<Contract> getContractById(@PathVariable Long id) {
        return contractRepository.findById(id);
    }

    @PostMapping
    public Contract createContract(@RequestBody Contract contract) {
        return contractRepository.save(contract);
    }

    @PutMapping("/{id}")
    public Contract updateContract(@PathVariable Long id, @RequestBody Contract contractDetails) {
        Contract contract = contractRepository.findById(id).orElseThrow();
        contract.setType(contractDetails.getType());
        contract.setCompany(contractDetails.getCompany());
        contract.setCreatedBy(contractDetails.getCreatedBy());
        contract.setFilePath(contractDetails.getFilePath());
        contract.setStatus(contractDetails.getStatus());
        contract.setCreatedAt(contractDetails.getCreatedAt());
        contract.setUpdatedAt(contractDetails.getUpdatedAt());
        contract.setDeletedAt(contractDetails.getDeletedAt());
        return contractRepository.save(contract);
    }

    @DeleteMapping("/{id}")
    public void deleteContract(@PathVariable Long id) {
        contractRepository.deleteById(id);
    }
}