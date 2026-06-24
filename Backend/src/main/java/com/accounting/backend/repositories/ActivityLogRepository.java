package com.accounting.backend.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import com.accounting.backend.entities.ActivityLog;

@Repository
public interface ActivityLogRepository extends JpaRepository<ActivityLog, Long> {
    @Query("SELECT a FROM ActivityLog a ORDER BY a.createdAt DESC")
    List<ActivityLog> findAllByOrderByCreatedAtDesc();
    List<ActivityLog> findByCompanyIdOrderByCreatedAtDesc(Long companyId);
    List<ActivityLog> findByUserIdOrderByCreatedAtDesc(Long userId);
}