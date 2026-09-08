package com.accounting.backend.repositories;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.accounting.backend.entities.Contract;
import com.accounting.backend.enums.ContractType;

@Repository
public interface ContractRepository extends JpaRepository<Contract, Long> {

    List<Contract> findByCreatedBy_Id(Long createdByUserId);
    List<Contract> findByCompany_IdAndType(
    Long companyId,
    ContractType type
);
}