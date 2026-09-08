package com.accounting.backend.repositories;

import com.accounting.backend.entities.User;
import com.accounting.backend.entities.UserRole;
import com.accounting.backend.entities.UserRoleId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserRoleRepository extends JpaRepository<UserRole, UserRoleId> {
    List<UserRole> findByUser_Id(Long userId);
    void deleteByUser_Id(Long userId);

    @Query("SELECT DISTINCT ur.user FROM UserRole ur WHERE LOWER(ur.role.name) = LOWER(:roleName)")
    List<User> findUsersByRoleName(@Param("roleName") String roleName);
}