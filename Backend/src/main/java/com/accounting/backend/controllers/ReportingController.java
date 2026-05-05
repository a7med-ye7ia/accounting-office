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

import com.accounting.backend.entities.Reporting;
import com.accounting.backend.repositories.ReportingRepository;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/api/reportings")
public class ReportingController {

    @Autowired
    private ReportingRepository reportingRepository;

    @GetMapping
    public List<Reporting> getAllReportings() {
        return reportingRepository.findAll();
    }

    @GetMapping("/{id}")
    public Optional<Reporting> getReportingById(@PathVariable Long id) {
        return reportingRepository.findById(id);
    }

    @PostMapping
    public Reporting createReporting(@RequestBody Reporting reporting) {
        return reportingRepository.save(reporting);
    }

    @PutMapping("/{id}")
    public Reporting updateReporting(@PathVariable Long id, @RequestBody Reporting reportingDetails) {
        Reporting reporting = reportingRepository.findById(id).orElseThrow();
        reporting.setEmployee(reportingDetails.getEmployee());
        reporting.setManager(reportingDetails.getManager());
        reporting.setStartDate(reportingDetails.getStartDate());
        reporting.setEndDate(reportingDetails.getEndDate());
        return reportingRepository.save(reporting);
    }

    @DeleteMapping("/{id}")
    public void deleteReporting(@PathVariable Long id) {
        reportingRepository.deleteById(id);
    }
}