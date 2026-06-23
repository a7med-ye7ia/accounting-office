import { useMemo, useState } from "react";
import ContractChatMessage from "../components/ContractChatMessage";
import useMockAsyncData from "../../../shared/hooks/useMockAsyncData";
import MainLayout from "../../../shared/layout/MainLayout";
import { fetchArabicContractClauses } from "../../../shared/data/mockDataService";
import MicButton from "../../../shared/components/MicButton.jsx";

function EditContractAiPage() {
  const { data: clauses, isLoading } = useMockAsyncData(fetchArabicContractClauses, []);
  const [prompt, setPrompt] = useState("");
  const [selectedClauseId, setSelectedClauseId] = useState("rent");
  const [chatHistory, setChatHistory] = useState([
    { id: 1, role: "assistant", text: "حدد صياغة التعديل المطلوب وسأقترح نصاً قانونياً متوافقاً مع السياق المحاسبي." },
  ]);
  const selectedClause = useMemo(() => clauses.find((clause) => clause.id === selectedClauseId), [clauses, selectedClauseId]);

  const submitPrompt = () => {
    if (!prompt.trim()) return;
    const nextId = chatHistory.length + 1;
    setChatHistory((prev) => [...prev, { id: nextId, role: "user", text: prompt }, { id: nextId + 1, role: "assistant", text: `تم تحليل البند "${selectedClause?.title ?? ""}" وجاهز لتوليد نسخة مقترحة.` }]);
    setPrompt("");
  };

  return (
    <MainLayout title="Edit Contract AI" subtitle="Contract Management / Edit">
      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <section className="rounded-2xl border border-appBorder bg-appSurface p-6 shadow-panel">
          <h3 className="font-display text-2xl font-bold">Commercial Lease Agreement - Unit 402</h3>
          <p className="mt-2 text-sm text-appSubtext">Version 2.4 Draft</p>
          <div className="mt-6 space-y-3">
            {isLoading ? <div className="rounded-xl bg-appMuted p-4 text-sm text-appSubtext">Loading contract clauses...</div> : null}
            {clauses.map((clause) => (
              <button key={clause.id} onClick={() => setSelectedClauseId(clause.id)} className={`w-full rounded-xl p-4 text-right transition ${selectedClauseId === clause.id ? "bg-badgeBlueBg" : "bg-appMuted hover:bg-appMuted/80"}`} dir="rtl">
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
        <aside className="rounded-2xl border border-appBorder bg-appSurface p-6 shadow-panel">
          <h4 className="text-sm font-bold uppercase tracking-wider text-appSubtext">LLM Amendment Workspace</h4>
          <div className="mt-4 flex items-start gap-2">
            <textarea
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="اكتب طلب التعديل القانوني المطلوب هنا"
              dir="rtl"
              className="flex-1 h-32 rounded-xl bg-appMuted p-3 font-arabic text-sm outline-none ring-brand focus:ring-2"
            />
            <MicButton value={prompt} onChange={setPrompt} className="mt-1" />
          </div>
          <div className="mt-4 grid gap-2">
            <button className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white" onClick={submitPrompt}>Generate Amendment</button>
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
        </aside>
      </div>
    </MainLayout>
  );
}

export default EditContractAiPage;
