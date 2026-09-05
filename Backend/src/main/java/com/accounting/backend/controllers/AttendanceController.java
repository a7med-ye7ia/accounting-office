package com.accounting.backend.controllers;

import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.accounting.backend.dto.AttendanceResponse;
import com.accounting.backend.entities.User;
import com.accounting.backend.entities.UserRole;
import com.accounting.backend.repositories.UserRepository;
import com.accounting.backend.repositories.UserRoleRepository;
import com.accounting.backend.services.AttendanceService;
import com.accounting.backend.services.TokenCacheService;
import com.accounting.backend.security.JwtService;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/api/attendance")
public class AttendanceController {

    @Autowired
    private AttendanceService attendanceService;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private TokenCacheService tokenCacheService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserRoleRepository userRoleRepository;

    private Long extractUserIdFromHeader(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) return null;
        String token = authHeader.substring(7).trim();
        return jwtService.extractUserId(token);
    }

    private ResponseEntity<?> requireManagementRole(String authHeader) {
        Long callerId = authenticate(authHeader);
        if (callerId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Authentication required"));
        }
        if (!canManageAttendance(callerId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "ليس لديك صلاحية للوصول إلى هذه البيانات."));
        }
        return null;
    }

    private Long authenticate(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) return null;
        String token = authHeader.substring(7).trim();
        if (!jwtService.isTokenValid(token)) return null;
        try {
            Long userId = jwtService.extractUserId(token);
            return tokenCacheService.isTokenValid(userId, token) && userRepository.existsById(userId) ? userId : null;
        } catch (Exception e) {
            return null;
        }
    }

    private boolean hasRole(Long userId, String... names) {
        return userRoleRepository.findByUser_Id(userId).stream()
                .map(UserRole::getRole)
                .filter(Objects::nonNull)
                .map(role -> role.getName().toLowerCase(Locale.ROOT))
                .anyMatch(name -> Arrays.stream(names).anyMatch(name::equals));
    }

    private boolean canRecordAttendance(Long userId) {
        return hasRole(userId, "employee", "headdepartment");
    }

    private boolean canManageAttendance(Long userId) {
        return hasRole(userId, "owner", "headbranch");
    }

    private boolean isAttendanceSubject(User user) {
        return hasRole(user.getId(), "employee", "headdepartment");
    }

    @PostMapping("/start")
    public ResponseEntity<?> start(@RequestHeader(value = "Authorization", required = false) String authHeader,
                                   @RequestBody Map<String, Object> body) {
        try {
            Long userId = authenticate(authHeader);
            if (userId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Authentication required"));
            if (!canRecordAttendance(userId)) return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "ليس لديك صلاحية لتسجيل الحضور."));

            Double lat = body.get("latitude") instanceof Number ? ((Number) body.get("latitude")).doubleValue() : null;
            Double lon = body.get("longitude") instanceof Number ? ((Number) body.get("longitude")).doubleValue() : null;
            Double accuracy = body.get("accuracy") instanceof Number ? ((Number) body.get("accuracy")).doubleValue() : null;

            if (lat == null || lon == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "الموقع غير متاح."));
            }

            AttendanceResponse a = attendanceService.startAttendance(userId, lat, lon, accuracy);
            return ResponseEntity.ok(Map.of("message", "تم تسجيل بداية العمل", "attendance", a));
        } catch (IllegalStateException ise) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", ise.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "حدث خطأ أثناء تسجيل الحضور."));
        }
    }

    @PostMapping("/end")
    public ResponseEntity<?> end(@RequestHeader(value = "Authorization", required = false) String authHeader,
                                 @RequestBody Map<String, Object> body) {
        try {
            Long userId = authenticate(authHeader);
            if (userId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Authentication required"));
            if (!canRecordAttendance(userId)) return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "ليس لديك صلاحية لتسجيل الحضور."));

            Double lat = body.get("latitude") instanceof Number ? ((Number) body.get("latitude")).doubleValue() : null;
            Double lon = body.get("longitude") instanceof Number ? ((Number) body.get("longitude")).doubleValue() : null;
            Double accuracy = body.get("accuracy") instanceof Number ? ((Number) body.get("accuracy")).doubleValue() : null;

            if (lat == null || lon == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "الموقع غير متاح."));
            }

            AttendanceResponse a = attendanceService.endAttendance(userId, lat, lon, accuracy);
            return ResponseEntity.ok(Map.of("message", "تم تسجيل نهاية العمل", "attendance", a));
        } catch (IllegalStateException ise) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", ise.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "حدث خطأ أثناء إنهاء الحضور."));
        }
    }

    @GetMapping("/today/me")
    public ResponseEntity<?> getMyToday(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        try {
            Long userId = authenticate(authHeader);
            if (userId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Authentication required"));
            if (!canRecordAttendance(userId)) return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "ليس لديك صلاحية للوصول إلى هذه البيانات."));

            Optional<AttendanceResponse> a = attendanceService.getTodayForUser(userId);
            String status = "NOT_STARTED";
            if (a.isPresent()) {
                status = a.get().getStatus() != null ? a.get().getStatus().name() : "NOT_STARTED";
            }
            Map<String, Object> response = new LinkedHashMap<>();
            response.put("status", status);
            response.put("attendance", a.orElse(null));
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/today")
    public ResponseEntity<?> getTodayForAll(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        ResponseEntity<?> guard = requireManagementRole(authHeader);
        if (guard != null) return guard;

        try {
            // Build a list of users with their attendance (if any)
            List<Map<String, Object>> result = new ArrayList<>();
            List<User> users = userRepository.findAll().stream().filter(this::isAttendanceSubject).toList();
            Map<Long, AttendanceResponse> attendanceByUserId = attendanceService.getAllToday().stream()
                    .collect(Collectors.toMap(AttendanceResponse::getUserId, a -> a));
            for (User u : users) {
                AttendanceResponse a = attendanceByUserId.get(u.getId());
                Map<String, Object> row = new HashMap<>();
                row.put("userId", u.getId());
                row.put("employeeName", u.getFullName());
                if (a != null) {
                    row.put("status", a.getStatus() != null ? a.getStatus().name() : "NOT_STARTED");
                    row.put("startTime", a.getStartTime());
                    row.put("startLatitude", a.getStartLatitude());
                    row.put("startLongitude", a.getStartLongitude());
                    row.put("startAccuracy", a.getStartAccuracy());
                    row.put("endTime", a.getEndTime());
                    row.put("endLatitude", a.getEndLatitude());
                    row.put("endLongitude", a.getEndLongitude());
                    row.put("endAccuracy", a.getEndAccuracy());
                    row.put("workedMinutes", a.getWorkedMinutes());
                } else {
                    row.put("status", "NOT_STARTED");
                }
                result.add(row);
            }

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<?> getEmployeeHistory(@RequestHeader(value = "Authorization", required = false) String authHeader,
                                                @PathVariable Long employeeId) {
        Long callerId = authenticate(authHeader);
        if (callerId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Authentication required"));
        if (!canManageAttendance(callerId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "ليس لديك صلاحية للوصول إلى هذه البيانات."));
        }
        Optional<User> employee = userRepository.findById(employeeId);
        if (employee.isEmpty() || !isAttendanceSubject(employee.get())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "ليس لديك صلاحية للوصول إلى هذه البيانات."));
        }

        try {
            List<AttendanceResponse> history = attendanceService.getHistoryForUser(employeeId);
            return ResponseEntity.ok(history);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/employee/me")
    public ResponseEntity<?> getMyHistory(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        Long callerId = authenticate(authHeader);
        if (callerId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Authentication required"));
        if (!canRecordAttendance(callerId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "ليس لديك صلاحية للوصول إلى هذه البيانات."));
        }
        return ResponseEntity.ok(attendanceService.getHistoryForUser(callerId));
    }

}
