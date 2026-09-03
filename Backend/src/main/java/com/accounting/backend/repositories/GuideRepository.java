package com.accounting.backend.repositories;

import com.accounting.backend.entities.Guide;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import org.springframework.data.jpa.repository.EntityGraph;

public interface GuideRepository extends JpaRepository<Guide, Long> {
    @EntityGraph(attributePaths = {"steps", "createdBy", "updatedBy"})
    List<Guide> findByStatusOrderByUpdatedAtDesc(String status);
    @EntityGraph(attributePaths = {"steps", "createdBy", "updatedBy"})
    List<Guide> findAllByOrderByUpdatedAtDesc();
    @EntityGraph(attributePaths = {"steps", "createdBy", "updatedBy"})
    java.util.Optional<Guide> findById(Long id);
}
