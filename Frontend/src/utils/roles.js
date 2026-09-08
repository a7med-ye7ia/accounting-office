export const ROLES = {
  OWNER: 'OWNER',
  BRANCH_MANAGER: 'BRANCH_MANAGER',
  DEPARTMENT_MANAGER: 'DEPARTMENT_MANAGER',
  EMPLOYEE: 'EMPLOYEE',
};

/**
 * Normalizes any role representation (canonical or legacy database string)
 * to the canonical role: OWNER, BRANCH_MANAGER, DEPARTMENT_MANAGER, or EMPLOYEE.
 */
export function getCanonicalRole(userOrRoleName) {
  if (!userOrRoleName) return ROLES.EMPLOYEE;
  
  let roleStr = '';
  if (typeof userOrRoleName === 'object') {
    roleStr = userOrRoleName.canonicalRole || userOrRoleName.roleName || '';
  } else {
    roleStr = String(userOrRoleName);
  }

  const lower = roleStr.trim().toLowerCase();
  if (lower === 'owner') return ROLES.OWNER;
  if (lower === 'headbranch' || lower === 'branch_manager' || lower === 'branchmanager' || lower === 'head_branch') {
    return ROLES.BRANCH_MANAGER;
  }
  if (lower === 'headdepartment' || lower === 'department_manager' || lower === 'departmentmanager' || lower === 'head_department' || lower === 'manager') {
    return ROLES.DEPARTMENT_MANAGER;
  }
  if (lower === 'employee') {
    return ROLES.EMPLOYEE;
  }

  const upper = roleStr.trim().toUpperCase();
  if (Object.values(ROLES).includes(upper)) {
    return upper;
  }

  return ROLES.EMPLOYEE;
}

export function isOwner(user) {
  return getCanonicalRole(user) === ROLES.OWNER;
}

export function isBranchManager(user) {
  return getCanonicalRole(user) === ROLES.BRANCH_MANAGER;
}

export function isDepartmentManager(user) {
  return getCanonicalRole(user) === ROLES.DEPARTMENT_MANAGER;
}

export function isEmployee(user) {
  return getCanonicalRole(user) === ROLES.EMPLOYEE;
}

export function canManageEmployees(user) {
  const role = getCanonicalRole(user);
  return role === ROLES.OWNER || role === ROLES.BRANCH_MANAGER || role === ROLES.DEPARTMENT_MANAGER;
}

export function canManageDepartments(user) {
  const role = getCanonicalRole(user);
  return role === ROLES.OWNER || role === ROLES.BRANCH_MANAGER;
}

export function canCreateCompany(user) {
  const role = getCanonicalRole(user);
  return role === ROLES.OWNER || role === ROLES.BRANCH_MANAGER || role === ROLES.DEPARTMENT_MANAGER;
}

export function canManageCompany(user) {
  const role = getCanonicalRole(user);
  return role === ROLES.OWNER || role === ROLES.BRANCH_MANAGER || role === ROLES.DEPARTMENT_MANAGER;
}

export function canCreateTask(user) {
  const role = getCanonicalRole(user);
  return role === ROLES.OWNER || role === ROLES.BRANCH_MANAGER || role === ROLES.DEPARTMENT_MANAGER;
}

export function canEditTask(user, task) {
  if (!user || !task) return false;
  return task.createdById === user.id;
}

export function canDeleteTask(user, task) {
  if (!user || !task) return false;
  return task.createdById === user.id;
}

export function canChangeTaskStatus(user, task) {
  if (!user || !task) return false;
  return task.assignedToId === user.id;
}
