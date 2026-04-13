import { useMemo, useState } from "react";
import AppShell from "../components/AppShell";
import ContractChatMessage from "../components/features/contracts/ContractChatMessage";
import useMockAsyncData from "../hooks/useMockAsyncData";
import { fetchArabicContractClauses } from "../services/mockDataService";

function EditContractAiPage() {
  const { data: clauses, isLoading } = useMockAsyncData(fetchArabicContractClauses, []);
  const [prompt, setPrompt] = useState("");
  const [selectedClauseId, setSelectedClauseId] = useState("rent");
  const [chatHistory, setChatHistory] = useState([
    { id: 1, role: "assistant", text: "حدد صياغة التعديل المطلوب وسأقترح نصاً قانونياً متوافقاً مع السياق المحاسبي." },
  ]);
  const selectedClause = useMemo(() => clauses.find((clause) => clause.id === selectedClauseId), [clauses, selectedClauseId]);

  const submitPrompt = () => {
    if (!prompt.trim()) {
      return;
    }
    setChatHistory((prev) => [...prev, { id: prev.length + 1, role: "user", text: prompt }]);
    setChatHistory((prev) => [
      ...prev,
      {
        id: prev.length + 1,
        role: "assistant",
        text: `تم تحليل البند "${selectedClause?.title ?? ""}" وجاهز لتوليد نسخة مقترحة متوافقة مع سياسات المكتب.`,
      },
    ]);
    setPrompt("");
  };

  return (
    <AppShell title="Edit Contract AI" subtitle="Contract Management / Edit">
      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <section className="rounded-2xl bg-appSurface p-6">
          <h3 className="font-display text-2xl font-bold">Commercial Lease Agreement - Unit 402</h3>
          <p className="mt-2 text-sm text-appSubtext">Version 2.4 Draft</p>
          <div className="mt-6 space-y-3">
            {isLoading ? <div className="rounded-xl bg-appMuted p-4 text-sm text-appSubtext">Loading contract clauses...</div> : null}
            {clauses.map((clause) => (
              <button
                key={clause.id}
                onClick={() => setSelectedClauseId(clause.id)}
                className={`w-full rounded-xl p-4 text-left transition ${selectedClauseId === clause.id ? "bg-badgeBlueBg" : "bg-appMuted hover:bg-slate-200"}`}
              >
                <p className="font-semibold text-appText">{clause.title}</p>
                <p className="mt-1 text-sm text-appSubtext">{clause.body}</p>
              </button>
            ))}
          </div>
          <div className="mt-6 rounded-2xl bg-appMuted p-5" dir="rtl">
            <p className="font-arabic text-sm font-semibold text-appSubtext">معاينة البند المختار</p>
            <p className="mt-2 font-arabic text-lg font-bold text-appText">{selectedClause?.title}</p>
            <p className="mt-2 font-arabic leading-8 text-appText">{selectedClause?.body}</p>
          </div>
        </section>

        <aside className="rounded-2xl bg-appSurface p-6">
          <h4 className="text-sm font-bold uppercase tracking-wider text-appSubtext">LLM Amendment Workspace</h4>
          <p className="mt-3 text-sm text-appText">{selectedClause?.title}</p>
          <textarea
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder="اكتب طلب التعديل القانوني المطلوب هنا"
            dir="rtl"
            className="mt-4 h-32 w-full rounded-xl bg-appMuted p-3 font-arabic text-sm outline-none ring-brand focus:ring-2"
          />
          <div className="mt-4 grid gap-2">
            <button className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white" onClick={submitPrompt}>
              Generate Amendment
            </button>
            <button className="rounded-xl bg-appMuted px-4 py-2 text-sm font-semibold text-appText">Apply Suggested Change</button>
          </div>
          <div className="mt-6 rounded-xl bg-appMuted p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-appSubtext">AI Conversation</p>
            <div className="mt-3 space-y-2">
              {chatHistory.map((item) => (
                <ContractChatMessage key={item.id} role={item.role} text={item.text} />
              ))}
            </div>
          </div>
          <div className="mt-4 rounded-xl bg-appMuted p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-appSubtext">API Payload Preview</p>
            <div className="mt-2 space-y-1 text-xs text-appSubtext">
              <p>selectedClauseId: {selectedClauseId}</p>
              <p>sourceContractVersion: 2.4</p>
              <p>language: ar</p>
              <p>assistantModel: legal-llm-ar-v1</p>
            </div>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}

export default EditContractAiPage;
