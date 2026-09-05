package com.accounting.backend.repositories;

import com.accounting.backend.entities.Company;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CompanyRepository extends JpaRepository<Company, Long> {
    List<Company> findByDeletedAtIsNull();
    List<Company> findByDeletedAtIsNullAndBranch_Id(Long branchId);
    List<Company> findByDeletedAtIsNullAndDepartment_IdIn(List<Long> departmentIds);
}