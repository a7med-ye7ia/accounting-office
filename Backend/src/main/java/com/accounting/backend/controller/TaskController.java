package com.accounting.backend.controller;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.accounting.backend.entity.Task;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:5173")
public class TaskController {
  
  private List<Task> tasks = new ArrayList<>(Arrays.asList(
    new Task("t1",  "إعادة تصميم شاشة تسجيل الدخول",         "SB", "سارة بنعلي",   "عالية",  "2026-04-22", "قيد التنفيذ"),
    new Task("t2",  "تطبيق البرمجيات الوسيطة للمصادقة",     "LF", "لوكاس فيريرا", "عالية",  "2026-04-20", "قيد التنفيذ"),
    new Task("t3",  "توقعات ميزانية الربع الثاني",          "MZ", "ميي تشانغ",    "متوسطة", "2026-04-30", "قائمة الانتظار"),
    new Task("t4",  "تحديث حزمة الاستقبال الوظيفي",         "NE", "ناديا السيد",  "منخفضة", "2026-05-10", "قائمة الانتظار"),
    new Task("t5",  "تدقيق أداء واجهة برمجة التطبيقات",      "AC", "أليكس كارتر", "عالية",  "2026-04-21", "تحت المراجعة"),
    new Task("t6",  "تحديث دليل الهوية البصرية",           "CY", "كريس يوين",   "متوسطة", "2026-05-05", "قائمة الانتظار"),
    new Task("t7",  "مراجعة قوالب العقود",                 "FA", "فاطمة الراشد","منخفضة", "2026-04-28", "تحت المراجعة"),
    new Task("t8",  "اختبار التوافق مع الأجهزة المحمولة",   "PN", "بريا ناير",   "متوسطة", "2026-04-25", "مكتمل"),
    new Task("t9",  "ترحيل مخطط قاعدة البيانات",            "AC", "أليكس كارتر", "عالية",  "2026-04-19", "مكتمل"),
    new Task("t10", "تحليلات الحملة على وسائل التواصل",     "CY", "كريس يوين",   "منخفضة", "2026-05-15", "قائمة الانتظار")

  ));

  @GetMapping("/tasks")
  public List<Task> getTasks() {
    return tasks;
  }

  @PostMapping("/tasks")
  public Task addTask(@RequestBody Task task) {
    tasks.add(task);
    return task;
  }

  @DeleteMapping("/tasks/{id}")
  public Boolean deleteTask(@PathVariable String id) {
    return tasks.removeIf(e -> e.getId().equals(id)); 
  }
}
