package com.accounting.backend.controller;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.accounting.backend.entity.Employee;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:5173")
public class EmployeeController {
  List<Employee> employees = new ArrayList<>(Arrays.asList(
    new Employee("0", "Mo.Anwar",       "CEO",  "Every thing",  "0-0-0", "Great",     "Mo",  "m@gmail.com",   "+1 555-0110" ),
    new Employee("1", "أليكس كارتر",      "مهندس رئيسي",     "الهندسة",     "2021-03-15", "نشط",     "AC",  "alex@corp.io",    "+1 555-0101" ),
    new Employee("2", "سارة بنعلي",      "مدير تجربة المستخدم", "تصميم المنتج", "2020-07-01", "نشط",     "SB",  "sara@corp.io",    "+1 555-0102" ),
    new Employee("3", "جيمس أوكافور",     "مدير مالي تنفيذي",   "المالية",     "2019-01-20", "نشط",     "JO",  "james@corp.io",   "+1 555-0103" ),
    new Employee("4", "ناديا السيد",     "مدير الموارد البشرية", "الموارد البشرية", "2022-05-10", "نشط",     "NE",  "nadia@corp.io",   "+1 555-0104" ),
    new Employee("5", "كريس يوين",       "مسؤول التسويق",    "التسويق",       "2021-11-03", "في إجازة",   "CY",  "chris@corp.io",   "+1 555-0105" ),
    new Employee("6", "فاطمة الراشد",    "مستشار قانوني أول", "الشؤون القانونية", "2020-09-14", "نشط",     "FA",  "fatima@corp.io",  "+1 555-0106" ),
    new Employee("7", "لوكاس فيريرا",    "مهندس واجهات أمامية", "الهندسة",     "2023-02-28", "نشط",     "LF",  "lucas@corp.io",   "+1 555-0107" ),
    new Employee("8", "ميي تشانغ",        "محلل بيانات",      "المالية",     "2022-08-19", "نشط",     "MZ",  "mei@corp.io",     "+1 555-0108" ),
    new Employee("9", "عمر بكر",        "مهندس خلفية",      "الهندسة",     "2023-06-01", "منتهي العقد", "OB",  "omar@corp.io",    "+1 555-0109" ),
    new Employee("10", "بريا ناير",       "مصمم منتج",        "تصميم المنتج",  "2021-12-15", "نشط",     "PN",  "priya@corp.io",   "+1 555-0110" )
  ));

  @GetMapping("/employees")
  public List<Employee> getEmployees() {
    return employees;
  }


  // ! change to make it return response entity with status code and error handling
  @PostMapping("/employees")
  public Employee addEmployee(@RequestBody Employee employee) {
    employees.add(employee);
    return employee;
  }
  
  // ! change to make it return response entity with status code and error handling
  @DeleteMapping("/employees/{id}")
  public Boolean deleteEmployee(@PathVariable String id) {
    return employees.removeIf(e -> e.getId().equals(id));
  }

  @GetMapping("/employees/{id}")
  public Employee getEmployeeById(@PathVariable String id) {
    return employees.stream().filter(e -> e.getId().equals(id)).findFirst().orElse(null);
  }
}
