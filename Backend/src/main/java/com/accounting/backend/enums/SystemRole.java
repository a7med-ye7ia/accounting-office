package com.accounting.backend.enums;

public enum SystemRole {
    OWNER("owner"),
    BRANCH_MANAGER("headBranch"),
    DEPARTMENT_MANAGER("headDepartment"),
    EMPLOYEE("employee");

    private final String dbRoleName;

    SystemRole(String dbRoleName) {
        this.dbRoleName = dbRoleName;
    }

    public String getDbRoleName() {
        return dbRoleName;
    }

    /**
     * Map database role name (or frontend/canonical string) to canonical SystemRole.
     */
    public static SystemRole fromDbRole(String name) {
        if (name == null || name.isBlank()) {
            return null;
        }
        String trimmed = name.trim();
        if ("owner".equalsIgnoreCase(trimmed)) {
            return OWNER;
        }
        if ("headBranch".equalsIgnoreCase(trimmed) || "branch_manager".equalsIgnoreCase(trimmed) 
                || "branchManager".equalsIgnoreCase(trimmed) || "head_branch".equalsIgnoreCase(trimmed)) {
            return BRANCH_MANAGER;
        }
        if ("headDepartment".equalsIgnoreCase(trimmed) || "department_manager".equalsIgnoreCase(trimmed) 
                || "departmentManager".equalsIgnoreCase(trimmed) || "head_department".equalsIgnoreCase(trimmed)
                || "manager".equalsIgnoreCase(trimmed)) {
            return DEPARTMENT_MANAGER;
        }
        if ("employee".equalsIgnoreCase(trimmed)) {
            return EMPLOYEE;
        }

        // Fallback matching enum name
        for (SystemRole role : values()) {
            if (role.name().equalsIgnoreCase(trimmed)) {
                return role;
            }
        }
        return EMPLOYEE;
    }

    public boolean isOwner() {
        return this == OWNER;
    }

    public boolean isBranchManager() {
        return this == BRANCH_MANAGER;
    }

    public boolean isDepartmentManager() {
        return this == DEPARTMENT_MANAGER;
    }

    public boolean isEmployee() {
        return this == EMPLOYEE;
    }
}
