import re
from rouge_score import rouge_scorer
from sentence_transformers import SentenceTransformer, util

_embedder = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")

def _numbers_set(text: str):
    return set(int(x.replace(",", "")) for x in re.findall(r"\b\d{1,3}(?:,\d{3})*\b", text))

def text_similarity_rougeL(pred: str, gold: str) -> float:
    scorer = rouge_scorer.RougeScorer(["rougeL"], use_stemmer=False)
    f1 = scorer.score(gold, pred)["rougeL"].fmeasure
    return f1 * 100.0

def semantic_similarity(pred: str, gold: str) -> float:
    e1 = _embedder.encode(pred, convert_to_tensor=True)
    e2 = _embedder.encode(gold, convert_to_tensor=True)
    sim = util.cos_sim(e1, e2).item()
    return sim * 100.0

def clause_accuracy_generic(pred: str) -> tuple[float, list[str]]:
   
    checks = []
    reasons = []

    checks.append(("has_article_title", "المادة" in pred and "بعد التعديل" in pred))
    checks.append(("has_table_sep", "|---" in pred))
    checks.append(("has_total", ("الاجمالي" in pred) or ("الإجمالي" in pred)))
    checks.append(("has_egypt_100", "نسبة المشاركة المصرية 100%" in pred or "المشاركة المصرية 100%" in pred))

    ok = sum(int(v) for _, v in checks)
    total = len(checks)

    for name, v in checks:
        if not v:
            reasons.append(f"ClauseAccuracy fail: {name}")

    return (ok / total) * 100.0, reasons

def change_accuracy_against_gold(pred: str, gold: str) -> tuple[float, list[str]]:
  
    reasons = []

    gold_nums = _numbers_set(gold)
    pred_nums = _numbers_set(pred)

    if not gold_nums:
        num_score = 100.0
    else:
        recall = len(pred_nums & gold_nums) / len(gold_nums)
        num_score = recall * 100.0
        if recall < 1.0:
            missing = sorted(list(gold_nums - pred_nums))[:10]
            reasons.append(f"ChangeAccuracy: missing some gold numbers (e.g. {missing})")

    return num_score, reasons

def evaluate_sample(pred: str, gold: str) -> dict:
    ts = text_similarity_rougeL(pred, gold)
    ss = semantic_similarity(pred, gold)

    ca, ca_reasons = clause_accuracy_generic(pred)
    cha, cha_reasons = change_accuracy_against_gold(pred, gold)

    legal = 0.5 * ca + 0.5 * cha
    final = 0.6 * legal + 0.2 * ts + 0.2 * ss

    return {
        "TextSimilarity_ROUGE-L": round(ts, 2),
        "SemanticSimilarity": round(ss, 2),
        "ClauseAccuracy": round(ca, 2),
        "ChangeAccuracy": round(cha, 2),
        "LegalAccuracy": round(legal, 2),
        "FinalScore": round(final, 2),
        "Notes": ca_reasons + cha_reasons,
    }
gold = """المادة السادسة بعد التعديل:
حدد رأس مال الشركة بمبلغ 50000 (خمسون ألف جنيه مصري)، موزع إلى عدد 50000 حصة قيمة كل منها (1) جنيه مصري (واحد جنيه مصري) وجميعها حصص نقدية وقد تم توزيع هذه الحصص بين الشركاء على الوجه الآتي:
| م | اسم صاحب الحصة | جنسيته | عدد الحصص النقدية | القيمة بالجنيه المصري | العملة التي تم الوفاء بها |
|---|-------------------|---------|-------------------|------------------------|---------------------------|
| 1 | محمد عبدالله إبراهيم دسوقى | - | 12500 | 12500 | - |
| 2 | عمرو احمد إبراهيم احمد على | مصري | 25000 | 25000 | - |
| 3 | عمر عبدالله احمد محمد | مصري | 12500 | 12500 | - |
| | الاجمالي | - | 50000 | 50000 | - |
وتبلغ نسبة المشاركة المصرية 100%"""



gen_ids = outputs[0][inputs["input_ids"].shape[1]:]
pred = tokenizer.decode(gen_ids, skip_special_tokens=True).strip()
result = evaluate_sample(pred, gold)
print(result)