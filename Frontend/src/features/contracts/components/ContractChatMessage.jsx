function ContractChatMessage({ role, text }) {
  return (
    <div className={`rounded-xl p-3 text-sm border ui-transition ${role === "user" ? "bg-brand text-white border-brand" : "bg-appMuted text-appText border-appBorder"}`} dir="rtl">
      <p className="font-arabic">{text}</p>
    </div>
  );
}

export default ContractChatMessage;
