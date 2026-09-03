package com.accounting.backend.controllers;

import com.accounting.backend.dtos.GuideRequest;
import com.accounting.backend.dtos.GuideResponse;
import com.accounting.backend.entities.User;
import com.accounting.backend.repositories.UserRoleRepository;
import com.accounting.backend.services.AuthService;
import com.accounting.backend.services.GuideService;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/api/guides")
public class GuideController {
    private final GuideService guideService;
    private final AuthService authService;
    private final UserRoleRepository userRoleRepository;

    public GuideController(GuideService guideService, AuthService authService,
                           UserRoleRepository userRoleRepository) {
        this.guideService = guideService;
        this.authService = authService;
        this.userRoleRepository = userRoleRepository;
    }

    @GetMapping
    public ResponseEntity<?> published(@RequestHeader(value = "Authorization", required = false) String header) {
        if (authenticatedUser(header) == null) return unauthorized();
        return ResponseEntity.ok(guideService.listPublished());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> publishedById(@PathVariable Long id,
                                            @RequestHeader(value = "Authorization", required = false) String header) {
        if (authenticatedUser(header) == null) return unauthorized();
        return guideService.getPublished(id)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "الدليل غير موجود أو غير منشور.")));
    }

    @GetMapping("/admin")
    public ResponseEntity<?> allForAdmin(@RequestHeader(value = "Authorization", required = false) String header) {
        if (requireEditor(header) == null) return forbidden();
        return ResponseEntity.ok(guideService.listAll());
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestHeader(value = "Authorization", required = false) String header,
                                    @RequestBody GuideRequest request) {
        User user = requireEditor(header);
        if (user == null) return forbidden();
        String error = validate(request);
        if (error != null) return ResponseEntity.badRequest().body(Map.of("error", error));
        return ResponseEntity.status(HttpStatus.CREATED).body(guideService.create(request, user.getId()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id,
                                    @RequestHeader(value = "Authorization", required = false) String header,
                                    @RequestBody GuideRequest request) {
        User user = requireEditor(header);
        if (user == null) return forbidden();
        String error = validate(request);
        if (error != null) return ResponseEntity.badRequest().body(Map.of("error", error));
        return guideService.update(id, request, user.getId())
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "الدليل غير موجود.")));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id,
                                    @RequestHeader(value = "Authorization", required = false) String header) {
        User user = requireEditor(header);
        if (user == null) return forbidden();
        return guideService.delete(id, user.getId())
                .<ResponseEntity<?>>map(title -> ResponseEntity.ok(Map.of("message", "تم حذف الدليل بنجاح.")))
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "الدليل غير موجود.")));
    }

    private String validate(GuideRequest request) {
        if (request == null || request.getTitle() == null || request.getTitle().isBlank()) return "عنوان الدليل مطلوب.";
        if (request.getCategory() == null || request.getCategory().isBlank()) return "تصنيف الدليل مطلوب.";
        if (request.getSteps() == null || request.getSteps().isEmpty()) return "أضف خطوة واحدة على الأقل.";
        for (var step : request.getSteps()) {
            if (step == null || step.getTitle() == null || step.getTitle().isBlank()) return "عنوان كل خطوة مطلوب.";
            if (step.getDescription() == null || step.getDescription().isBlank()) return "وصف كل خطوة مطلوب.";
        }
        return null;
    }

    private User requireEditor(String header) {
        User user = authenticatedUser(header);
        if (user == null) return null;
        boolean allowed = userRoleRepository.findByUser_Id(user.getId()).stream()
                .map(ur -> ur.getRole().getName().toLowerCase(Locale.ROOT).replace(" ", "").replace("_", ""))
                .anyMatch(Set.of("owner", "headbranch", "headdepartment", "headofdepartment", "departmenthead")::contains);
        return allowed ? user : null;
    }

    private User authenticatedUser(String header) {
        if (header == null || !header.startsWith("Bearer ")) return null;
        return authService.getUserFromToken(header.substring(7).trim()).orElse(null);
    }
    private ResponseEntity<Map<String, String>> unauthorized() {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "يجب تسجيل الدخول للوصول إلى دليل الموظف."));
    }
    private ResponseEntity<Map<String, String>> forbidden() {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "ليس لديك صلاحية إدارة أدلة الموظفين."));
    }
}
