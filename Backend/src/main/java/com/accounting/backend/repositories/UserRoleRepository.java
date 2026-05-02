package com.accounting.backend.repositories;

import com.accounting.backend.entities.UserRole;
import com.accounting.backend.entities.UserRoleId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserRoleRepository extends JpaRepository<UserRole, UserRoleId> {
}