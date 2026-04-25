package com.accounting.backend.entity;

public class Employee {
  String id;
  String name;
  String role;
  String dept;
  String hireDate;
  String status;
  String avatar;
  String email;
  String phone;
  
  public Employee(String id, String name, String role, String dept, String hireDate, String status, String avatar,
      String email, String phone) {
    this.id = id;
    this.name = name;
    this.role = role;
    this.dept = dept;
    this.hireDate = hireDate;
    this.status = status;
    this.avatar = avatar;
    this.email = email;
    this.phone = phone;
  }

  public Employee() {
  }

  public String getId() {
    return id;
  }

  public String getName() {
    return name;
  }

  public String getRole() {
    return role;
  }

  public String getDept() {
    return dept;
  }

  public String getHireDate() {
    return hireDate;
  }

  public String getStatus() {
    return status;
  }

  public String getAvatar() {
    return avatar;
  }

  public String getEmail() {
    return email;
  }

  public String getPhone() {
    return phone;
  }

  public void setId(String id) {
    this.id = id;
  }

  public void setName(String name) {
    this.name = name;
  }

  public void setRole(String role) {
    this.role = role;
  }

  public void setDept(String dept) {
    this.dept = dept;
  }

  public void setHireDate(String hireDate) {
    this.hireDate = hireDate;
  }

  public void setStatus(String status) {
    this.status = status;
  }

  public void setAvatar(String avatar) {
    this.avatar = avatar;
  }

  public void setEmail(String email) {
    this.email = email;
  }

  public void setPhone(String phone) {
    this.phone = phone;
  }

  @Override
  public String toString() {
    return "Employee [id=" + id + ", name=" + name + ", role=" + role + ", dept=" + dept + ", hireDate=" + hireDate
        + ", status=" + status + ", avatar=" + avatar + ", email=" + email + ", phone=" + phone + "]";
  }
}
