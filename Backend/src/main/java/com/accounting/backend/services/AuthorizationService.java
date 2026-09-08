package com.accounting.backend.services;

import com.accounting.backend.entities.Branch;
import com.accounting.backend.entities.Company;
import com.accounting.backend.entities.Department;
import com.accounting.backend.entities.DepartmentManagerDepartment;
import com.accounting.backend.entities.EmployeeAssignment;
import com.accounting.backend.entities.Role;
import com.accounting.backend.entities.Task;
import com.accounting.backend.entities.User;
import com.accounting.backend.entities.UserRole;
import com.accounting.backend.enums.SystemRole;
import com.accounting.backend.repositories.BranchRepository;
import com.accounting.backend.repositories.DepartmentManagerDepartmentRepository;
import com.accounting.backend.repositories.DepartmentRepository;
import com.accounting.backend.repositories.EmployeeAssignmentRepository;
import com.accounting.backend.repositories.RoleRepository;
import com.accounting.backend.repositories.UserRepository;
import com.accounting.backend.repositories.UserRoleRepository;
import com.accounting.backend.security.JwtService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class AuthorizationService {

    @Autowired
    private JwtService jwtService;

    @Autowired
    private TokenCacheService tokenCacheService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserRoleRepository userRoleRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private EmployeeAssignmentRepository employeeAssignmentRepository;

    @Autowired
    private DepartmentRepository departmentRepository;

    @Autowired
    private BranchRepository branchRepository;

    @Autowired
    private DepartmentManagerDepartmentRepository departmentManagerDepartmentRepository;

    /**
     * Extracts and validates authenticated user from Bearer token.
     * Throws 401 UNAUTHORIZED if missing or invalid.
     */
    public User requireAuthenticatedUser(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication token required");
        }

        String token = authHeader.substring(7).trim();
        if (!jwtService.isTokenValid(token)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid or expired token");
        }

        Long userId;
        try {
            userId = jwtService.extractUserId(token);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Could not extract user from token");
        }

        if (userId == null || !tokenCacheService.isTokenValid(userId, token)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Session expired. Please log in again.");
        }

        return userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
    }

    /**
     * Resolves authenticated user safely without throwing (returns null if unauthenticated).
     */
    public User resolveUser(String authHeader) {
        try {
            return requireAuthenticatedUser(authHeader);
        } catch (Exception e) {
            return null;
        }
    }

    /**
     * Resolves the canonical SystemRole for a given user.
     */
    public SystemRole getUserRole(Long userId) {
        if (userId == null) return SystemRole.EMPLOYEE;
        List<UserRole> userRoles = userRoleRepository.findByUser_Id(userId);
        if (userRoles.isEmpty()) {
            return SystemRole.EMPLOYEE;
        }

        SystemRole highestRole = SystemRole.EMPLOYEE;
        for (UserRole ur : userRoles) {
            if (ur.getRole() != null) {
                SystemRole role = SystemRole.fromDbRole(ur.getRole().getName());
                if (role == SystemRole.OWNER) {
                    return SystemRole.OWNER;
                }
                if (role == SystemRole.BRANCH_MANAGER && highestRole != SystemRole.OWNER) {
                    highestRole = SystemRole.BRANCH_MANAGER;
                } else if (role == SystemRole.DEPARTMENT_MANAGER && highestRole == SystemRole.EMPLOYEE) {
                    highestRole = SystemRole.DEPARTMENT_MANAGER;
                }
            }
        }
        return highestRole;
    }

    public boolean isOwner(Long userId) {
        return getUserRole(userId) == SystemRole.OWNER;
    }

    public boolean isBranchManager(Long userId) {
        return getUserRole(userId) == SystemRole.BRANCH_MANAGER;
    }

    public boolean isDepartmentManager(Long userId) {
        return getUserRole(userId) == SystemRole.DEPARTMENT_MANAGER;
    }

    public boolean isEmployee(Long userId) {
        return getUserRole(userId) == SystemRole.EMPLOYEE;
    }

    /**
     * Resolves user's primary assigned branch ID.
     */
    public Long getUserBranchId(Long userId) {
        if (userId == null) return null;
        List<EmployeeAssignment> assignments = employeeAssignmentRepository.findByUser_Id(userId);
        if (assignments.isEmpty()) return null;

        return assignments.stream()
                .filter(a -> Boolean.TRUE.equals(a.getIsPrimary()) && a.getBranch() != null)
                .findFirst()
                .map(a -> a.getBranch().getId())
                .orElseGet(() -> assignments.get(0).getBranch() != null ? assignments.get(0).getBranch().getId() : null);
    }

    /**
     * Resolves user's primary assigned department ID.
     */
    public Long getUserDepartmentId(Long userId) {
        if (userId == null) return null;
        List<EmployeeAssignment> assignments = employeeAssignmentRepository.findByUser_Id(userId);
        if (assignments.isEmpty()) return null;

        return assignments.stream()
                .filter(a -> Boolean.TRUE.equals(a.getIsPrimary()) && a.getDepartment() != null)
                .findFirst()
                .map(a -> a.getDepartment().getId())
                .orElseGet(() -> assignments.get(0).getDepartment() != null ? assignments.get(0).getDepartment().getId() : null);
    }

    /**
     * Returns all department IDs managed by a Department Manager.
     */
    public List<Long> getManagedDepartmentIds(Long userId) {
        List<Long> deptIds = new ArrayList<>();
        if (userId == null) return deptIds;

        List<DepartmentManagerDepartment> managed = departmentManagerDepartmentRepository.findById_ManagerId(userId);
        for (DepartmentManagerDepartment dmd : managed) {
            if (dmd.getDepartment() != null) {
                deptIds.add(dmd.getDepartment().getId());
            }
        }

        // Include primary department if not already present
        Long primaryDeptId = getUserDepartmentId(userId);
        if (primaryDeptId != null && !deptIds.contains(primaryDeptId)) {
            deptIds.add(primaryDeptId);
        }
        return deptIds;
    }

    /**
     * Checks if caller has access to a specific branch.
     */
    public boolean hasBranchAccess(Long callerId, Long branchId) {
        if (callerId == null || branchId == null) return false;
        if (isOwner(callerId)) return true;
        if (isBranchManager(callerId)) {
            Long callerBranch = getUserBranchId(callerId);
            return callerBranch != null && callerBranch.equals(branchId);
        }
        return false;
    }

    /**
     * Checks if caller has access to a specific department.
     */
    public boolean hasDepartmentAccess(Long callerId, Long departmentId) {
        if (callerId == null || departmentId == null) return false;
        if (isOwner(callerId)) return true;

        if (isBranchManager(callerId)) {
            Optional<Department> dept = departmentRepository.findById(departmentId);
            if (dept.isPresent() && dept.get().getBranch() != null) {
                Long callerBranch = getUserBranchId(callerId);
                return callerBranch != null && callerBranch.equals(dept.get().getBranch().getId());
            }
            return false;
        }

        if (isDepartmentManager(callerId)) {
            return getManagedDepartmentIds(callerId).contains(departmentId);
        }

        return false;
    }

    /**
     * Determines whether the caller can view target user's profile/data.
     */
    public boolean canViewUser(Long callerId, Long targetUserId) {
        if (callerId == null || targetUserId == null) return false;
        if (callerId.equals(targetUserId)) return true;
        if (isOwner(callerId)) return true;

        // Subordinate roles (Branch Managers, Department Managers, Employees) can NEVER view Owner accounts
        if (isOwner(targetUserId)) {
            return false;
        }

        if (isBranchManager(callerId)) {
            Long callerBranch = getUserBranchId(callerId);
            Long targetBranch = getUserBranchId(targetUserId);
            return callerBranch != null && callerBranch.equals(targetBranch);
        }

        if (isDepartmentManager(callerId)) {
            Long targetDept = getUserDepartmentId(targetUserId);
            return targetDept != null && getManagedDepartmentIds(callerId).contains(targetDept);
        }

        return false;
    }

    /**
     * Determines whether the caller can view target user's activity log / history.
     * Rules:
     * - Every user can view their own activity logs.
     * - Owner can view all users' activity logs.
     * - Subordinates (BM, DM, Employee) can NEVER view Owner's activity logs.
     * - Branch Manager can view activity logs of all users (DMs, employees) within their own branch.
     * - Department Manager can view activity logs of employees within their managed departments.
     *   (DM cannot view Branch Manager or other Department Managers).
     * - Employee can ONLY view their own activity logs.
     */
    public boolean canViewUserActivity(Long callerId, Long targetUserId) {
        if (callerId == null || targetUserId == null) return false;
        if (callerId.equals(targetUserId)) return true;
        if (isOwner(callerId)) return true;

        // Subordinate roles can NEVER view Owner activity logs
        if (isOwner(targetUserId)) {
            return false;
        }

        SystemRole callerRole = getUserRole(callerId);

        if (callerRole == SystemRole.BRANCH_MANAGER) {
            // BM cannot view other BMs
            if (isBranchManager(targetUserId)) {
                return false;
            }
            Long callerBranch = getUserBranchId(callerId);
            Long targetBranch = getUserBranchId(targetUserId);
            return callerBranch != null && callerBranch.equals(targetBranch);
        }

        if (callerRole == SystemRole.DEPARTMENT_MANAGER) {
            // DM cannot view BMs or other DMs (only employees under them)
            if (isBranchManager(targetUserId) || isDepartmentManager(targetUserId)) {
                return false;
            }
            Long targetDept = getUserDepartmentId(targetUserId);
            return targetDept != null && getManagedDepartmentIds(callerId).contains(targetDept);
        }

        return false;
    }

    /**
     * Determines whether the caller can manage (update/delete) target user.
     */
    public boolean canManageUser(Long callerId, Long targetUserId) {
        if (callerId == null || targetUserId == null) return false;
        if (callerId.equals(targetUserId)) return false; // Self-management of role/assignment not allowed
        if (isOwner(callerId)) return true;

        if (isBranchManager(callerId)) {
            // Cannot manage owner
            if (isOwner(targetUserId)) return false;
            Long callerBranch = getUserBranchId(callerId);
            Long targetBranch = getUserBranchId(targetUserId);
            return callerBranch != null && callerBranch.equals(targetBranch);
        }

        if (isDepartmentManager(callerId)) {
            // Can only manage employees in their managed departments
            if (isOwner(targetUserId) || isBranchManager(targetUserId) || isDepartmentManager(targetUserId)) {
                return false;
            }
            Long targetDept = getUserDepartmentId(targetUserId);
            return targetDept != null && getManagedDepartmentIds(callerId).contains(targetDept);
        }

        return false;
    }

    /**
     * Determines whether caller can assign newRole to target user.
     */
    public boolean canChangeUserRole(Long callerId, Long targetUserId, SystemRole newRole) {
        if (callerId == null || targetUserId == null || newRole == null) return false;

        // ONLY Owner can grant OWNER role!
        if (newRole == SystemRole.OWNER) {
            return isOwner(callerId);
        }

        if (isOwner(callerId)) return true;

        if (isBranchManager(callerId)) {
            // Target must belong to caller's branch and target cannot be an existing OWNER
            if (isOwner(targetUserId)) return false;
            Long callerBranch = getUserBranchId(callerId);
            Long targetBranch = getUserBranchId(targetUserId);
            return callerBranch != null && callerBranch.equals(targetBranch);
        }

        return false;
    }

    /**
     * Checks if caller can edit their own profile personal data.
     */
    public boolean canEditOwnProfile(Long callerId, Long targetUserId) {
        return callerId != null && callerId.equals(targetUserId);
    }

    /**
     * Validates that Department belongs to Branch.
     * Prevents invalid assignments like Department in Branch B assigned with Branch A.
     */
    public void validateBranchDepartmentConsistency(Long branchId, Long departmentId) {
        if (branchId == null || departmentId == null) {
            return;
        }
        Department dept = departmentRepository.findById(departmentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "القسم المحدد غير موجود"));

        Branch branch = branchRepository.findById(branchId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "الفرع المحدد غير موجود"));

        if (dept.getBranch() == null || !dept.getBranch().getId().equals(branch.getId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "القسم المحدد لا ينتمي إلى الفرع المختار");
        }
    }

    // =========================================================================
    // Company Authorization & Scope
    // =========================================================================

    /**
     * Determines if caller can view a Company.
     * - OWNER: all companies
     * - BRANCH_MANAGER: companies in own branch
     * - DEPARTMENT_MANAGER: companies in authorized departments
     * - EMPLOYEE: companies in own branch
     */
    public boolean canViewCompany(Long callerId, Company company) {
        if (callerId == null || company == null) return false;
        if (isOwner(callerId)) return true;

        // Legacy companies without branch are visible
        if (company.getBranch() == null) return true;

        Long callerBranch = getUserBranchId(callerId);

        if (isBranchManager(callerId) || isEmployee(callerId)) {
            return callerBranch != null && callerBranch.equals(company.getBranch().getId());
        }

        if (isDepartmentManager(callerId)) {
            if (company.getDepartment() != null) {
                return getManagedDepartmentIds(callerId).contains(company.getDepartment().getId());
            }
            return callerBranch != null && callerBranch.equals(company.getBranch().getId());
        }

        return false;
    }

    /**
     * Determines if caller can manage (edit/delete) a Company.
     * - OWNER: global
     * - BRANCH_MANAGER: inside own branch
     * - DEPARTMENT_MANAGER: inside authorized departments
     * - EMPLOYEE: cannot edit or delete (false)
     */
    public boolean canManageCompany(Long callerId, Company company) {
        if (callerId == null || company == null) return false;
        if (isOwner(callerId)) return true;
        if (isEmployee(callerId)) return false;

        if (company.getBranch() == null) {
            return isOwner(callerId);
        }

        Long callerBranch = getUserBranchId(callerId);

        if (isBranchManager(callerId)) {
            return callerBranch != null && callerBranch.equals(company.getBranch().getId());
        }

        if (isDepartmentManager(callerId)) {
            return company.getDepartment() != null && getManagedDepartmentIds(callerId).contains(company.getDepartment().getId());
        }

        return false;
    }

    /**
     * Determines if caller can create a Company for the given branch and department.
     * - OWNER: any branch and department
     * - BRANCH_MANAGER: inside own branch
     * - DEPARTMENT_MANAGER: inside authorized departments
     * - EMPLOYEE: cannot create companies
     */
    public boolean canCreateCompany(Long callerId, Long branchId, Long departmentId) {
        if (callerId == null) return false;
        if (isOwner(callerId)) return true;
        if (isEmployee(callerId)) return false;

        if (isBranchManager(callerId)) {
            Long callerBranch = getUserBranchId(callerId);
            return callerBranch != null && callerBranch.equals(branchId);
        }

        if (isDepartmentManager(callerId)) {
            return departmentId != null && getManagedDepartmentIds(callerId).contains(departmentId);
        }

        return false;
    }

    // =========================================================================
    // Task Authorization & Scope
    // =========================================================================

    /**
     * Determines if caller can assign a task to targetEmployeeId.
     * - OWNER: can assign tasks cross-branch (to any employee)
     * - BRANCH_MANAGER: only to employees in own branch
     * - DEPARTMENT_MANAGER: only to employees in managed departments
     * - EMPLOYEE: cannot create tasks
     */
    public boolean canAssignTask(Long callerId, Long targetEmployeeId) {
        if (callerId == null || targetEmployeeId == null) return false;
        if (isEmployee(callerId)) return false;
        // Non-owners can never assign tasks to the Owner
        if (!isOwner(callerId) && isOwner(targetEmployeeId)) return false;
        if (isOwner(callerId)) return true;

        if (isBranchManager(callerId)) {
            Long callerBranch = getUserBranchId(callerId);
            Long targetBranch = getUserBranchId(targetEmployeeId);
            return callerBranch != null && callerBranch.equals(targetBranch);
        }

        if (isDepartmentManager(callerId)) {
            Long targetDept = getUserDepartmentId(targetEmployeeId);
            return targetDept != null && getManagedDepartmentIds(callerId).contains(targetDept);
        }

        return false;
    }

    /**
     * Validates task assignment targets and role scope:
     * - Department must belong to Branch (validateBranchDepartmentConsistency).
     * - Employee must belong to Branch.
     * - Employee must belong to Department.
     * - Caller role scope enforcement:
     *   - OWNER: can assign across any branch/department to any employee.
     *   - BRANCH_MANAGER: can only assign in own branch, to employees in own branch.
     *   - DEPARTMENT_MANAGER: can only assign in managed departments, to employees in managed departments.
     *   - EMPLOYEE: cannot assign tasks.
     *   - Non-owners cannot assign to Owner.
     */
    public void validateTaskAssignment(Long callerId, Long branchId, Long departmentId, Long assignedToId) {
        if (assignedToId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "الموظف المسؤول عن المهمة مطلوب");
        }

        User assignedUser = userRepository.findById(assignedToId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "الموظف المحدد غير موجود"));

        Long empBranch = getUserBranchId(assignedToId);
        Long empDept = getUserDepartmentId(assignedToId);

        if (branchId != null && departmentId != null) {
            validateBranchDepartmentConsistency(branchId, departmentId);
        }

        if (branchId != null) {
            if (empBranch == null || !branchId.equals(empBranch)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "الموظف المحدد لا ينتمي إلى الفرع المختار");
            }
        }

        if (departmentId != null) {
            if (empDept == null || !departmentId.equals(empDept)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "الموظف المحدد لا ينتمي إلى القسم المختار");
            }
        }

        if (callerId != null) {
            SystemRole callerRole = getUserRole(callerId);

            if (callerRole == SystemRole.EMPLOYEE) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "غير مصرح للموظف بإنشاء أو تعيين مهام");
            }

            if (callerRole != SystemRole.OWNER && isOwner(assignedToId)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "لا يمكن تعيين مهمة للمالك");
            }

            if (callerRole == SystemRole.BRANCH_MANAGER) {
                Long callerBranch = getUserBranchId(callerId);
                if (branchId != null && !branchId.equals(callerBranch)) {
                    throw new ResponseStatusException(HttpStatus.FORBIDDEN, "لا يمكن لمدير الفرع إنشاء مهمة في فرع آخر");
                }
                if (empBranch != null && !empBranch.equals(callerBranch)) {
                    throw new ResponseStatusException(HttpStatus.FORBIDDEN, "لا يمكن لمدير الفرع تعيين مهمة لموظف خارج فرعه");
                }
            }

            if (callerRole == SystemRole.DEPARTMENT_MANAGER) {
                List<Long> managedDepts = getManagedDepartmentIds(callerId);
                if (departmentId != null && !managedDepts.contains(departmentId)) {
                    throw new ResponseStatusException(HttpStatus.FORBIDDEN, "لا يمكن لمدير القسم إنشاء مهمة خارج الأقسام التي يديرها");
                }
                if (empDept != null && !managedDepts.contains(empDept)) {
                    throw new ResponseStatusException(HttpStatus.FORBIDDEN, "لا يمكن لمدير القسم تعيين مهمة لموظف خارج الأقسام التي يديرها");
                }
            }
        }
    }

    /**
     * ONLY the task creator can edit a task.
     */
    public boolean canEditTask(Long callerId, Task task) {
        if (callerId == null || task == null || task.getCreatedBy() == null) return false;
        return callerId.equals(task.getCreatedBy().getId());
    }

    /**
     * Attachment access follows task participation: managers, the creator,
     * and the assigned employee may add or remove task attachments.
     */
    public boolean canModifyTaskAttachments(Long callerId, Task task) {
        if (callerId == null || task == null) return false;
        if (isOwner(callerId) || isBranchManager(callerId) || isDepartmentManager(callerId)) return true;
        if (task.getCreatedBy() != null && callerId.equals(task.getCreatedBy().getId())) return true;
        return task.getAssignedTo() != null && callerId.equals(task.getAssignedTo().getId());
    }

    /**
     * ONLY the task creator can delete a task.
     */
    public boolean canDeleteTask(Long callerId, Task task) {
        if (callerId == null || task == null || task.getCreatedBy() == null) return false;
        return callerId.equals(task.getCreatedBy().getId());
    }

    /**
     * ONLY the assigned employee can change task status.
     */
    public boolean canChangeTaskStatus(Long callerId, Task task) {
        if (callerId == null || task == null || task.getAssignedTo() == null) return false;
        return callerId.equals(task.getAssignedTo().getId());
    }

    /**
     * Determines if caller can view a task.
     */
    public boolean canViewTask(Long callerId, Task task) {
        if (callerId == null || task == null) return false;
        if (isOwner(callerId)) return true;

        if (task.getAssignedTo() != null && callerId.equals(task.getAssignedTo().getId())) return true;
        if (task.getCreatedBy() != null && callerId.equals(task.getCreatedBy().getId())) return true;

        if (isBranchManager(callerId)) {
            Long callerBranch = getUserBranchId(callerId);
            Long assignedBranch = task.getAssignedTo() != null ? getUserBranchId(task.getAssignedTo().getId()) : null;
            Long creatorBranch = task.getCreatedBy() != null ? getUserBranchId(task.getCreatedBy().getId()) : null;
            return callerBranch != null && (callerBranch.equals(assignedBranch) || callerBranch.equals(creatorBranch));
        }

        if (isDepartmentManager(callerId)) {
            List<Long> managed = getManagedDepartmentIds(callerId);
            Long assignedDept = task.getAssignedTo() != null ? getUserDepartmentId(task.getAssignedTo().getId()) : null;
            return assignedDept != null && managed.contains(assignedDept);
        }

        return false;
    }
}
