package com.accounting.backend;

import com.accounting.backend.entities.*;
import com.accounting.backend.enums.CompanyStatus;
import com.accounting.backend.enums.SystemRole;
import com.accounting.backend.repositories.*;
import com.accounting.backend.services.AuthorizationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
public class Phase2AuthorizationTest {

    @Autowired
    private AuthorizationService authorizationService;

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
    private DepartmentManagerDepartmentRepository departmentManagerDepartmentRepository;

    @Autowired
    private CompanyRepository companyRepository;

    @Autowired
    private TaskRepository taskRepository;

    // Test entities
    private User owner;
    private User bmBranchA;
    private User dmDept1;
    private User empDept1BranchA;
    private User empDept3BranchB;

    private Branch branchA;
    private Branch branchB;

    private Department dept1BranchA;
    private Department dept2BranchA;
    private Department dept3BranchB;

    private Company companyBranchA;
    private Company companyBranchB;

    @BeforeEach
    void setupTestData() {
        // Setup Branches
        branchA = branchRepository.findAll().stream().findFirst().orElseGet(() -> {
            Branch b = new Branch();
            b.setName("Phase2 Branch A");
            return branchRepository.save(b);
        });

        branchB = branchRepository.findAll().stream()
                .filter(b -> !b.getId().equals(branchA.getId()))
                .findFirst().orElseGet(() -> {
                    Branch b = new Branch();
                    b.setName("Phase2 Branch B");
                    return branchRepository.save(b);
                });

        // Setup Departments
        dept1BranchA = departmentRepository.findAll().stream()
                .filter(d -> d.getBranch() != null && d.getBranch().getId().equals(branchA.getId()))
                .findFirst().orElseGet(() -> {
                    Department d = new Department();
                    d.setName("Phase2 Dept 1 Branch A");
                    d.setBranch(branchA);
                    return departmentRepository.save(d);
                });

        dept2BranchA = departmentRepository.findAll().stream()
                .filter(d -> d.getBranch() != null && d.getBranch().getId().equals(branchA.getId()) && !d.getId().equals(dept1BranchA.getId()))
                .findFirst().orElseGet(() -> {
                    Department d = new Department();
                    d.setName("Phase2 Dept 2 Branch A");
                    d.setBranch(branchA);
                    return departmentRepository.save(d);
                });

        dept3BranchB = departmentRepository.findAll().stream()
                .filter(d -> d.getBranch() != null && d.getBranch().getId().equals(branchB.getId()))
                .findFirst().orElseGet(() -> {
                    Department d = new Department();
                    d.setName("Phase2 Dept 3 Branch B");
                    d.setBranch(branchB);
                    return departmentRepository.save(d);
                });

        // Roles
        Role ownerRole = roleRepository.findAll().stream()
                .filter(r -> "owner".equalsIgnoreCase(r.getName()))
                .findFirst().orElseThrow();
        Role bmRole = roleRepository.findAll().stream()
                .filter(r -> "headBranch".equalsIgnoreCase(r.getName()))
                .findFirst().orElseThrow();
        Role dmRole = roleRepository.findAll().stream()
                .filter(r -> "headDepartment".equalsIgnoreCase(r.getName()))
                .findFirst().orElseThrow();
        Role empRole = roleRepository.findAll().stream()
                .filter(r -> "employee".equalsIgnoreCase(r.getName()))
                .findFirst().orElseThrow();

        // Setup Users
        owner = createTestUser("phase2_owner@test.com", "Phase2 Owner", ownerRole, branchA, dept1BranchA);
        bmBranchA = createTestUser("phase2_bm_a@test.com", "Phase2 BM Branch A", bmRole, branchA, dept1BranchA);
        dmDept1 = createTestUser("phase2_dm_d1@test.com", "Phase2 DM Dept 1", dmRole, branchA, dept1BranchA);

        // Assign dept1 to DM
        if (!departmentManagerDepartmentRepository.existsById_ManagerIdAndId_DepartmentId(dmDept1.getId(), dept1BranchA.getId())) {
            departmentManagerDepartmentRepository.save(new DepartmentManagerDepartment(dmDept1, dept1BranchA));
        }

        empDept1BranchA = createTestUser("phase2_emp_d1_a@test.com", "Phase2 Emp Dept 1", empRole, branchA, dept1BranchA);
        empDept3BranchB = createTestUser("phase2_emp_d3_b@test.com", "Phase2 Emp Dept 3", empRole, branchB, dept3BranchB);

        // Setup Companies
        companyBranchA = companyRepository.findAll().stream()
                .filter(c -> c.getBranch() != null && c.getBranch().getId().equals(branchA.getId()))
                .findFirst().orElseGet(() -> {
                    Company c = new Company();
                    c.setName("Company Branch A");
                    c.setCompanyType("LLC");
                    c.setCreatedAt(LocalDateTime.now());
                    c.setUpdatedAt(LocalDateTime.now());
                    c.setBranch(branchA);
                    c.setDepartment(dept1BranchA);
                    return companyRepository.save(c);
                });

        companyBranchB = companyRepository.findAll().stream()
                .filter(c -> c.getBranch() != null && c.getBranch().getId().equals(branchB.getId()))
                .findFirst().orElseGet(() -> {
                    Company c = new Company();
                    c.setName("Company Branch B");
                    c.setCompanyType("LLC");
                    c.setCreatedAt(LocalDateTime.now());
                    c.setUpdatedAt(LocalDateTime.now());
                    c.setBranch(branchB);
                    c.setDepartment(dept3BranchB);
                    return companyRepository.save(c);
                });
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
            ea.setStartDate(LocalDate.now());
            employeeAssignmentRepository.save(ea);
        }

        return userRepository.findById(u.getId()).orElse(u);
    }

    // ==========================================
    // 1. COMPANY AUTHORIZATION TESTS
    // ==========================================

    @Test
    @DisplayName("Owner can create company in any branch/department")
    void testOwnerCanCreateCompany() {
        assertTrue(authorizationService.canCreateCompany(owner.getId(), branchA.getId(), dept1BranchA.getId()));
        assertTrue(authorizationService.canCreateCompany(owner.getId(), branchB.getId(), dept3BranchB.getId()));
        assertTrue(authorizationService.canCreateCompany(owner.getId(), null, null));
    }

    @Test
    @DisplayName("Branch Manager can create company in own branch, but not in another branch")
    void testBranchManagerCompanyCreationScope() {
        // Own branch: ALLOW
        assertTrue(authorizationService.canCreateCompany(bmBranchA.getId(), branchA.getId(), dept1BranchA.getId()));

        // Other branch: FORBIDDEN
        assertFalse(authorizationService.canCreateCompany(bmBranchA.getId(), branchB.getId(), dept3BranchB.getId()));
    }

    @Test
    @DisplayName("Department Manager can create company in managed dept, but not in unmanaged dept")
    void testDepartmentManagerCompanyCreationScope() {
        // Managed dept1: ALLOW
        assertTrue(authorizationService.canCreateCompany(dmDept1.getId(), branchA.getId(), dept1BranchA.getId()));

        // Unmanaged dept2: FORBIDDEN
        assertFalse(authorizationService.canCreateCompany(dmDept1.getId(), branchA.getId(), dept2BranchA.getId()));
    }

    @Test
    @DisplayName("Employee cannot create company")
    void testEmployeeCannotCreateCompany() {
        assertFalse(authorizationService.canCreateCompany(empDept1BranchA.getId(), branchA.getId(), dept1BranchA.getId()));
    }

    @Test
    @DisplayName("Company view permissions: Employee can view own branch companies, not other branch")
    void testCompanyViewScope() {
        assertTrue(authorizationService.canViewCompany(owner.getId(), companyBranchA));
        assertTrue(authorizationService.canViewCompany(owner.getId(), companyBranchB));

        // BM Branch A
        assertTrue(authorizationService.canViewCompany(bmBranchA.getId(), companyBranchA));
        assertFalse(authorizationService.canViewCompany(bmBranchA.getId(), companyBranchB));

        // Employee Branch A
        assertTrue(authorizationService.canViewCompany(empDept1BranchA.getId(), companyBranchA));
        assertFalse(authorizationService.canViewCompany(empDept1BranchA.getId(), companyBranchB));
    }

    @Test
    @DisplayName("Company manage permissions: Employee cannot edit or delete company")
    void testEmployeeCannotManageCompany() {
        assertFalse(authorizationService.canManageCompany(empDept1BranchA.getId(), companyBranchA));
        assertTrue(authorizationService.canManageCompany(owner.getId(), companyBranchA));
        assertTrue(authorizationService.canManageCompany(bmBranchA.getId(), companyBranchA));
    }

    // ==========================================
    // 2. TASK CREATION & ASSIGNMENT TESTS
    // ==========================================

    @Test
    @DisplayName("Employee cannot create tasks")
    void testEmployeeCannotCreateTask() {
        assertFalse(authorizationService.canAssignTask(empDept1BranchA.getId(), empDept1BranchA.getId()));
    }

    @Test
    @DisplayName("Owner can assign task cross-branch")
    void testOwnerCanAssignTaskAnywhere() {
        assertTrue(authorizationService.canAssignTask(owner.getId(), empDept1BranchA.getId()));
        assertTrue(authorizationService.canAssignTask(owner.getId(), empDept3BranchB.getId()));
    }

    @Test
    @DisplayName("Branch Manager can assign in own branch, cannot assign cross-branch")
    void testBranchManagerTaskAssignmentScope() {
        assertTrue(authorizationService.canAssignTask(bmBranchA.getId(), empDept1BranchA.getId()));
        assertFalse(authorizationService.canAssignTask(bmBranchA.getId(), empDept3BranchB.getId()));
    }

    @Test
    @DisplayName("Department Manager can assign in managed dept, cannot assign outside managed dept")
    void testDepartmentManagerTaskAssignmentScope() {
        assertTrue(authorizationService.canAssignTask(dmDept1.getId(), empDept1BranchA.getId()));
        assertFalse(authorizationService.canAssignTask(dmDept1.getId(), empDept3BranchB.getId()));
    }

    // ==========================================
    // 3. TASK EDIT & DELETE: CREATOR ONLY TESTS
    // ==========================================

    @Test
    @DisplayName("ONLY task creator can edit task - even Owner cannot edit another creator's task")
    void testOnlyTaskCreatorCanEdit() {
        Task taskCreatedByBm = new Task();
        taskCreatedByBm.setTitle("BM Task");
        taskCreatedByBm.setCreatedBy(bmBranchA);
        taskCreatedByBm.setAssignedTo(empDept1BranchA);
        taskCreatedByBm.setCompany(companyBranchA);

        // Creator can edit
        assertTrue(authorizationService.canEditTask(bmBranchA.getId(), taskCreatedByBm));

        // Non-creators CANNOT edit (even Owner and DM)
        assertFalse(authorizationService.canEditTask(owner.getId(), taskCreatedByBm));
        assertFalse(authorizationService.canEditTask(dmDept1.getId(), taskCreatedByBm));
        assertFalse(authorizationService.canEditTask(empDept1BranchA.getId(), taskCreatedByBm));
    }

    @Test
    @DisplayName("ONLY task creator can delete task - even Owner cannot delete another creator's task")
    void testOnlyTaskCreatorCanDelete() {
        Task taskCreatedByDm = new Task();
        taskCreatedByDm.setTitle("DM Task");
        taskCreatedByDm.setCreatedBy(dmDept1);
        taskCreatedByDm.setAssignedTo(empDept1BranchA);
        taskCreatedByDm.setCompany(companyBranchA);

        // Creator can delete
        assertTrue(authorizationService.canDeleteTask(dmDept1.getId(), taskCreatedByDm));

        // Non-creators CANNOT delete (even Owner and BM)
        assertFalse(authorizationService.canDeleteTask(owner.getId(), taskCreatedByDm));
        assertFalse(authorizationService.canDeleteTask(bmBranchA.getId(), taskCreatedByDm));
        assertFalse(authorizationService.canDeleteTask(empDept1BranchA.getId(), taskCreatedByDm));
    }

    // ==========================================
    // 4. TASK STATUS UPDATE: ASSIGNEE ONLY TESTS
    // ==========================================

    @Test
    @DisplayName("ONLY assigned employee can change task status")
    void testOnlyAssigneeCanChangeStatus() {
        Task task = new Task();
        task.setTitle("Work Item");
        task.setCreatedBy(bmBranchA);
        task.setAssignedTo(empDept1BranchA);
        task.setCompany(companyBranchA);

        // Assigned employee can change status
        assertTrue(authorizationService.canChangeTaskStatus(empDept1BranchA.getId(), task));

        // Creator CANNOT change status (unless they are also the assignee)
        assertFalse(authorizationService.canChangeTaskStatus(bmBranchA.getId(), task));

        // Owner CANNOT change status
        assertFalse(authorizationService.canChangeTaskStatus(owner.getId(), task));

        // Another employee CANNOT change status
        assertFalse(authorizationService.canChangeTaskStatus(empDept3BranchB.getId(), task));
    }

    // ========================================================
    // 5. TASK ASSIGNMENT CASCADING & SCOPING VALIDATION TESTS
    // ========================================================

    @Test
    @DisplayName("Owner can assign task across any branch and department")
    void testOwnerCanAssignTaskAnywhere() {
        assertDoesNotThrow(() -> {
            authorizationService.validateTaskAssignment(
                    owner.getId(), branchA.getId(), dept1BranchA.getId(), empDept1BranchA.getId());
        });

        assertDoesNotThrow(() -> {
            authorizationService.validateTaskAssignment(
                    owner.getId(), branchB.getId(), dept3BranchB.getId(), empDept3BranchB.getId());
        });
    }

    @Test
    @DisplayName("Branch Manager can assign task in own branch, fails in other branch")
    void testBranchManagerTaskAssignmentScope() {
        // Valid in own branch
        assertDoesNotThrow(() -> {
            authorizationService.validateTaskAssignment(
                    bmBranchA.getId(), branchA.getId(), dept1BranchA.getId(), empDept1BranchA.getId());
        });

        // Fails in other branch (403 FORBIDDEN)
        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> {
            authorizationService.validateTaskAssignment(
                    bmBranchA.getId(), branchB.getId(), dept3BranchB.getId(), empDept3BranchB.getId());
        });
        assertEquals(403, ex.getStatusCode().value());
    }

    @Test
    @DisplayName("Department Manager can assign in managed dept, fails in unmanaged dept")
    void testDepartmentManagerTaskAssignmentScope() {
        // Valid in managed department
        assertDoesNotThrow(() -> {
            authorizationService.validateTaskAssignment(
                    dmDept1.getId(), branchA.getId(), dept1BranchA.getId(), empDept1BranchA.getId());
        });

        // Fails in unmanaged dept in same branch (403 FORBIDDEN)
        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> {
            authorizationService.validateTaskAssignment(
                    dmDept1.getId(), branchA.getId(), dept2BranchA.getId(), empDept1BranchA.getId());
        });
        assertEquals(403, ex.getStatusCode().value());
    }

    @Test
    @DisplayName("Subordinate cannot assign task to Owner (403 FORBIDDEN)")
    void testSubordinateCannotAssignToOwner() {
        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> {
            authorizationService.validateTaskAssignment(
                    bmBranchA.getId(), branchA.getId(), dept1BranchA.getId(), owner.getId());
        });
        assertEquals(403, ex.getStatusCode().value());
    }

    @Test
    @DisplayName("Employee cannot assign tasks (403 FORBIDDEN)")
    void testEmployeeCannotAssignTasks() {
        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> {
            authorizationService.validateTaskAssignment(
                    empDept1BranchA.getId(), branchA.getId(), dept1BranchA.getId(), empDept1BranchA.getId());
        });
        assertEquals(403, ex.getStatusCode().value());
    }

    @Test
    @DisplayName("Mismatched Department and Branch throws 400 BAD REQUEST")
    void testMismatchedDepartmentAndBranch() {
        // dept3BranchB belongs to branchB, but branchA is passed
        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> {
            authorizationService.validateTaskAssignment(
                    owner.getId(), branchA.getId(), dept3BranchB.getId(), empDept1BranchA.getId());
        });
        assertEquals(400, ex.getStatusCode().value());
    }

    @Test
    @DisplayName("Employee not belonging to selected Branch or Department throws 400 BAD REQUEST")
    void testMismatchedEmployeeBranchOrDepartment() {
        // empDept3BranchB belongs to Branch B / Dept 3, but Branch A / Dept 1 is passed
        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> {
            authorizationService.validateTaskAssignment(
                    owner.getId(), branchA.getId(), dept1BranchA.getId(), empDept3BranchB.getId());
        });
        assertEquals(400, ex.getStatusCode().value());
    }
}

