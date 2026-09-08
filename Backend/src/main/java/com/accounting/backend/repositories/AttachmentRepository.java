package com.accounting.backend.repositories;

import com.accounting.backend.entities.Attachment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AttachmentRepository extends JpaRepository<Attachment, Long> {
    List<Attachment> findByTask_IdOrderByCreatedAtDesc(Long taskId);
    long countByTask_Id(Long taskId);
    void deleteByTask_Id(Long taskId);
}
