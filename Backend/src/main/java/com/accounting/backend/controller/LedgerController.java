package com.accounting.backend.controller;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.accounting.backend.entity.Ledger;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/api")
public class LedgerController {
  
  private List<Ledger> ledgerRows = new ArrayList<>(Arrays.asList(
    new Ledger("LGR-EGP-0012", "شركة المدار اللوجستية", "الضرائب", "1,245,000.00 ج.م", "EGP", "قيد المراجعة", "2026-04-10"),
    new Ledger("LGR-SAR-0009", "شركة الوسم التجارية ذ.م.م", "التأمين", "320,500.00 ر.س", "SAR", "معلق", "2026-04-09"),
    new Ledger("LGR-EGP-0008", "النيل كوبري للإنشاءات", "الشؤون القانونية", "89,300.00 ج.م", "EGP", "تم التحقق", "2026-04-08"),
    new Ledger("LGR-SAR-0004", "مجموعة رياض موبيليتي", "الأرشيف", "27,980.00 ر.س", "SAR", "متأخر", "2026-04-05")
  ));

  @GetMapping("/ledger")
  public List<Ledger> getLedger() {
    return ledgerRows;
  }
}
