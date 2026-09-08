import React, { useEffect, useRef, useState } from 'react';
import { Download, File, Image, Paperclip, Trash2, Upload, X } from 'lucide-react';
import {
  deleteAttachment,
  fetchAttachmentBlob,
  fetchTaskAttachments,
  uploadTaskAttachments,
} from '../../../api/attachments';
import { getApiErrorMessage } from '../../../utils/apiError';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_ATTACHMENTS = 10;
const ALLOWED_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp', 'pdf', 'doc', 'docx', 'txt', 'xls', 'xlsx', 'csv']);

const extensionOf = (name = '') => name.split('.').pop()?.toLowerCase() || '';
const isImage = (contentType = '') => contentType.startsWith('image/');
const formatBytes = (bytes) => {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / (1024 ** index)).toFixed(index ? 1 : 0)} ${units[index]}`;
};

function AttachmentRow({ attachment, canDelete, onOpen, onDelete }) {
  const [thumbnailUrl, setThumbnailUrl] = useState('');

  useEffect(() => {
    let active = true;
    if (!isImage(attachment.contentType)) return undefined;
    fetchAttachmentBlob(attachment.id)
      .then((blob) => {
        if (active) setThumbnailUrl(URL.createObjectURL(blob));
      })
      .catch(() => {});
    return () => {
      active = false;
      setThumbnailUrl((url) => {
        if (url) URL.revokeObjectURL(url);
        return '';
      });
    };
  }, [attachment.id, attachment.contentType]);

  return (
    <div className="flex items-center gap-3 rounded-xl border border-appBorder bg-appMuted/40 p-3">
      <button
        type="button"
        onClick={() => onOpen(attachment)}
        className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-appBorder bg-appSurface text-brand"
        title="Open attachment"
      >
        {thumbnailUrl ? <img src={thumbnailUrl} alt={attachment.originalFileName} className="h-full w-full object-cover" /> : isImage(attachment.contentType) ? <Image size={20} /> : <File size={20} />}
      </button>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-appText">{attachment.originalFileName}</p>
        <p className="text-xs text-appSubtext">{formatBytes(attachment.fileSize)}{attachment.uploadedBy ? ` · ${attachment.uploadedBy}` : ''}</p>
      </div>
      <button type="button" onClick={() => onOpen(attachment, true)} className="rounded-lg p-2 text-appSubtext hover:bg-appSurface hover:text-brand" title="Download">
        <Download size={16} />
      </button>
      {canDelete && (
        <button type="button" onClick={() => onDelete(attachment)} className="rounded-lg p-2 text-appSubtext hover:bg-badgeRedBg hover:text-danger" title="Delete">
          <Trash2 size={16} />
        </button>
      )}
    </div>
  );
}

export default function TaskAttachments({ taskId, canUpload, canDelete }) {
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const loadAttachments = async () => {
    setLoading(true);
    try {
      setAttachments(await fetchTaskAttachments(taskId));
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'تعذر تحميل المرفقات.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAttachments();
  }, [taskId]);

  useEffect(() => {
    if (!cameraOpen) return undefined;

    let cancelled = false;
    const startCamera = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError('Camera access is not supported in this browser.');
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch (cameraRequestError) {
        setCameraError('Camera permission was denied or no camera is available.');
      }
    };

    startCamera();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      if (videoRef.current) videoRef.current.srcObject = null;
    };
  }, [cameraOpen]);

  const validateFiles = (files) => {
    if (attachments.length + files.length > MAX_ATTACHMENTS) {
      throw new Error(`لا يمكن إضافة أكثر من ${MAX_ATTACHMENTS} مرفقات للمهمة.`);
    }
    files.forEach((file) => {
      if (file.size > MAX_FILE_SIZE) throw new Error(`الملف ${file.name} أكبر من 10 MB.`);
      if (!ALLOWED_EXTENSIONS.has(extensionOf(file.name))) throw new Error(`نوع الملف ${file.name} غير مدعوم.`);
      if (!file.type) throw new Error(`تعذر التحقق من نوع الملف ${file.name}.`);
    });
  };

  const uploadFiles = async (selectedFiles) => {
    const files = Array.from(selectedFiles || []);
    if (!files.length) return;
    setError('');
    try {
      validateFiles(files);
      setBusy(true);
      const uploadedAttachments = [];
      for (const file of files) {
        setProgress({ name: file.name, value: 0 });
        const uploaded = await uploadTaskAttachments(taskId, [file], (event) => {
          const value = event.total ? Math.round((event.loaded * 100) / event.total) : 0;
          setProgress({ name: file.name, value });
        });
        uploadedAttachments.push(...uploaded);
      }
      setAttachments((current) => [...uploadedAttachments, ...current]);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, requestError.message || 'تعذر رفع الملف.'));
    } finally {
      setBusy(false);
      setProgress(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
    }
  };

  const openCamera = () => {
    setCameraError('');
    setCameraOpen(true);
  };

  const capturePhoto = async () => {
    const video = videoRef.current;
    if (!video?.videoWidth || !video.videoHeight) {
      setCameraError('The camera is not ready yet.');
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.9));
    if (!blob) {
      setCameraError('Could not capture the photo.');
      return;
    }

    setCameraOpen(false);
    const photo = blob;
    Object.defineProperty(photo, 'name', { value: `camera-${Date.now()}.jpg` });
    await uploadFiles([photo]);
  };

  const openAttachment = async (attachment, download = false) => {
    try {
      const blob = await fetchAttachmentBlob(attachment.id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      if (download) {
        link.download = attachment.originalFileName;
        link.click();
      } else {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
      window.setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'تعذر فتح المرفق.'));
    }
  };

  const openPreview = async (attachment) => {
    try {
      const blob = await fetchAttachmentBlob(attachment.id);
      const url = URL.createObjectURL(blob);
      setPreview({ attachment, url });
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'تعذر فتح الصورة.'));
    }
  };

  const removeAttachment = async (attachment) => {
    if (!window.confirm(`حذف ${attachment.originalFileName}؟`)) return;
    try {
      await deleteAttachment(attachment.id);
      setAttachments((current) => current.filter((item) => item.id !== attachment.id));
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'تعذر حذف المرفق.'));
    }
  };

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-xs text-appSubtext"><Paperclip size={14} /> المرفقات</p>
        {canUpload && (
          <div className="flex gap-2">
            <input ref={fileInputRef} type="file" multiple hidden accept=".jpg,.jpeg,.png,.webp,.pdf,.doc,.docx,.txt,.xls,.xlsx,.csv" onChange={(event) => uploadFiles(event.target.files)} />
            <input ref={cameraInputRef} type="file" hidden accept="image/*" capture="environment" onChange={(event) => uploadFiles(event.target.files)} />
            <button type="button" disabled={busy} onClick={() => fileInputRef.current?.click()} className="inline-flex items-center gap-1 rounded-lg border border-appBorder px-2 py-1 text-[11px] font-semibold text-appText hover:bg-appMuted disabled:opacity-50"><Upload size={13} /> رفع ملف</button>
            <button type="button" disabled={busy} onClick={openCamera} className="inline-flex items-center gap-1 rounded-lg border border-appBorder px-2 py-1 text-[11px] font-semibold text-appText hover:bg-appMuted disabled:opacity-50"><Image size={13} /> التقاط صورة</button>
          </div>
        )}
      </div>

      {error && <p className="rounded-xl border border-appBorder bg-badgeRedBg px-3 py-2 text-xs text-danger">{error}</p>}
      {progress && <p className="text-xs text-appSubtext">Uploading {progress.name}... {progress.value}%</p>}
      {loading ? <p className="text-xs text-appSubtext">Loading attachments...</p> : attachments.length === 0 ? <p className="rounded-lg bg-appMuted p-2 text-xs text-appSubtext">No attachments yet.</p> : (
        <div className="space-y-2">{attachments.map((attachment) => <AttachmentRow key={attachment.id} attachment={attachment} canDelete={canDelete} onOpen={(item, download) => isImage(item.contentType) && !download ? openPreview(item) : openAttachment(item, download)} onDelete={removeAttachment} />)}</div>
      )}

      {preview && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 p-4" onClick={() => { URL.revokeObjectURL(preview.url); setPreview(null); }}>
          <div className="relative max-h-[90vh] max-w-4xl" onClick={(event) => event.stopPropagation()}>
            <button type="button" onClick={() => { URL.revokeObjectURL(preview.url); setPreview(null); }} className="absolute -right-3 -top-3 rounded-full bg-appSurface p-2 text-appText" title="Close preview"><X size={16} /></button>
            <img src={preview.url} alt={preview.attachment.originalFileName} className="max-h-[85vh] max-w-full rounded-xl object-contain" />
          </div>
        </div>
      )}

      {cameraOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-lg space-y-4 rounded-2xl bg-appSurface p-4 shadow-raise">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-appText">Take a photo</h3>
              <button type="button" onClick={() => setCameraOpen(false)} className="rounded-lg p-2 text-appSubtext hover:bg-appMuted" title="Close camera"><X size={17} /></button>
            </div>
            {cameraError ? (
              <div className="space-y-3">
                <p className="rounded-xl bg-badgeRedBg px-3 py-2 text-xs text-danger">{cameraError}</p>
                <button type="button" onClick={() => cameraInputRef.current?.click()} className="rounded-lg bg-brand px-3 py-2 text-xs font-semibold text-white">Use device camera/file picker</button>
              </div>
            ) : (
              <>
                <video ref={videoRef} autoPlay playsInline muted className="aspect-video w-full rounded-xl bg-black object-cover" />
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setCameraOpen(false)} className="rounded-lg border border-appBorder px-3 py-2 text-xs font-semibold text-appText">Cancel</button>
                  <button type="button" onClick={capturePhoto} disabled={busy} className="rounded-lg bg-brand px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">Capture and upload</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
