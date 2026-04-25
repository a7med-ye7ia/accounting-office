package com.accounting.backend.entity;

public class Department {
  private Long id;
  private String name;
  private String head;
  private Integer staff;
  private Double budget;
  private Double used;
  private String status;
  
  public Department(Long id, String name, String head, Integer staff, Double budget, Double used, String status) {
    this.id = id;
    this.name = name;
    this.head = head;
    this.staff = staff;
    this.budget = budget;
    this.used = used;
    this.status = status;
  }

  public Department() {
  }

  public Long getId() {
    return id;
  }

  public String getName() {
    return name;
  }

  public String getHead() {
    return head;
  }

  public Integer getStaff() {
    return staff;
  }

  public Double getBudget() {
    return budget;
  }

  public Double getUsed() {
    return used;
  }

  public void setId(Long id) {
    this.id = id;
  }

  public void setName(String name) {
    this.name = name;
  }

  public void setHead(String head) {
    this.head = head;
  }

  public void setStaff(Integer staff) {
    this.staff = staff;
  }

  public void setBudget(Double budget) {
    this.budget = budget;
  }

  public void setUsed(Double used) {
    this.used = used;
  }

  public String getStatus() {
    return status;
  }

  public void setStatus(String status) {
    this.status = status;
  }

  @Override
  public String toString() {
    return "Department [id=" + id + ", name=" + name + ", head=" + head + ", staff=" + staff + ", budget=" + budget
        + ", used=" + used + ", status=" + status + "]";
  }
}