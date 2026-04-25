package com.accounting.backend.controller;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.accounting.backend.entity.Company;
import com.accounting.backend.entity.Contract;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:5173")
public class CompanyController {
  
  private List<Company> companies = new ArrayList<>(Arrays.asList(
    new Company("1", "شركة النور للتجارة", "🏢", " شركة تجارية متخصصة في الاستيراد والتصدير",
      Arrays.asList(
        new Contract("pdf-1", "عقد تأسيس - يناير 2020", "2020-01-15"),
        new Contract("pdf-2", "عقد تأسيس - مارس 2021", "2021-03-22")
      ),
      Arrays.asList(
        new Contract("pdf-3", "عقد تعديل - يونيو 2022", "2022-06-10"),
        new Contract("pdf-4", "عقد تعديل - سبتمبر 2023", "2023-09-05")
      )
    ),
    new Company("2", "مؤسسة الأمل للمقاولات", "🏗️", "مؤسسة رائدة في قطاع المقاولات والبناء",
      Arrays.asList(
        new Contract("pdf-5", "عقد تأسيس - فبراير 2019", "2019-02-10")
      ),
      Arrays.asList(
        new Contract("pdf-6", "عقد تعديل - أبريل 2020", "2020-04-18"),
        new Contract("pdf-7", "عقد تعديل - أغسطس 2021", "2021-08-25"),
        new Contract("pdf-8", "عقد تعديل - ديسمبر 2022", "2022-12-03")
      )
    ),
    new Company("3", " شركة الفجر للتقنية", "💻", "شركة تقنية متخصصة في الحلول الرقمية",
      Arrays.asList(
        new Contract("pdf-9", "عقد تأسيس - مايو 2021", "2021-05-14"),
        new Contract("pdf-10", "عقد تأسيس - يوليو 2022", "2022-07-30")
      ),
      Arrays.asList(
        new Contract("pdf-11", "عقد تعديل - نوفمبر 2023", "2023-11-20")
      )
    ),
    new Company("4", " شركة البركة الغذائية", "🍽️", "شركة متخصصة في الصناعات الغذائية والتوزيع",
      Arrays.asList(
        new Contract("pdf-12", "عقد تأسيس - أكتوبر 2018", "2018-10-05"),
        new Contract("pdf-13", "عقد تأسيس - يناير 2020", "2020-01-20")
      ),
      Arrays.asList(
        new Contract("pdf-14", "عقد تعديل - مارس 2021", "2021-03-12"),
        new Contract("pdf-15", "عقد تعديل - يوليو 2023", "2023-07-08")
      )
    ),
    new Company("5", "مجموعة السلام العقارية", "🏠", "مجموعة متخصصة في التطوير العقاري والاستثمار",
      Arrays.asList(
        new Contract("pdf-16", "عقد تأسيس - يونيو 2017", "2017-06-01")
      ),
      Arrays.asList(
        new Contract("pdf-17", "عقد تعديل - فبراير 2019", "2019-02-28"),
        new Contract("pdf-18", "عقد تعديل - مايو 2022", "2022-05-15")
      )
    ),
    new Company("6", " شركة الوفاء للخدمات اللوجستية", "🚛", " شركة خدمات لوجستية ونقل وتخزين",
      Arrays.asList(
        new Contract("pdf-19", "عقد تأسيس - سبتمبر 2020", "2020-09-10")
      ),
      Arrays.asList(
        new Contract("pdf-20", "عقد تعديل - أبريل 2023", "2023-04-22")
      )
    ),

    new Company("", " شركة المرعبين المحدودة", "🚛", " شركة خدمات لوجستية ونقل وتخزين",
      Arrays.asList(
        new Contract("pdf-19", "عقد تأسيس - سبتمبر 2020", "2020-09-10")
      ),
      Arrays.asList(
        new Contract("pdf-20", "عقد تعديل - أبريل 2023", "2023-04-22")
      )
    )
  ));

  @GetMapping("/companies")
  public List<Company> getCompanies() {
    return companies;
  }
}
