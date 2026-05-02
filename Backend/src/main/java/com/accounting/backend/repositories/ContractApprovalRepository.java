package com.accounting.backend.repositories;

import com.accounting.backend.entities.ContractApproval;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ContractApprovalRepository extends JpaRepository<ContractApproval, Long> {
}