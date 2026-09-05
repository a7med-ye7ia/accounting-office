package com.accounting.backend.repositories;

import com.accounting.backend.entities.DepartmentManagerDepartment;
import com.accounting.backend.entities.DepartmentManagerDepartmentId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DepartmentManagerDepartmentRepository extends JpaRepository<DepartmentManagerDepartment, DepartmentManagerDepartmentId> {

    List<DepartmentManagerDepartment> findById_ManagerId(Long managerId);

    List<DepartmentManagerDepartment> findById_DepartmentId(Long departmentId);

    void deleteById_ManagerId(Long managerId);

    boolean existsById_ManagerIdAndId_DepartmentId(Long managerId, Long departmentId);
}
