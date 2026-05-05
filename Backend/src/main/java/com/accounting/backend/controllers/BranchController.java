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

import com.accounting.backend.entities.Branch;
import com.accounting.backend.repositories.BranchRepository;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/api/branches")
public class BranchController {

    @Autowired
    private BranchRepository branchRepository;

    @GetMapping
    public List<Branch> getAllBranches() {
        return branchRepository.findAll();
    }

    @GetMapping("/{id}")
    public Optional<Branch> getBranchById(@PathVariable Long id) {
        return branchRepository.findById(id);
    }

    @PostMapping
    public Branch createBranch(@RequestBody Branch branch) {
        return branchRepository.save(branch);
    }

    @PutMapping("/{id}")
    public Branch updateBranch(@PathVariable Long id, @RequestBody Branch branchDetails) {
        Branch branch = branchRepository.findById(id).orElseThrow();
        branch.setName(branchDetails.getName());
        branch.setAddress(branchDetails.getAddress());
        branch.setPhone(branchDetails.getPhone());
        return branchRepository.save(branch);
    }

    @DeleteMapping("/{id}")
    public void deleteBranch(@PathVariable Long id) {
        branchRepository.deleteById(id);
    }
}