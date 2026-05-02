package com.accounting.backend.repositories;

import com.accounting.backend.entities.PermissionRole;
import com.accounting.backend.entities.PermissionRoleId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PermissionRoleRepository extends JpaRepository<PermissionRole, PermissionRoleId> {
}