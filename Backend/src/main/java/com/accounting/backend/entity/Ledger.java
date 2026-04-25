package com.accounting.backend.entity;

public class Ledger {
  private String id;
  private String company;
  private String department;
  private String amount;
  private String currency;
  private String status;
  private String postedAt;

  public Ledger(String id, String company, String department, String amount, String currency, String status,
      String postedAt) {
    this.id = id;
    this.company = company;
    this.department = department;
    this.amount = amount;
    this.currency = currency;
    this.status = status;
    this.postedAt = postedAt;
  }

  public Ledger() {
  }

  public String getId() {
    return id;
  }

  public void setId(String id) {
    this.id = id;
  }

  public String getCompany() {
    return company;
  }

  public void setCompany(String company) {
    this.company = company;
  }

  public String getDepartment() {
    return department;
  }

  public void setDepartment(String department) {
    this.department = department;
  }

  public String getAmount() {
    return amount;
  }

  public void setAmount(String amount) {
    this.amount = amount;
  }

  public String getCurrency() {
    return currency;
  }

  public void setCurrency(String currency) {
    this.currency = currency;
  }

  public String getStatus() {
    return status;
  }

  public void setStatus(String status) {
    this.status = status;
  }

  public String getPostedAt() {
    return postedAt;
  }

  public void setPostedAt(String postedAt) {
    this.postedAt = postedAt;
  }
}
