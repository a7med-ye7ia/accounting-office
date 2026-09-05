package com.accounting.backend.services;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.stereotype.Service;

import com.accounting.backend.entities.Contract;
import com.accounting.backend.entities.EmployeeAssignment;
import com.accounting.backend.entities.Task;
import com.accounting.backend.entities.TaskComment;
import com.accounting.backend.entities.User;
import com.accounting.backend.entities.UserRole;
import com.accounting.backend.repositories.ContractRepository;
import com.accounting.backend.repositories.EmployeeAssignmentRepository;
import com.accounting.backend.repositories.TaskRepository;
import com.accounting.backend.repositories.UserRepository;
import com.accounting.backend.repositories.UserRoleRepository;

@Service
public class EmployeeProfileService {

    private final UserRepository userRepository;
    private final EmployeeAssignmentRepository employeeAssignmentRepository;
    private final UserRoleRepository userRoleRepository;
    private final TaskRepository taskRepository;
    private final ContractRepository contractRepository;

    public EmployeeProfileService(
            UserRepository userRepository,
            EmployeeAssignmentRepository employeeAssignmentRepository,
            UserRoleRepository userRoleRepository,
            TaskRepository taskRepository,
            ContractRepository contractRepository) {
        this.userRepository = userRepository;
        this.employeeAssignmentRepository = employeeAssignmentRepository;
        this.userRoleRepository = userRoleRepository;
        this.taskRepository = taskRepository;
        this.contractRepository = contractRepository;
    }

    public Optional<Map<String, Object>> getProfile(Long userId) {
        return userRepository.findByDeletedAtIsNullAndId(userId).map(u -> toProfileMap(u, userId));
    }

    private Map<String, Object> toProfileMap(User u, Long userId) {
        Map<String, Object> m = new HashMap<>();
        m.put("id", u.getId());
        m.put("fullName", u.getFullName());
        m.put("email", u.getEmail());
        m.put("phone", u.getPhone());
        m.put("nationalId", u.getNationalId());
        m.put("status", u.getStatus());
        m.put("hireDate", u.getHireDate());
        m.put("createdAt", u.getCreatedAt());
        m.put("updatedAt", u.getUpdatedAt());

        List<EmployeeAssignment> assignments = employeeAssignmentRepository.findByUser_Id(userId);
        if (!assignments.isEmpty()) {
            EmployeeAssignment primary = assignments.stream()
                    .filter(a -> Boolean.TRUE.equals(a.getIsPrimary()))
                    .findFirst()
                    .orElse(assignments.get(0));
            if (primary.getDepartment() != null) {
                m.put("departmentId", primary.getDepartment().getId());
                m.put("departmentName", primary.getDepartment().getName());
            }
            if (primary.getBranch() != null) {
                m.put("branchId", primary.getBranch().getId());
                m.put("branchName", primary.getBranch().getName());
            }
        }

        List<UserRole> roles = userRoleRepository.findByUser_Id(userId);
        if (!roles.isEmpty() && roles.get(0).getRole() != null) {
            m.put("roleId", roles.get(0).getRole().getId());
            m.put("roleName", roles.get(0).getRole().getName());
        }

        List<Map<String, Object>> taskMaps = new ArrayList<>();
        for (Task t : taskRepository.findByAssignedTo_Id(userId)) {
            if (t.getDeletedAt() != null) {
                continue;
            }
            Map<String, Object> tm = new HashMap<>();
            tm.put("id", t.getId());
            tm.put("title", t.getTitle());
            tm.put("description", t.getDescription());
            tm.put("status", t.getStatus() != null ? t.getStatus().name() : null);
            tm.put("dueDate", t.getDueDate());
            tm.put("departmentId", t.getDepartment() != null ? t.getDepartment().getId() : null);
            tm.put("createdAt", t.getCreatedAt());
            taskMaps.add(tm);
        }
        m.put("tasks", taskMaps);

        List<Map<String, Object>> assignedByTasks = new ArrayList<>();
        for(Task t: taskRepository.findByCreatedBy_Id(userId)) {
            if (t.getDeletedAt() != null) {
                continue;
            }
            Map<String, Object> tm  = new HashMap<>();
            tm.put("id", t.getId());
            tm.put("title", t.getTitle());
            tm.put("description", t.getDescription());
            tm.put("status", t.getStatus() != null ? t.getStatus().name() : null);
            tm.put("dueDate", t.getDueDate());
            tm.put("departmentId", t.getDepartment() != null ? t.getDepartment().getId() : null);
            tm.put("createdAt", t.getCreatedAt());
            tm.put("comments", toCommentsMap(t));
            tm.put("assignedToName", t.getAssignedTo() != null ? t.getAssignedTo().getFullName() : null);
            assignedByTasks.add(tm);
        }
        m.put("assignedByTasks", assignedByTasks);

        List<Map<String, Object>> contractMaps = new ArrayList<>();
        for (Contract c : contractRepository.findByCreatedBy_Id(userId)) {
            if (c.getDeletedAt() != null) {
                continue;
            }
            Map<String, Object> cm = new HashMap<>();
            cm.put("id", c.getId());
            cm.put("type", c.getType() != null ? c.getType().name() : null);
            cm.put("status", c.getStatus() != null ? c.getStatus().name() : null);
            cm.put("filePath", c.getFilePath());
            cm.put("createdAt", c.getCreatedAt());
            contractMaps.add(cm);
        }
        m.put("contracts", contractMaps);

        return m;
    }

    private List<Map<String, Object>> toCommentsMap(Task t) {
        List<Map<String, Object>> commentMaps = new ArrayList<>();
        for (TaskComment tc : t.getComments()) {
            Map<String, Object> cm = new HashMap<>();
            cm.put("id", tc.getId());
            cm.put("comment", tc.getMessage());
            cm.put("createdAt", tc.getCreatedAt());
            cm.put("createdBy", tc.getCommentBy().getFullName());
            commentMaps.add(cm);
        }
        return commentMaps;
    }
}
