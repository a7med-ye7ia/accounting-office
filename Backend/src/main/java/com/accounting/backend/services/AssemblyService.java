package com.accounting.backend.services;

import com.accounting.backend.entities.ContractDocument;
import com.accounting.backend.entities.ContractDocument.Article;
import com.accounting.backend.entities.ContractDocument.LawReference;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class AssemblyService {

    private static final List<String> METADATA_FIELDS = List.of(
            "company_name",
            "company_address",
            "company_type",
            "company_capital",
            "commercial_register_number",
            "approval_date",
            "real_estate_registry_minutes_number",
            "company_duration",
            "company_activity"
    );

    // ── Main entry point ──────────────────────────────────────────────────────
    public ContractDocument assemble(List<Map<String, Object>> chunks) {
        ContractDocument doc = new ContractDocument();

        doc.setCompany_name(mostFrequent(chunks, "company_name"));
        doc.setCompany_address(mostFrequent(chunks, "company_address"));
        doc.setCompany_type(mostFrequent(chunks, "company_type"));
        doc.setCompany_capital(mostFrequent(chunks, "company_capital"));
        doc.setCommercial_register_number(mostFrequent(chunks, "commercial_register_number"));
        doc.setApproval_date(mostFrequent(chunks, "approval_date"));
        doc.setReal_estate_registry_minutes_number(mostFrequent(chunks, "real_estate_registry_minutes_number"));
        doc.setCompany_duration(mostFrequent(chunks, "company_duration"));
        doc.setCompany_activity(mostFrequent(chunks, "company_activity"));
        doc.setLaw_reference(assembleLawReference(chunks));
        doc.setArticles(assembleArticles(chunks));

        return doc;
    }

    // ── Metadata: most frequent non-empty value ───────────────────────────────
    private String mostFrequent(List<Map<String, Object>> chunks, String field) {
        Map<String, Integer> freq = new LinkedHashMap<>();

        for (Map<String, Object> chunk : chunks) {
            Map<String, Object> data = getDataFromChunk(chunk);
            if (data == null) continue;

            Object val = data.get(field);
            if (val == null) continue;

            String strVal = val.toString().trim();
            if (strVal.isEmpty()) continue;

            freq.merge(strVal, 1, Integer::sum);
        }

        if (freq.isEmpty()) return "";
        return freq.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse("");
    }

    // ── law_reference: most frequent law_number and law_year ──────────────────
    @SuppressWarnings("unchecked")
    private LawReference assembleLawReference(List<Map<String, Object>> chunks) {
        Map<String, Integer> numberFreq = new LinkedHashMap<>();
        Map<String, Integer> yearFreq   = new LinkedHashMap<>();

        for (Map<String, Object> chunk : chunks) {
            Map<String, Object> data = getDataFromChunk(chunk);
            if (data == null) continue;

            Object lawRefObj = data.get("law_reference");
            if (!(lawRefObj instanceof Map)) continue;

            Map<String, Object> lawRef = (Map<String, Object>) lawRefObj;

            String number = getString(lawRef, "law_number");
            String year   = getString(lawRef, "law_year");

            if (!number.isEmpty()) numberFreq.merge(number, 1, Integer::sum);
            if (!year.isEmpty())   yearFreq.merge(year,     1, Integer::sum);
        }

        LawReference lawReference = new LawReference();
        lawReference.setLaw_number(bestOf(numberFreq));
        lawReference.setLaw_year(bestOf(yearFreq));
        return lawReference;
    }

    // ── Articles: merge by id using partial rules ─────────────────────────────
    @SuppressWarnings("unchecked")
    private List<Article> assembleArticles(List<Map<String, Object>> chunks) {
        Map<Integer, List<Map<String, Object>>> appearances = new LinkedHashMap<>();

        for (Map<String, Object> chunk : chunks) {
            Map<String, Object> data = getDataFromChunk(chunk);
            if (data == null) continue;

            Object articlesObj = data.get("articles");
            if (!(articlesObj instanceof List)) continue;

            for (Object artObj : (List<Object>) articlesObj) {
                if (!(artObj instanceof Map)) continue;
                Map<String, Object> article = (Map<String, Object>) artObj;

                Object idObj = article.get("id");
                if (idObj == null) continue;

                int id;
                try {
                    id = Integer.parseInt(idObj.toString().trim());
                } catch (NumberFormatException e) {
                    continue;
                }

                appearances.computeIfAbsent(id, k -> new ArrayList<>()).add(article);
            }
        }

        List<Article> finalArticles = new ArrayList<>();

        for (Map.Entry<Integer, List<Map<String, Object>>> entry : appearances.entrySet()) {
            List<Map<String, Object>> versions = entry.getValue();
            Map<String, Object> chosen;

            if (versions.size() == 1) {
                chosen = versions.get(0);
            } else {
                Map<String, Object> first  = versions.get(0);
                Map<String, Object> second = versions.get(1);
                boolean firstPartial  = getPartial(first);
                boolean secondPartial = getPartial(second);

                if (!firstPartial && secondPartial) {
                    chosen = first;  // model wrong on second → take first
                } else {
                    chosen = second; // all other cases → take second
                }
            }

            Article article = new Article();
            article.setId(chosen.get("id").toString().trim());
            article.setValue(getString(chosen, "value"));
            finalArticles.add(article);
        }

        finalArticles.sort(Comparator.comparingInt(a ->
                Integer.parseInt(a.getId().trim())));

        return finalArticles;
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    @SuppressWarnings("unchecked")
    private Map<String, Object> getDataFromChunk(Map<String, Object> chunk) {
        Object dataObj = chunk.get("data");
        if (dataObj instanceof Map) return (Map<String, Object>) dataObj;
        return null;
    }

    private boolean getPartial(Map<String, Object> article) {
        Object partial = article.get("partial");
        if (partial == null) return false;
        if (partial instanceof Boolean) return (Boolean) partial;
        return Boolean.parseBoolean(partial.toString());
    }

    private String getString(Map<String, Object> map, String key) {
        Object val = map.get(key);
        if (val == null) return "";
        return val.toString().trim();
    }

    private String bestOf(Map<String, Integer> freq) {
        if (freq.isEmpty()) return "";
        return freq.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse("");
    }
}