package com.accounting.backend;

import com.accounting.backend.entities.*;
import com.accounting.backend.enums.SystemRole;
import com.accounting.backend.repositories.*;
import com.accounting.backend.services.AuthorizationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.web.server.ResponseStatusException;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
public class Phase1AuthorizationTest {

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

    // Test entity references
    private Long ownerId;
    private Long bmBranchAId;
    private Long dmDept1Id;
    private Long empBranchAId;
    private Long empBranchBId;
    private Long branchAId;
    private Long branchBId;
    private Long dept1BranchAId;
    private Long dept2BranchAId;
    private Long dept3BranchBId;

    @BeforeEach
    void setupTestData() {
        // Find existing branches or create test branches
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
        branchBId = bB.getId();

        // Departments
        Department d1 = departmentRepository.findAll().stream()
                .filter(d -> d.getBranch() != null && d.getBranch().getId().equals(branchAId))
                .findFirst().orElseGet(() -> {
                    Department d = new Department();
                    d.setName("Dept 1 Branch A");
                    d.setBranch(bA);
                    return departmentRepository.save(d);
                });
        dept1BranchAId = d1.getId();

        Department d2 = departmentRepository.findAll().stream()
                .filter(d -> d.getBranch() != null && d.getBranch().getId().equals(branchAId) && !d.getId().equals(d1.getId()))
                .findFirst().orElseGet(() -> {
                    Department d = new Department();
                    d.setName("Dept 2 Branch A");
                    d.setBranch(bA);
                    return departmentRepository.save(d);
                });
        dept2BranchAId = d2.getId();

        Department d3 = departmentRepository.findAll().stream()
                .filter(d -> d.getBranch() != null && d.getBranch().getId().equals(branchBId))
                .findFirst().orElseGet(() -> {
                    Department d = new Department();
                    d.setName("Dept 3 Branch B");
                    d.setBranch(bB);
                    return departmentRepository.save(d);
                });
        dept3BranchBId = d3.getId();

        // Ensure roles exist
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

        // Create test users
        User owner = createTestUser("test_owner@test.com", "Owner User", ownerRole, bA, d1);
        ownerId = owner.getId();

        User bm = createTestUser("test_bm_a@test.com", "BM Branch A", bmRole, bA, d1);
        bmBranchAId = bm.getId();

        User dm = createTestUser("test_dm_1@test.com", "DM Dept 1", dmRole, bA, d1);
        dmDept1Id = dm.getId();
        // Assign dept1 to DM
        if (!departmentManagerDepartmentRepository.existsById_ManagerIdAndId_DepartmentId(dm.getId(), dept1BranchAId)) {
            departmentManagerDepartmentRepository.save(new DepartmentManagerDepartment(dm, d1));
        }

        User empA = createTestUser("test_emp_a@test.com", "Emp Branch A", empRole, bA, d1);
        empBranchAId = empA.getId();

        User empB = createTestUser("test_emp_b@test.com", "Emp Branch B", empRole, bB, d3);
        empBranchBId = empB.getId();
    }

    private User createTestUser(String email, String name, Role role, Branch branch, Department dept) {
        User u = userRepository.findByEmail(email).orElseGet(() -> {
            User user = new User();
            user.setEmail(email);
            user.setFullName(name);
            user.setPassword("hashedpassword123");
            user.setCreatedAt(java.time.LocalDateTime.now());
            user.setUpdatedAt(java.time.LocalDateTime.now());
            return userRepository.save(user);
        });

        // Set role
        if (userRoleRepository.findByUser_Id(u.getId()).isEmpty()) {
            UserRole ur = new UserRole();
            ur.setId(new UserRoleId(u.getId(), role.getId()));
            ur.setUser(u);
            ur.setRole(role);
            userRoleRepository.save(ur);
        }

        // Set primary assignment
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

    // ==========================================
    // 1. OWNER Tests
    // ==========================================

    @Test
    @DisplayName("Owner -> User Branch A ALLOW")
    void testOwnerAccessBranchA() {
        assertTrue(authorizationService.canViewUser(ownerId, empBranchAId), "Owner should view User Branch A");
        assertTrue(authorizationService.canManageUser(ownerId, empBranchAId), "Owner should manage User Branch A");
    }

    @Test
    @DisplayName("Owner -> User Branch B ALLOW")
    void testOwnerAccessBranchB() {
        assertTrue(authorizationService.canViewUser(ownerId, empBranchBId), "Owner should view User Branch B");
        assertTrue(authorizationService.canManageUser(ownerId, empBranchBId), "Owner should manage User Branch B");
    }

    @Test
    @DisplayName("Owner -> Change role ALLOW (including OWNER role)")
    void testOwnerChangeRole() {
        assertTrue(authorizationService.canChangeUserRole(ownerId, empBranchAId, SystemRole.BRANCH_MANAGER), "Owner can grant BM");
        assertTrue(authorizationService.canChangeUserRole(ownerId, empBranchAId, SystemRole.OWNER), "Owner can grant OWNER");
    }

    // ==========================================
    // 2. BRANCH MANAGER Tests
    // ==========================================

    @Test
    @DisplayName("BM Branch A -> User Branch A ALLOW")
    void testBranchManagerAccessSameBranch() {
        assertTrue(authorizationService.canViewUser(bmBranchAId, empBranchAId), "BM should view User in Branch A");
        assertTrue(authorizationService.canManageUser(bmBranchAId, empBranchAId), "BM should manage User in Branch A");
    }

    @Test
    @DisplayName("BM Branch A -> User Branch B DENY")
    void testBranchManagerAccessDifferentBranch() {
        assertFalse(authorizationService.canViewUser(bmBranchAId, empBranchBId), "BM should NOT view User in Branch B");
        assertFalse(authorizationService.canManageUser(bmBranchAId, empBranchBId), "BM should NOT manage User in Branch B");
    }

    @Test
    @DisplayName("BM Branch A -> Change role in Branch A ALLOW (non-owner)")
    void testBranchManagerChangeRoleInBranch() {
        assertTrue(authorizationService.canChangeUserRole(bmBranchAId, empBranchAId, SystemRole.DEPARTMENT_MANAGER),
                "BM can change role to DEPARTMENT_MANAGER in own branch");
        assertTrue(authorizationService.canChangeUserRole(bmBranchAId, empBranchAId, SystemRole.EMPLOYEE),
                "BM can change role to EMPLOYEE in own branch");
    }

    @Test
    @DisplayName("BM Branch A -> Grant OWNER DENY")
    void testBranchManagerGrantOwnerDenied() {
        assertFalse(authorizationService.canChangeUserRole(bmBranchAId, empBranchAId, SystemRole.OWNER),
                "BM MUST NOT be able to grant OWNER role");
    }

    // ==========================================
    // 3. DEPARTMENT MANAGER Tests
    // ==========================================

    @Test
    @DisplayName("DM -> Managed Department employee ALLOW")
    void testDepartmentManagerManagedDept() {
        assertTrue(authorizationService.canViewUser(dmDept1Id, empBranchAId), "DM should view employee in managed dept");
        assertTrue(authorizationService.canManageUser(dmDept1Id, empBranchAId), "DM should manage employee in managed dept");
    }

    @Test
    @DisplayName("DM -> Unmanaged Department employee DENY")
    void testDepartmentManagerUnmanagedDept() {
        // empB is in dept 3 (Branch B), not managed by dmDept1
        assertFalse(authorizationService.canViewUser(dmDept1Id, empBranchBId), "DM should NOT view employee in unmanaged dept");
        assertFalse(authorizationService.canManageUser(dmDept1Id, empBranchBId), "DM should NOT manage employee in unmanaged dept");
    }

    @Test
    @DisplayName("DM -> Another Branch DENY")
    void testDepartmentManagerAnotherBranch() {
        assertFalse(authorizationService.hasBranchAccess(dmDept1Id, branchBId), "DM should NOT have branch access to Branch B");
    }

    // ==========================================
    // 4. EMPLOYEE Tests
    // ==========================================

    @Test
    @DisplayName("Employee -> Edit own profile ALLOW")
    void testEmployeeEditOwnProfile() {
        assertTrue(authorizationService.canEditOwnProfile(empBranchAId, empBranchAId), "Employee should edit own profile");
    }

    @Test
    @DisplayName("Employee -> Edit another employee DENY")
    void testEmployeeEditAnotherEmployee() {
        assertFalse(authorizationService.canManageUser(empBranchAId, empBranchBId), "Employee MUST NOT manage another employee");
        assertFalse(authorizationService.canEditOwnProfile(empBranchAId, empBranchBId), "Employee cannot edit another's profile");
    }

    @Test
    @DisplayName("Employee -> Change own role DENY")
    void testEmployeeChangeOwnRole() {
        assertFalse(authorizationService.canChangeUserRole(empBranchAId, empBranchAId, SystemRole.BRANCH_MANAGER),
                "Employee MUST NOT change own role");
        assertFalse(authorizationService.canChangeUserRole(empBranchAId, empBranchAId, SystemRole.OWNER),
                "Employee MUST NOT change own role to Owner");
    }

    // ==========================================
    // 5. ORGANIZATIONAL CONSISTENCY Tests
    // ==========================================

    @Test
    @DisplayName("Consistency: Valid Branch + Department ALLOW")
    void testConsistencyValid() {
        assertDoesNotThrow(() -> authorizationService.validateBranchDepartmentConsistency(branchAId, dept1BranchAId),
                "Department 1 belongs to Branch A, should be valid");
    }

    @Test
    @DisplayName("Consistency: Department from Branch B with Branch A DENY")
    void testConsistencyInvalid() {
        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () ->
                authorizationService.validateBranchDepartmentConsistency(branchAId, dept3BranchBId)
        );
        assertTrue(ex.getReason().contains("لا ينتمي إلى الفرع المختار"), "Mismatched department must be rejected");
    }

    // ==========================================
    // 6. ACTIVITY LOG / HISTORY VISIBILITY Tests
    // ==========================================

    @Test
    @DisplayName("Activity History: Employee sees only own activity")
    void testEmployeeActivityHistoryVisibility() {
        assertTrue(authorizationService.canViewUserActivity(empBranchAId, empBranchAId), "Employee sees own activity");
        assertFalse(authorizationService.canViewUserActivity(empBranchAId, empBranchBId), "Employee cannot see other employee activity");
        assertFalse(authorizationService.canViewUserActivity(empBranchAId, dmDept1Id), "Employee cannot see DM activity");
        assertFalse(authorizationService.canViewUserActivity(empBranchAId, bmBranchAId), "Employee cannot see BM activity");
        assertFalse(authorizationService.canViewUserActivity(empBranchAId, ownerId), "Employee cannot see Owner activity");
    }

    @Test
    @DisplayName("Activity History: Department Manager sees own and managed employees' activity only")
    void testDepartmentManagerActivityHistoryVisibility() {
        assertTrue(authorizationService.canViewUserActivity(dmDept1Id, dmDept1Id), "DM sees own activity");
        assertTrue(authorizationService.canViewUserActivity(dmDept1Id, empBranchAId), "DM sees managed dept employee activity");
        assertFalse(authorizationService.canViewUserActivity(dmDept1Id, empBranchBId), "DM cannot see other branch/dept employee activity");
        assertFalse(authorizationService.canViewUserActivity(dmDept1Id, bmBranchAId), "DM cannot see BM activity");
        assertFalse(authorizationService.canViewUserActivity(dmDept1Id, ownerId), "DM cannot see Owner activity");
    }

    @Test
    @DisplayName("Activity History: Branch Manager sees own and branch users' activity only")
    void testBranchManagerActivityHistoryVisibility() {
        assertTrue(authorizationService.canViewUserActivity(bmBranchAId, bmBranchAId), "BM sees own activity");
        assertTrue(authorizationService.canViewUserActivity(bmBranchAId, dmDept1Id), "BM sees branch DM activity");
        assertTrue(authorizationService.canViewUserActivity(bmBranchAId, empBranchAId), "BM sees branch employee activity");
        assertFalse(authorizationService.canViewUserActivity(bmBranchAId, empBranchBId), "BM cannot see other branch employee activity");
        assertFalse(authorizationService.canViewUserActivity(bmBranchAId, ownerId), "BM cannot see Owner activity");
    }

    @Test
    @DisplayName("Activity History: Owner sees all users' activity")
    void testOwnerActivityHistoryVisibility() {
        assertTrue(authorizationService.canViewUserActivity(ownerId, ownerId), "Owner sees own activity");
        assertTrue(authorizationService.canViewUserActivity(ownerId, bmBranchAId), "Owner sees BM activity");
        assertTrue(authorizationService.canViewUserActivity(ownerId, dmDept1Id), "Owner sees DM activity");
        assertTrue(authorizationService.canViewUserActivity(ownerId, empBranchAId), "Owner sees employee Branch A activity");
        assertTrue(authorizationService.canViewUserActivity(ownerId, empBranchBId), "Owner sees employee Branch B activity");
    }
}
