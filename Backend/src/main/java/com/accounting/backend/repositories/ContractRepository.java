package com.accounting.backend.repositories;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.accounting.backend.entities.Contract;

@Repository
public interface ContractRepository extends JpaRepository<Contract, Long> {

    List<Contract> findByCreatedBy_Id(Long createdByUserId);
}