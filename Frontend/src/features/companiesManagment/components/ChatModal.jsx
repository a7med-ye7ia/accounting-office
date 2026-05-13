import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { MODAL_LAYER_CLASS } from "../../../shared/components/HrShared.jsx";

export default function ChatModal({ article, onClose }) {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [isVisible, setIsVisible] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));
  }, []);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  const handleSend = () => {
    if (!message.trim()) return;

    setMessages((prev) => [...prev, { role: "user", text: message }]);

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

  return createPortal(
    <div
      className={`${MODAL_LAYER_CLASS} ui-transition ${
        isVisible ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
      onClick={handleClose}
      role="presentation"
    >
      <div
        className={`relative isolate flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-appBorder bg-appSurface shadow-panel ui-transition ${
          isVisible ? "translate-y-0 scale-100" : "translate-y-8 scale-95"
        }`}
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        <div className="bg-gradient-to-l from-brand to-brandDeep px-8 py-5 flex items-center justify-between border-b border-appBorder/20">
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0 w-12 h-12 bg-appSurface/15 rounded-2xl flex items-center justify-center border border-appSurface/25">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-white font-extrabold text-xl tracking-tight">{article.title}</h3>
              <p className="text-white/85 text-sm">{article.subtitle}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="text-white/80 hover:text-white hover:bg-appSurface/15 rounded-xl p-2.5 ui-transition cursor-pointer"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-8 py-5 bg-badgeBlueBg/40 border-b border-appBorder">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-9 h-9 bg-appSurface rounded-xl flex items-center justify-center shadow-sm border border-appBorder mt-1">
              <svg className="w-5 h-5 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <div className="flex-1 bg-appSurface p-4 rounded-xl border border-appBorder shadow-inner">
              <p className="text-appSubtext text-xs font-bold mb-1">مرجع المادة:</p>
              <p className="text-appText text-sm leading-relaxed line-clamp-3">{article.content}</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6 bg-appBg min-h-[350px]">
          {messages.length === 0 && (
            <div className="text-center text-appSubtext py-16 flex flex-col items-center animate-fadeIn">
              <div className="w-20 h-20 bg-appMuted rounded-full flex items-center justify-center mb-6 border border-appBorder">
                <svg className="w-10 h-10 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
              </div>
              <p className="text-base font-medium text-appText mb-1">مساعد الذكاء الاصطناعي جاهز</p>
              <p className="text-sm text-appSubtext max-w-xs leading-relaxed">
                اكتب سؤالك بوضوح حول تفاصيل المادة المذكورة أعلاه لبدء التحليل.
              </p>
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-fadeIn`}
            >
              <div
                className={`max-w-[85%] px-5 py-3.5 rounded-2xl text-sm leading-relaxed shadow-panel ui-transition ${
                  msg.role === "user"
                    ? "bg-brand text-white rounded-tl-none"
                    : "bg-appSurface text-appText border border-appBorder rounded-tr-none"
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="px-8 py-5 bg-appSurface border-t border-appBorder mt-auto shadow-inner">
          <div className="flex gap-4 items-center">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="اكتب استفسارك الدقيق حول المادة هنا..."
              rows={1}
              className="flex-1 resize-none border border-appBorder rounded-2xl px-5 py-3.5 text-sm text-appText placeholder:text-appSubtext/80 ui-transition bg-appMuted hover:bg-appMuted/80 focus:bg-appSurface focus:border-brand focus:ring-2 focus:ring-brand/25"
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={!message.trim()}
              className="flex-shrink-0 bg-brand hover:bg-brandDeep disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-2xl w-14 h-14 flex items-center justify-center ui-transition shadow-panel group"
            >
              <svg
                className="w-6 h-6 rotate-180 transform group-hover:-translate-x-1 ui-transition"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
