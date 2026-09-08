import { useEffect, useRef, useState } from "react";
import { Camera, X } from "lucide-react";
import html2pdf from "html2pdf.js";

async function blobToPdf(blob) {
  const imageUrl = URL.createObjectURL(blob);
  const image = document.createElement("img");
  image.src = imageUrl;
  image.style.width = "100%";
  image.style.display = "block";
  await image.decode();

  try {
    const pdfBlob = await html2pdf()
      .set({
        margin: 0,
        image: { type: "jpeg", quality: 0.92 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      })
      .from(image)
      .outputPdf("blob");
    return new Blob([pdfBlob], { type: "application/pdf" });
  } finally {
    URL.revokeObjectURL(imageUrl);
  }
}

export default function CameraCaptureButton({
  onCapture,
  outputType = "image",
  disabled = false,
  className = "",
  children = "التقاط صورة",
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    let cancelled = false;

    const start = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError("الكاميرا غير مدعومة في هذا المتصفح.");
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      } catch {
        setError("تعذر الوصول إلى الكاميرا. تحقق من الصلاحيات.");
      }
    };

    start();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      if (videoRef.current) videoRef.current.srcObject = null;
    };
  }, [open]);

  const close = () => {
    if (!disabled) setOpen(false);
  };

  const capture = async () => {
    const video = videoRef.current;
    if (!video?.videoWidth || !video.videoHeight) {
      setError("انتظر حتى تصبح الكاميرا جاهزة.");
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageBlob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92));
    if (!imageBlob) {
      setError("تعذر التقاط الصورة.");
      return;
    }

    const stamp = Date.now();
    const file = outputType === "pdf"
      ? await blobToPdf(imageBlob)
      : imageBlob;
    Object.defineProperty(file, "name", {
      value: `camera-${stamp}.${outputType === "pdf" ? "pdf" : "jpg"}`,
    });
    setOpen(false);
    await onCapture(file);
  };

  return (
    <>
      <button type="button" disabled={disabled} onClick={() => { setError(""); setOpen(true); }} className={className}>
        <Camera className="h-4 w-4" aria-hidden="true" />
        {children}
      </button>

      {open && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-lg space-y-4 rounded-xl bg-appSurface p-4 shadow-raise" dir="rtl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-appText">التقاط صورة</h3>
              <button type="button" onClick={close} className="rounded-lg p-2 text-appSubtext hover:bg-appMuted" aria-label="إغلاق"><X size={17} /></button>
            </div>
            {error ? (
              <p className="rounded-lg bg-danger/10 p-3 text-xs font-semibold text-danger">{error}</p>
            ) : (
              <video ref={videoRef} autoPlay playsInline muted className="aspect-video w-full rounded-lg bg-black object-cover" />
            )}
            <div className="flex justify-end gap-2">
              <button type="button" onClick={close} className="rounded-lg border border-appBorder px-4 py-2 text-xs font-bold text-appText">إلغاء</button>
              {!error && <button type="button" onClick={capture} className="rounded-lg bg-brand px-4 py-2 text-xs font-bold text-white">التقاط واستخدام</button>}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
