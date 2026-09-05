package com.accounting.backend.entities;

import jakarta.persistence.*;

@Entity
@Table(name = "department_manager_departments")
public class DepartmentManagerDepartment {

    @EmbeddedId
    private DepartmentManagerDepartmentId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("managerId")
    @JoinColumn(name = "manager_id", nullable = false)
    private User manager;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("departmentId")
    @JoinColumn(name = "department_id", nullable = false)
    private Department department;

    public DepartmentManagerDepartment() {}

    public DepartmentManagerDepartment(User manager, Department department) {
        this.manager = manager;
        this.department = department;
        this.id = new DepartmentManagerDepartmentId(manager.getId(), department.getId());
    }

    public DepartmentManagerDepartmentId getId() {
        return id;
    }

    public void setId(DepartmentManagerDepartmentId id) {
        this.id = id;
    }

    public User getManager() {
        return manager;
    }

    public void setManager(User manager) {
        this.manager = manager;
    }

    public Department getDepartment() {
        return department;
    }

    public void setDepartment(Department department) {
        this.department = department;
    }
}
