package com.accounting.backend.entity;

public class Contract {
  String id;
  String name;
  String date;
  public Contract(String id, String name, String date) {
    this.id = id;
    this.name = name;
    this.date = date;
  }
  public Contract() {
  }
  public String getId() {
    return id;
  }
  public String getName() {
    return name;
  }
  public String getDate() {
    return date;
  }
  public void setId(String id) {
    this.id = id;
  }
  public void setName(String name) {
    this.name = name;
  }
  public void setDate(String date) {
    this.date = date;
  }
  @Override
  public String toString() {
    return "Contract [id=" + id + ", name=" + name + ", date=" + date + "]";
  }

}
