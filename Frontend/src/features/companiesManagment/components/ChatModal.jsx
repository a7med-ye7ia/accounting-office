import { useState, useEffect, useRef } from "react";

export default function ChatModal({ article, onClose }) {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [isVisible, setIsVisible] = useState(false);
  const messagesEndRef = useRef(null);

  // Animate in on mount
  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));
  }, []);

  // Auto-scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  const handleSend = () => {
    if (!message.trim()) return;

    // Simulated logging
    console.log("📨 Message sent about article:", article.title);

    // Add user message
    setMessages((prev) => [...prev, { role: "user", text: message }]);

    // Simulated bot reply (AI Assistant)
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: `بناءً على المادة (${article.title}) التي تنص على "${article.content.substring(0, 50)}..."، فإن استفسارك يتطلب تحليلاً دقيقاً. جاري معالجة طلبك عبر المحرك الذكي... (هذه واجهة تجريبية).`,
        },
      ]);
    }, 1200);

    setMessage("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm
                  transition-all duration-300 ease-out
                  ${isVisible ? "bg-slate-900/60 opacity-100" : "bg-transparent opacity-0"}`}
      onClick={handleClose}
    >
      <div
        className={`bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh]
                    flex flex-col overflow-hidden transition-all duration-300 ease-out border border-slate-100
                    ${isVisible ? "scale-100 translate-y-0" : "scale-95 translate-y-8"}`}
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        {/* Header - Emerald Gradient */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 px-8 py-5 flex items-center justify-between shadow-lg z-10">
          <div className="flex items-center gap-4">
             <div className="flex-shrink-0 w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
             </div>
             <div>
                <h3 className="text-white font-extrabold text-xl tracking-tight">{article.title}</h3>
                <p className="text-emerald-100 text-sm opacity-90">{article.subtitle}</p>
             </div>
          </div>
          <button
            onClick={handleClose}
            className="text-white/70 hover:text-white hover:bg-white/10 rounded-xl p-2.5 transition-all cursor-pointer"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Article Content Reference - Subtle Emerald background */}
        <div className="px-8 py-5 bg-emerald-50/50 border-b border-emerald-100">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-9 h-9 bg-white rounded-xl flex items-center justify-center shadow-sm border border-emerald-100 mt-1">
              <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="flex-1 bg-white p-4 rounded-xl shadow-inner border border-slate-100">
                <p className="text-slate-600 text-xs font-bold mb-1">مرجع المادة:</p>
                <p className="text-slate-700 text-sm leading-relaxed line-clamp-3">
                  {article.content}
                </p>
            </div>
          </div>
        </div>

        {/* Chat Messages - Slate background */}
        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6 bg-slate-50/50 min-h-[350px]">
          {messages.length === 0 && (
            <div className="text-center text-slate-400 py-16 flex flex-col items-center animate-fadeIn">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6 border border-slate-200">
                <svg className="w-10 h-10 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <p className="text-base font-medium text-slate-500 mb-1">مساعد الذكاء الاصطناعي جاهز</p>
              <p className="text-sm text-slate-400 max-w-xs">اكتب سؤالك بوضوح حول تفاصيل المادة المذكورة أعلاه لبدء التحليل.</p>
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-fadeIn`}
            >
              <div
                className={`max-w-[85%] px-5 py-3.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                  msg.role === "user"
                    ? "bg-emerald-600 text-white rounded-tl-none"
                    : "bg-white text-slate-700 border border-slate-200 rounded-tr-none"
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area - White with subtle slate border */}
        <div className="px-8 py-5 bg-white border-t border-slate-100 mt-auto shadow-inner">
          <div className="flex gap-4 items-center">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="اكتب استفسارك الدقيق حول المادة هنا..."
              rows={1}
              className="flex-1 resize-none border border-slate-200 rounded-2xl px-5 py-3.5
                         text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300
                         focus:border-emerald-400 placeholder-slate-400
                         transition-all duration-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white"
            />
            <button
              onClick={handleSend}
              disabled={!message.trim()}
              className="flex-shrink-0 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300
                         text-white rounded-2xl w-14 h-14 flex items-center justify-center transition-all duration-200
                         hover:shadow-lg disabled:shadow-none cursor-pointer disabled:cursor-not-allowed group"
            >
              <svg className="w-6 h-6 rotate-180 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}