function ContractChatMessage({ role, text }) {
  return (
    <div className={`rounded-lg p-3 text-sm ${role === "user" ? "bg-brand text-white" : "bg-appSurface text-appText"}`} dir="rtl">
      <p className="font-arabic">{text}</p>
    </div>
  );
}

export default ContractChatMessage;
