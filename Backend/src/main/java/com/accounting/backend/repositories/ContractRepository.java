package com.accounting.backend.repositories;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.accounting.backend.entities.Contract;
import com.accounting.backend.enums.ContractStatus;
import com.accounting.backend.enums.ContractType;

@Repository
public interface ContractRepository extends JpaRepository<Contract, Long> {

    List<Contract> findByCreatedBy_Id(Long createdByUserId);
    List<Contract> findByCompany_IdAndType(
    Long companyId,
    ContractType type
);

    Optional<Contract> findFirstByTask_IdOrderByIdDesc(Long taskId);

    Optional<Contract> findFirstByCompany_IdAndTypeAndStatusOrderByIdDesc(
            Long companyId, ContractType type, ContractStatus status);

    Optional<Contract> findFirstByCompany_IdAndTypeOrderByIdDesc(
            Long companyId, ContractType type);
}
