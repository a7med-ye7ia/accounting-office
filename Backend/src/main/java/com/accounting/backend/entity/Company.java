package com.accounting.backend.entity;

import java.util.List;

public class Company {
  private String id;
  private String name;
  private String icon;
  private String description;
  private List<Contract> establishmentContracts;
  private List<Contract> amendmentContracts;
  public Company(String id, String name, String icon, String description, List<Contract> establishmentContracts,
      List<Contract> amendmentContracts) {
    this.id = id;
    this.name = name;
    this.icon = icon;
    this.description = description;
    this.establishmentContracts = establishmentContracts;
    this.amendmentContracts = amendmentContracts;
  }
  public Company() {
  }
  public String getId() {
    return id;
  }
  public String getName() {
    return name;
  }
  public String getIcon() {
    return icon;
  }
  public String getDescription() {
    return description;
  }
  public List<Contract> getEstablishmentContracts() {
    return establishmentContracts;
  }
  public List<Contract> getAmendmentContracts() {
    return amendmentContracts;
  }
  public void setId(String id) {
    this.id = id;
  }
  public void setName(String name) {
    this.name = name;
  }
  public void setIcon(String icon) {
    this.icon = icon;
  }
  public void setDescription(String description) {
    this.description = description;
  }
  public void setEstablishmentContracts(List<Contract> establishmentContracts) {
    this.establishmentContracts = establishmentContracts;
  }
  public void setAmendmentContracts(List<Contract> amendmentContracts) {
    this.amendmentContracts = amendmentContracts;
  }

  public void addAmendmentContract(Contract contract) {
    this.amendmentContracts.add(contract);
  }
  @Override
  public String toString() {
    return "Company [id=" + id + ", name=" + name + ", icon=" + icon + ", description=" + description
        + ", establishmentContracts=" + establishmentContracts + ", amendmentContracts=" + amendmentContracts + "]";
  }
}
