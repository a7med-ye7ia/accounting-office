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

import com.accounting.backend.entities.Contract;
import com.accounting.backend.repositories.ContractRepository;

@RestController
@CrossOrigin(origins = "*")
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
        contract.setCreatedAt(LocalDateTime.now());
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
        contract.setUpdatedAt(LocalDateTime.now());
        return contractRepository.save(contract);
    }

    @DeleteMapping("/{id}")
    public void deleteContract(@PathVariable Long id) {
        // TODO : handle the delete logic (soft delete)
        contractRepository.deleteById(id);
    }
}