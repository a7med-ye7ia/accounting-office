package com.accounting.backend.dtos;

import java.time.LocalDate;

public class EmployeeCreationRequest {
    private String fullName;
    private String email;
    private String phone;
    private String nationalId;
    private String password;
    private String status;
    private LocalDate hireDate;

    private Long departmentId;
    private Long branchId;

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }  
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getNationalId() { return nationalId; }
    public void setNationalId(String nationalId) { this.nationalId = nationalId; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public LocalDate getHireDate() { return hireDate; }
    public void setHireDate(LocalDate hireDate) { this.hireDate = hireDate; }
    public Long getDepartmentId() { return departmentId; }
    public void setDepartmentId(Long departmentId) { this.departmentId = departmentId; }
    public Long getBranchId() { return branchId; }
    public void setBranchId(Long branchId) { this.branchId = branchId; }

}