package com.accounting.backend.services;

import com.accounting.backend.dtos.GuideRequest;
import com.accounting.backend.dtos.GuideStepRequest;
import com.accounting.backend.dtos.GuideResponse;
import com.accounting.backend.entities.Guide;
import com.accounting.backend.entities.GuideStep;
import com.accounting.backend.entities.User;
import com.accounting.backend.enums.ActionType;
import com.accounting.backend.enums.EntityType;
import com.accounting.backend.repositories.GuideRepository;
import com.accounting.backend.repositories.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;

@Service
public class GuideService {
    private final GuideRepository guideRepository;
    private final UserRepository userRepository;
    private final ActivityLogService activityLogService;

    public GuideService(GuideRepository guideRepository, UserRepository userRepository,
                        ActivityLogService activityLogService) {
        this.guideRepository = guideRepository;
        this.userRepository = userRepository;
        this.activityLogService = activityLogService;
    }

    @Transactional(readOnly = true)
    public List<GuideResponse> listPublished() {
        return guideRepository.findByStatusOrderByUpdatedAtDesc("published").stream()
                .map(GuideResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public Optional<GuideResponse> getPublished(Long id) {
        return guideRepository.findById(id)
                .filter(guide -> "published".equalsIgnoreCase(guide.getStatus()))
                .map(GuideResponse::from);
    }

    @Transactional(readOnly = true)
    public List<GuideResponse> listAll() {
        return guideRepository.findAllByOrderByUpdatedAtDesc().stream()
                .map(GuideResponse::from).toList();
    }

    @Transactional
    public GuideResponse create(GuideRequest request, Long userId) {
        User user = userRepository.findById(userId).orElseThrow(() -> new IllegalArgumentException("المستخدم غير موجود."));
        Guide guide = new Guide();
        guide.setCreatedBy(user);
        apply(guide, request, user);
        Guide saved = guideRepository.save(guide);
        GuideResponse response = GuideResponse.from(saved);
        activityLogService.logAction(userId, null, EntityType.GUIDE, saved.getId(), ActionType.CREATE,
                "تم إنشاء دليل: " + saved.getTitle(), Map.of("title", saved.getTitle(), "status", saved.getStatus()));
        return response;
    }

    @Transactional
    public Optional<GuideResponse> update(Long id, GuideRequest request, Long userId) {
        User user = userRepository.findById(userId).orElseThrow(() -> new IllegalArgumentException("المستخدم غير موجود."));
        Optional<Guide> found = guideRepository.findById(id);
        if (found.isEmpty()) return Optional.empty();
        Guide guide = found.get();
        apply(guide, request, user);
        Guide saved = guideRepository.save(guide);
        GuideResponse response = GuideResponse.from(saved);
        activityLogService.logAction(userId, null, EntityType.GUIDE, saved.getId(), ActionType.UPDATE,
                "تم تعديل دليل: " + saved.getTitle(), Map.of("title", saved.getTitle(), "status", saved.getStatus()));
        return Optional.of(response);
    }

    @Transactional
    public Optional<String> delete(Long id, Long userId) {
        if (!guideRepository.existsById(id)) return Optional.empty();
        Guide guide = guideRepository.findById(id).orElseThrow();
        String title = guide.getTitle();
        guideRepository.delete(guide);
        activityLogService.logAction(userId, null, EntityType.GUIDE, id, ActionType.DELETE,
                "تم حذف دليل: " + title, Map.of("title", title));
        return Optional.of(title);
    }

    private void apply(Guide guide, GuideRequest request, User user) {
        guide.setTitle(request.getTitle().trim());
        guide.setCategory(request.getCategory().trim());
        guide.setDescription(request.getDescription() == null ? "" : request.getDescription().trim());
        guide.setIcon(request.getIcon());
        guide.setColor(request.getColor());
        guide.setStatus("published".equalsIgnoreCase(request.getStatus()) ? "published" : "draft");
        guide.setUpdatedBy(user);
        guide.getSteps().clear();
        List<GuideStepRequest> requests = request.getSteps() == null ? List.of() : request.getSteps();
        for (int i = 0; i < requests.size(); i++) {
            GuideStepRequest source = requests.get(i);
            GuideStep step = new GuideStep();
            step.setGuide(guide);
            step.setStepOrder(i + 1);
            step.setTitle(source.getTitle().trim());
            step.setDescription(source.getDescription().trim());
            step.setNote(source.getNote());
            step.setEntityName(source.getEntityName());
            step.setCompanyId(source.getCompanyId());
            guide.getSteps().add(step);
        }
    }
}
