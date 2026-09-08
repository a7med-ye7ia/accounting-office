package com.accounting.backend.dtos;

import com.accounting.backend.entities.User;
import java.time.LocalDate;
import java.util.List;

/**
 * DTO for User (safe to return to frontend - no password)
 */
public class UserDto {
    private Long id;
    private String fullName;
    private String email;
    private String phone;
    private String nationalId;
    private String status;
    private LocalDate hireDate;
    private String roleName;
    private String canonicalRole;
    private Long branchId;
    private String branchName;
    private Long departmentId;
    private String departmentName;
    private List<Long> managedDepartmentIds;

    public UserDto() {}

    public UserDto(User user) {
        this.id = user.getId();
        this.fullName = user.getFullName();
        this.email = user.getEmail();
        this.phone = user.getPhone();
        this.nationalId = user.getNationalId();
        this.status = user.getStatus() != null ? user.getStatus().toString() : "ACTIVE";
        this.hireDate = user.getHireDate();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getNationalId() {
        return nationalId;
    }

    public void setNationalId(String nationalId) {
        this.nationalId = nationalId;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDate getHireDate() {
        return hireDate;
    }

    public void setHireDate(LocalDate hireDate) {
        this.hireDate = hireDate;
    }

    public String getRoleName() {
        return roleName;
    }

    public void setRoleName(String roleName) {
        this.roleName = roleName;
    }

    public String getCanonicalRole() {
        return canonicalRole;
    }

    public void setCanonicalRole(String canonicalRole) {
        this.canonicalRole = canonicalRole;
    }

    public Long getBranchId() {
        return branchId;
    }

    public void setBranchId(Long branchId) {
        this.branchId = branchId;
    }

    public String getBranchName() {
        return branchName;
    }

    public void setBranchName(String branchName) {
        this.branchName = branchName;
    }

    public Long getDepartmentId() {
        return departmentId;
    }

    public void setDepartmentId(Long departmentId) {
        this.departmentId = departmentId;
    }

    public String getDepartmentName() {
        return departmentName;
    }

    public void setDepartmentName(String departmentName) {
        this.departmentName = departmentName;
    }

    public List<Long> getManagedDepartmentIds() {
        return managedDepartmentIds;
    }

    public void setManagedDepartmentIds(List<Long> managedDepartmentIds) {
        this.managedDepartmentIds = managedDepartmentIds;
    }
}
