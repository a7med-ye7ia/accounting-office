package com.accounting.backend;

import com.accounting.backend.dto.SubTaskRequest;
import com.accounting.backend.dto.TaskRequest;
import com.accounting.backend.dto.TaskResponse;
import com.accounting.backend.entities.*;
import com.accounting.backend.enums.ContractStatus;
import com.accounting.backend.enums.ContractType;
import com.accounting.backend.enums.NotificationType;
import com.accounting.backend.enums.TaskStatus;
import com.accounting.backend.repositories.*;
import com.accounting.backend.services.TaskReviewService;
import com.accounting.backend.services.TaskService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Service-level regression tests for the task flows (existing behaviour plus the
 * amendment review lifecycle and branch+department scoping introduced with it).
 * Follows the Phase1/Phase2 fixture pattern: shared fixture users, per-test tasks
 * that are cleaned up afterwards.
 */
@SpringBootTest
public class TaskFlowRegressionTest {

    @Autowired
    private TaskService taskService;
    @Autowired
    private TaskReviewService taskReviewService;
    @Autowired
    private BranchRepository branchRepository;
    @Autowired
    private DepartmentRepository departmentRepository;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private RoleRepository roleRepository;
    @Autowired
    private UserRoleRepository userRoleRepository;
    @Autowired
    private EmployeeAssignmentRepository employeeAssignmentRepository;
    @Autowired
    private CompanyRepository companyRepository;
    @Autowired
    private ContractRepository contractRepository;
    @Autowired
    private TaskRepository taskRepository;
    @Autowired
    private NotificationRepository notificationRepository;

    private Long ownerId;
    private Long empSameDeptId;   // Branch A / Dept 1 (same dept as task)
    private Long empSameDept2Id;  // Branch A / Dept 1 (second employee, same dept)
    private Long empSameBranchId; // Branch A / Dept 2 (same branch, other dept)
    private Long empOtherBranchId;// Branch B / Dept 3
    private Long branchAId;
    private Long dept1Id;
    private Long dept2Id;

    @BeforeEach
    void setupTestData() {
        Branch bA = branchRepository.findAll().stream().findFirst().orElseGet(() -> {
            Branch b = new Branch();
            b.setName("Branch A Test");
            return branchRepository.save(b);
        });
        branchAId = bA.getId();

        Branch bB = branchRepository.findAll().stream()
                .filter(b -> !b.getId().equals(bA.getId()))
                .findFirst().orElseGet(() -> {
                    Branch b = new Branch();
                    b.setName("Branch B Test");
                    return branchRepository.save(b);
                });

        Department d1 = departmentRepository.findAll().stream()
                .filter(d -> d.getBranch() != null && d.getBranch().getId().equals(branchAId))
                .findFirst().orElseGet(() -> {
                    Department d = new Department();
                    d.setName("Dept 1 Branch A");
                    d.setBranch(bA);
                    return departmentRepository.save(d);
                });
        dept1Id = d1.getId();

        Department d2 = departmentRepository.findAll().stream()
                .filter(d -> d.getBranch() != null && d.getBranch().getId().equals(branchAId)
                        && !d.getId().equals(d1.getId()))
                .findFirst().orElseGet(() -> {
                    Department d = new Department();
                    d.setName("Dept 2 Branch A");
                    d.setBranch(bA);
                    return departmentRepository.save(d);
                });
        dept2Id = d2.getId();

        Department d3 = departmentRepository.findAll().stream()
                .filter(d -> d.getBranch() != null && d.getBranch().getId().equals(bB.getId()))
                .findFirst().orElseGet(() -> {
                    Department d = new Department();
                    d.setName("Dept 3 Branch B");
                    d.setBranch(bB);
                    return departmentRepository.save(d);
                });

        Role ownerRole = roleRepository.findAll().stream()
                .filter(r -> "owner".equalsIgnoreCase(r.getName())).findFirst().orElseThrow();
        Role empRole = roleRepository.findAll().stream()
                .filter(r -> "employee".equalsIgnoreCase(r.getName())).findFirst().orElseThrow();

        ownerId = createTestUser("tfr_owner@test.com", "TFR Owner", ownerRole, bA, d1).getId();
        empSameDeptId = createTestUser("tfr_emp1@test.com", "TFR Emp SameDept", empRole, bA, d1).getId();
        empSameDept2Id = createTestUser("tfr_emp1b@test.com", "TFR Emp SameDept2", empRole, bA, d1).getId();
        empSameBranchId = createTestUser("tfr_emp2@test.com", "TFR Emp SameBranch", empRole, bA, d2).getId();
        empOtherBranchId = createTestUser("tfr_emp3@test.com", "TFR Emp OtherBranch", empRole, bB, d3).getId();
    }

    private User createTestUser(String email, String name, Role role, Branch branch, Department dept) {
        User u = userRepository.findByEmail(email).orElseGet(() -> {
            User user = new User();
            user.setEmail(email);
            user.setFullName(name);
            user.setPassword("hashedpassword123");
            user.setCreatedAt(LocalDateTime.now());
            user.setUpdatedAt(LocalDateTime.now());
            return userRepository.save(user);
        });
        if (userRoleRepository.findByUser_Id(u.getId()).isEmpty()) {
            UserRole ur = new UserRole();
            ur.setId(new UserRoleId(u.getId(), role.getId()));
            ur.setUser(u);
            ur.setRole(role);
            userRoleRepository.save(ur);
        }
        if (employeeAssignmentRepository.findByUser_Id(u.getId()).isEmpty()) {
            EmployeeAssignment ea = new EmployeeAssignment();
            ea.setUser(u);
            ea.setBranch(branch);
            ea.setDepartment(dept);
            ea.setIsPrimary(true);
            ea.setStartDate(java.time.LocalDate.now());
            employeeAssignmentRepository.save(ea);
        }
        return u;
    }

    // ------------------------------------------------------------------
    // helpers
    // ------------------------------------------------------------------

    private TaskRequest taskRequest(String title, Long assigneeId, SubTaskRequest... subtasks) {
        TaskRequest request = new TaskRequest();
        request.setTitle(title);
        request.setDescription("regression test task");
        request.setBranchId(branchAId);
        request.setDepartmentId(dept1Id);
        request.setAssignedToId(assigneeId);
        request.setCreatedById(ownerId);
        request.setDueDate(LocalDateTime.now().plusDays(1));
        if (subtasks.length > 0) {
            request.setSubtasks(List.of(subtasks));
        }
        return request;
    }

    private SubTaskRequest subRequest(String title, Long assigneeId) {
        SubTaskRequest sub = new SubTaskRequest();
        sub.setTitle(title);
        sub.setDescription("regression subtask");
        sub.setDueDate(LocalDateTime.now().plusDays(1));
        sub.setAssignedToId(assigneeId);
        return sub;
    }

    private Long createAndCleanupLater(String title, Long assigneeId, SubTaskRequest... subtasks) {
        Long taskId = taskService.createTask(taskRequest(title, assigneeId, subtasks), ownerId).getId();
        createdTaskIds.add(taskId);
        return taskId;
    }

    private final List<Long> createdTaskIds = new java.util.ArrayList<>();

    @BeforeEach
    void resetCreated() {
        createdTaskIds.clear();
    }

    @org.junit.jupiter.api.AfterEach
    void cleanupTasks() {
        for (Long id : createdTaskIds) {
            try {
                taskService.deleteTask(id);
            } catch (Exception ignored) {
            }
        }
        createdTaskIds.clear();
    }

    private boolean hasNotification(Long userId, Long taskId, NotificationType type) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .anyMatch(n -> type.equals(n.getType())
                        && taskId.equals(n.getReferenceId()));
    }

    private Contract createPendingAmendment(Task task, Company company) {
        Contract contract = new Contract();
        contract.setType(ContractType.UPDATING);
        contract.setCompany(company);
        contract.setCreatedBy(userRepository.findById(ownerId).orElseThrow());
        contract.setStatus(ContractStatus.PENDING_APPROVAL);
        contract.setOcrData("{\"contractTitle\":\"عقد تعديل\",\"sections\":[{\"selectedArticleId\":\"1\",\"beforeText\":\"قبل\",\"afterText\":\"بعد\"}]}");
        contract.setTask(task);
        contract.setCreatedAt(LocalDateTime.now());
        contract.setUpdatedAt(LocalDateTime.now());
        return contractRepository.save(contract);
    }

    // ------------------------------------------------------------------
    // Existing behaviour: creation, subtask lifecycle, cascading
    // ------------------------------------------------------------------

    @Test
    @DisplayName("Create task with subtasks -> assignees notified, parent PENDING")
    void testCreateTaskWithSubtasks() {
        TaskResponse created = taskService.createTask(
                taskRequest("TFR create", empSameDeptId,
                        subRequest("sub 1", empSameDeptId),
                        subRequest("sub 2", empSameDept2Id)),
                ownerId);
        createdTaskIds.add(created.getId());

        assertEquals(TaskStatus.PENDING, created.getStatus());
        assertEquals(2, created.getSubtasks().size());
        assertTrue(hasNotification(empSameDeptId, created.getId(), NotificationType.TASK_ASSIGNED));
        assertTrue(hasNotification(empSameDept2Id, created.getId(), NotificationType.TASK_ASSIGNED));
    }

    @Test
    @DisplayName("Subtask lifecycle: start -> complete syncs parent to DONE, creator notified")
    void testSubtaskLifecycleReachesDoneAndNotifies() {
        Long taskId = createAndCleanupLater("TFR lifecycle", empSameDeptId,
                subRequest("sub", empSameDeptId));

        taskService.startSubTask(taskId, taskService.getTaskById(taskId).getSubtasks().get(0).getId(), empSameDeptId);
        assertEquals(TaskStatus.IN_PROGRESS, taskService.getTaskById(taskId).getStatus());

        TaskResponse done = taskService.completeSubTask(
                taskId, taskService.getTaskById(taskId).getSubtasks().get(0).getId(), empSameDeptId);
        assertEquals(TaskStatus.DONE, done.getStatus());
        assertTrue(hasNotification(ownerId, taskId, NotificationType.TASK_COMPLETED),
                "creator should be notified when the task waits for review");
    }

    @Test
    @DisplayName("Employee cannot accept a task (existing rule preserved)")
    void testEmployeeCannotAccept() {
        Long taskId = createAndCleanupLater("TFR no accept", empSameDeptId);
        TaskRequest statusOnly = new TaskRequest();
        statusOnly.setStatus(TaskStatus.ACCEPTED);
        assertThrows(SecurityException.class,
                () -> taskService.updateTask(taskId, statusOnly, empSameDeptId));
    }

    @Test
    @DisplayName("Parent reassignment cascades subtasks (option one) and content edit resets status")
    void testCascadeAndReset() {
        Long taskId = createAndCleanupLater("TFR cascade", empSameDeptId,
                subRequest("sub", empSameDeptId));
        Long subId = taskService.getTaskById(taskId).getSubtasks().get(0).getId();
        taskService.startSubTask(taskId, subId, empSameDeptId);

        // cascade: reassign parent to a colleague in the same department -> subtask follows
        TaskRequest reassign = new TaskRequest();
        reassign.setAssignedToId(empSameDept2Id);
        TaskResponse reassigned = taskService.updateTask(taskId, reassign, ownerId);
        assertEquals(empSameDept2Id, reassigned.getAssignedToId());
        assertEquals(empSameDept2Id, reassigned.getSubtasks().get(0).getAssignedToId());
        // existing behaviour: a parent-only reassignment cascades the assignee but
        // keeps subtask status; the PENDING reset applies when subtasks are edited
        assertEquals("IN_PROGRESS", String.valueOf(reassigned.getSubtasks().get(0).getStatus()));

        // content edit resets task to PENDING (existing rule)
        TaskRequest content = new TaskRequest();
        content.setTitle("TFR cascade edited");
        TaskResponse edited = taskService.updateTask(taskId, content, ownerId);
        assertEquals(TaskStatus.PENDING, edited.getStatus());
    }

    // ------------------------------------------------------------------
    // Branch + Department validation for subtasks
    // ------------------------------------------------------------------

    @Test
    @DisplayName("addSubTask rejects employee outside task's department (backend enforced)")
    void testAddSubTaskRejectsOutOfDeptEmployee() {
        Long taskId = createAndCleanupLater("TFR scope add", empSameDeptId);
        assertThrows(ResponseStatusException.class,
                () -> taskService.addSubTask(taskId, subRequest("bad dept", empSameBranchId), ownerId));
        assertThrows(ResponseStatusException.class,
                () -> taskService.addSubTask(taskId, subRequest("bad branch", empOtherBranchId), ownerId));

        TaskResponse ok = taskService.addSubTask(taskId, subRequest("same dept", empSameDeptId), ownerId);
        assertEquals(1, ok.getSubtasks().size());
    }

    // ------------------------------------------------------------------
    // FREE task visibility + claiming
    // ------------------------------------------------------------------

    @Test
    @DisplayName("Partial leave keeps task assigned to remaining employee")
    void testPartialLeaveNotFree() {
        Long taskId = createAndCleanupLater("TFR partial leave", empSameDeptId,
                subRequest("sub a", empSameDeptId),
                subRequest("sub b", empSameDept2Id));

        taskService.leaveTask(taskId, empSameDeptId);
        TaskResponse after = taskService.getTaskById(taskId);
        assertFalse(after.isFree(), "task still has an active worker");
        assertTrue(after.getSubtasks().stream()
                        .anyMatch(s -> empSameDept2Id.equals(s.getAssignedToId())),
                "remaining employee keeps their subtask");

        List<TaskResponse> remainingView = taskService.getTasksByAssignee(empSameDept2Id);
        assertTrue(remainingView.stream().anyMatch(t -> t.getId().equals(taskId)),
                "remaining employee still sees the task");
    }

    @Test
    @DisplayName("FREE task visible only to same branch AND department employees")
    void testFreeTaskScopedVisibility() {
        Long taskId = createAndCleanupLater("TFR free scope", empSameDeptId);
        taskService.leaveTask(taskId, empSameDeptId);
        assertTrue(taskService.getTaskById(taskId).isFree());

        assertTrue(taskService.getTasksByAssignee(empSameDeptId).stream()
                .anyMatch(t -> t.getId().equals(taskId)), "same branch+dept employee sees free task");
        assertTrue(taskService.getTasksByAssignee(empSameBranchId).stream()
                .noneMatch(t -> t.getId().equals(taskId)), "same branch other dept must NOT see free task");
        assertTrue(taskService.getTasksByAssignee(empOtherBranchId).stream()
                .noneMatch(t -> t.getId().equals(taskId)), "other branch must NOT see free task");

        // manager still sees everything
        assertTrue(taskService.getAllTasks(ownerId).stream()
                .anyMatch(t -> t.getId().equals(taskId)), "manager sees free task");
    }

    @Test
    @DisplayName("Claiming a FREE task enforces branch+department scope")
    void testClaimScopeEnforcement() {
        Long taskId = createAndCleanupLater("TFR claim scope", empSameDeptId);
        taskService.leaveTask(taskId, empSameDeptId);

        assertThrows(SecurityException.class,
                () -> taskService.claimFreeTask(taskId, empSameBranchId),
                "same-branch different-dept employee must not claim");
        assertThrows(SecurityException.class,
                () -> taskService.claimFreeTask(taskId, empOtherBranchId),
                "other-branch employee must not claim");

        TaskResponse claimed = taskService.claimFreeTask(taskId, empSameDeptId);
        assertEquals(empSameDeptId, claimed.getAssignedToId());
        assertFalse(claimed.isFree());
    }

    @Test
    @DisplayName("claimFreeSubTask on free task follows same scope rule")
    void testClaimSubTaskScope() {
        Long taskId = createAndCleanupLater("TFR claim sub", empSameDeptId,
                subRequest("sub", empSameDeptId));
        Long subId = taskService.getTaskById(taskId).getSubtasks().get(0).getId();
        taskService.leaveTask(taskId, empSameDeptId);

        assertThrows(SecurityException.class,
                () -> taskService.claimFreeSubTask(taskId, subId, empSameBranchId));
        TaskResponse claimed = taskService.claimFreeSubTask(taskId, subId, empSameDeptId);
        assertEquals(empSameDeptId, claimed.getSubtasks().get(0).getAssignedToId());
    }

    // ------------------------------------------------------------------
    // Amendment review lifecycle
    // ------------------------------------------------------------------

    @Test
    @DisplayName("Review data resolves the task-linked pending amendment")
    void testReviewDataResolution() {
        Company company = new Company();
        company.setName("TFR Test Company");
        company.setCompanyType("LLC");
        company.setCreatedAt(LocalDateTime.now());
        company.setUpdatedAt(LocalDateTime.now());
        company = companyRepository.save(company);

        Long taskId = createAndCleanupLater("TFR review data", empSameDeptId);
        Task task = taskRepository.findById(taskId).orElseThrow();
        Contract amendment = createPendingAmendment(task, company);

        Map<String, Object> review = taskReviewService.getReviewData(taskId, ownerId);
        assertNotNull(review.get("task"));
        @SuppressWarnings("unchecked")
        Map<String, Object> amendmentInfo = (Map<String, Object>) review.get("amendment");
        assertNotNull(amendmentInfo, "task-linked amendment must be resolved");
        assertEquals(amendment.getId(), ((Number) amendmentInfo.get("id")).longValue());
        assertEquals("PENDING_APPROVAL", String.valueOf(amendmentInfo.get("status")));
        assertNotNull(amendmentInfo.get("ocrData"));

        contractRepository.delete(amendment);
        companyRepository.delete(company);
    }

    @Test
    @DisplayName("Employees cannot access review data (backend authorization)")
    void testEmployeeCannotReview() {
        Long taskId = createAndCleanupLater("TFR review auth", empSameDeptId);
        assertThrows(SecurityException.class, () -> taskReviewService.getReviewData(taskId, empSameDeptId));
        assertThrows(SecurityException.class, () -> taskReviewService.approveTask(taskId, empSameDeptId));
        assertThrows(SecurityException.class, () -> taskReviewService.returnTaskForModification(taskId, empSameDeptId));
    }

    @Test
    @DisplayName("Approve: DONE -> ACCEPTED and amendment becomes APPROVED")
    void testApproveFlow() {
        Company company = new Company();
        company.setName("TFR Approve Company");
        company.setCompanyType("LLC");
        company.setCreatedAt(LocalDateTime.now());
        company.setUpdatedAt(LocalDateTime.now());
        company = companyRepository.save(company);

        Long taskId = createAndCleanupLater("TFR approve", empSameDeptId,
                subRequest("sub", empSameDeptId));
        Task task = taskRepository.findById(taskId).orElseThrow();
        Contract amendment = createPendingAmendment(task, company);

        Long subId = taskService.getTaskById(taskId).getSubtasks().get(0).getId();
        taskService.startSubTask(taskId, subId, empSameDeptId);
        taskService.completeSubTask(taskId, subId, empSameDeptId);

        TaskResponse approved = taskReviewService.approveTask(taskId, ownerId);
        assertEquals(TaskStatus.ACCEPTED, approved.getStatus());
        assertEquals(ContractStatus.APPROVED,
                contractRepository.findById(amendment.getId()).orElseThrow().getStatus(),
                "approved amendment becomes the accepted version");
        assertTrue(hasNotification(empSameDeptId, taskId, NotificationType.TASK_COMPLETED));

        // employee cannot approve
        Long taskId2 = createAndCleanupLater("TFR approve emp", empSameDeptId);
        assertThrows(SecurityException.class, () -> taskReviewService.approveTask(taskId2, empSameDeptId));

        contractRepository.delete(amendment);
        companyRepository.delete(company);
    }

    @Test
    @DisplayName("Return: DONE -> IN_PROGRESS, subtasks reopened, amendment stays pending")
    void testReturnFlow() {
        Company company = new Company();
        company.setName("TFR Return Company");
        company.setCompanyType("LLC");
        company.setCreatedAt(LocalDateTime.now());
        company.setUpdatedAt(LocalDateTime.now());
        company = companyRepository.save(company);

        Long taskId = createAndCleanupLater("TFR return", empSameDeptId,
                subRequest("sub", empSameDeptId));
        Task task = taskRepository.findById(taskId).orElseThrow();
        Contract amendment = createPendingAmendment(task, company);

        Long subId = taskService.getTaskById(taskId).getSubtasks().get(0).getId();
        taskService.startSubTask(taskId, subId, empSameDeptId);
        taskService.completeSubTask(taskId, subId, empSameDeptId);
        assertEquals(TaskStatus.DONE, taskService.getTaskById(taskId).getStatus());

        TaskResponse returned = taskReviewService.returnTaskForModification(taskId, ownerId);
        assertEquals(TaskStatus.IN_PROGRESS, returned.getStatus());
        assertEquals("IN_PROGRESS", String.valueOf(returned.getSubtasks().get(0).getStatus()),
                "returned task reopens DONE subtasks");
        assertEquals(ContractStatus.PENDING_APPROVAL,
                contractRepository.findById(amendment.getId()).orElseThrow().getStatus(),
                "returned amendment stays unapproved");

        // employee fixes and resubmits (reopened subtask is IN_PROGRESS already),
        // manager approves on the second pass
        taskService.completeSubTask(taskId, subId, empSameDeptId);
        TaskResponse approved = taskReviewService.approveTask(taskId, ownerId);
        assertEquals(TaskStatus.ACCEPTED, approved.getStatus());

        // returning a non-DONE task is rejected
        Long taskId2 = createAndCleanupLater("TFR return invalid", empSameDeptId);
        assertThrows(IllegalStateException.class,
                () -> taskReviewService.returnTaskForModification(taskId2, ownerId));

        contractRepository.delete(amendment);
        companyRepository.delete(company);
    }
}
