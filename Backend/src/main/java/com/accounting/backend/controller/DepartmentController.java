package com.accounting.backend.controller;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.accounting.backend.entity.Department;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:5173")
public class DepartmentController {
  List<Department> departments = new ArrayList<>(Arrays.asList(
    new Department(1L, "الهندسة", "أليكس كارتر", 24, 820000.0, 610000.0, "نشط"),
    new Department(2L, "تصميم المنتج", "سارة بنعلي", 10, 450000.0, 390000.0, "نشط"),
    new Department(3L, "المالية", "جيمس أوكافور", 8, 310000.0, 175000.0, "نشط"),
    new Department(4L, "الموارد البشرية", "ناديا السيد", 6, 280000.0, 210000.0, "نشط"),
    new Department(5L, "التسويق", "كريس يوين", 12, 500000.0, 320000.0, "نشط"),
    new Department(6L, "الشؤون القانونية", "فاطمة الراشد", 4, 200000.0, 50000.0, "غير نشط"),
    new Department(7L, "Mo.Anwar", "فاطمة الراشد", 4, 200000.0, 50000.0, "غير نشط")
  ));

    @GetMapping("/departments")
  public List<Department> getdepartments() {
    return departments;
  }


  // ! change to make it return response entity with status code and error handling
  @PostMapping("/departments")
  public Department addDepartment(@RequestBody Department Department) {
    departments.add(Department);
    return Department;
  }
  
  // ! change to make it return response entity with status code and error handling
  // @DeleteMapping("/departments/{id}")
  // public Boolean deleteDepartment(@PathVariable String id) {
  //   return departments.removeIf(e -> e.getId().equals(id));
  // }

  @GetMapping("/departments/names")
  public List<String> getDepartmentNames() {
    List<String> names = new ArrayList<>();
    for (Department dept : departments) {
      names.add(dept.getName());
    }
    return names;
  }
}
