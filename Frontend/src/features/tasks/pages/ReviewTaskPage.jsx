import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock3,
  FileText,
  FileType,
  Loader2,
  MessageSquare,
  PenLine,
  ScrollText,
  Users,
} from "lucide-react";

import MainLayout from "../../../shared/layout/MainLayout";
import { getTaskReview, approveTaskReview, returnTaskReview } from "../../../api/tasks";
import { getFileFromPath } from "../../../api/files";
import { fetchCompanyCreating } from "../../../api/companies";
import { getApiErrorMessage } from "../../../utils/apiError";

const TASK_STATUS_AR = {
  PENDING: "في الانتظار",
  IN_PROGRESS: "قيد التنفيذ",
  DONE: "بانتظار المراجعة",
  ACCEPTED: "معتمدة",
};

const SUBTASK_STATUS_LABELS = {
  PENDING: "في الانتظار",
  IN_PROGRESS: "قيد التنفيذ",
  DONE: "مكتمل",
};

/**
 * Parses the amendment payload persisted in contract.ocrData
 * (the PdfRequest JSON built by the amendment generation flow).
 */
function parseAmendmentData(ocrData) {
  if (!ocrData) return null;
  try {
    const parsed = JSON.parse(ocrData);
    const sections = (parsed.sections || []).map((section, index) => ({
      key: section.id ?? String(index),
      articleId: section.selectedArticleId ?? "",
      title: section.selectedArticleTitle || `المادة ${Number(section.selectedArticleId) + 1 || index + 1}`,
      beforeText: section.beforeText || "",
      afterText: section.afterText || section.modelOutput || "",
    }));
    return {
      contractTitle: parsed.contractTitle || "عقد تعديل",
      companyName: parsed.companyName || "",
      introText: parsed.introText || "",
      sections,
    };
  } catch (error) {
    console.error("Failed to parse amendment data:", error);
    return null;
  }
}

function AccordionCard({ title, icon: Icon, expanded, onToggle, children }) {
  return (
    <div className="rounded-2xl border border-appBorder bg-appSurface shadow-panel">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 p-4 text-right ui-transition hover:bg-appMuted/40"
      >
        <span className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand">
            <Icon size={18} />
          </span>
          <span className="text-base font-extrabold text-appText">{title}</span>
        </span>
        {expanded ? (
          <ChevronUp size={18} className="text-appSubtext" />
        ) : (
          <ChevronDown size={18} className="text-appSubtext" />
        )}
      </button>

      {expanded && <div className="border-t border-appBorder p-4">{children}</div>}
    </div>
  );
}

/**
 * The two view buttons of each accordion card.
 * "عرض البيانات" uses a document icon (never a database icon).
 */
function ViewButtons({ activeView, onView }) {
  return (
    <div className="rounded-2xl border border-appBorder bg-appSurface p-2 shadow-panel">
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onView("data")}
          className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold ui-transition ${
            activeView === "data"
              ? "bg-brand text-white"
              : "text-appSubtext hover:bg-appMuted"
          }`}
        >
          <FileText className="h-5 w-5" />
          عرض البيانات
        </button>

        <button
          type="button"
          onClick={() => onView("pdf")}
          className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold ui-transition ${
            activeView === "pdf"
              ? "bg-brand text-white"
              : "text-appSubtext hover:bg-appMuted"
          }`}
        >
          <FileType className="h-5 w-5" />
          عرض ملف PDF
        </button>
      </div>
    </div>
  );
}

function PdfFrame({ blobUrl }) {
  if (!blobUrl) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl bg-appMuted">
        <div className="text-center">
          <FileText className="mx-auto h-10 w-10 text-appSubtext" />
          <p className="mt-3 font-bold text-appText">لا يوجد ملف PDF متاح</p>
        </div>
      </div>
    );
  }
  return (
    <div className="h-[720px] overflow-hidden rounded-xl border border-appBorder bg-appMuted">
      <iframe title="Contract PDF" src={blobUrl} className="h-full w-full border-0" />
    </div>
  );
}

/**
 * One article of the original incorporation contract.
 * Articles touched by the amendment get a قبل التعديل / بعد التعديل toggle.
 */
function OriginalArticle({ article, index, modified }) {
  const [showModified, setShowModified] = useState(false);

  return (
    <div className="rounded-xl border border-appBorder bg-appMuted p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand/10 text-sm font-black text-brand">
            {index + 1}
          </div>
          <h3 className="font-extrabold text-appText">المادة {index + 1}</h3>
        </div>

        {modified && (
          <button
            type="button"
            onClick={() => setShowModified((prev) => !prev)}
            className="inline-flex items-center gap-1 rounded-lg border border-appBorder bg-appSurface px-3 py-1.5 text-xs font-bold text-appText ui-transition hover:bg-appMuted"
          >
            {showModified ? (
              <>
                بعد التعديل
                <ChevronUp size={14} />
              </>
            ) : (
              <>
                قبل التعديل
                <ChevronDown size={14} />
              </>
            )}
          </button>
        )}
      </div>

      <p className="text-sm leading-8 text-appText">
        {modified && showModified ? modified.afterText : article.value}
      </p>

      {modified && showModified && (
        <p className="mt-2 text-[11px] font-bold text-badgeBlueText">
          هذا النص معدّل بموجب عقد التعديل ولم يُعتمد إلا بعد قبول المهمة
        </p>
      )}
    </div>
  );
}

export default function ReviewTaskPage() {
  const { taskId } = useParams();
  const navigate = useNavigate();

  const [review, setReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [actionError, setActionError] = useState("");
  const [actionBusy, setActionBusy] = useState("");

  const [amendmentView, setAmendmentView] = useState("data"); // "data" | "pdf"
  const [originalView, setOriginalView] = useState("data");
  const [amendmentExpanded, setAmendmentExpanded] = useState(false);
  const [originalExpanded, setOriginalExpanded] = useState(false);

  // PDF blobs
  const [amendmentPdfUrl, setAmendmentPdfUrl] = useState(null);
  const [originalPdfUrl, setOriginalPdfUrl] = useState(null);

  // Original contract structured data (ocrData.json of the creation contract)
  const [originalJson, setOriginalJson] = useState(null);
  const [originalJsonError, setOriginalJsonError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setPageError("");
      try {
        const data = await getTaskReview(taskId);
        if (!cancelled) setReview(data);
      } catch (error) {
        if (!cancelled) setPageError(getApiErrorMessage(error, "تعذر تحميل بيانات المراجعة."));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [taskId]);

  const amendmentData = useMemo(
    () => parseAmendmentData(review?.amendment?.ocrData),
    [review],
  );

  // Load the amendment PDF once the review data is available
  useEffect(() => {
    let cancelled = false;
    const amendment = review?.amendment;

    const loadPdf = async () => {
      if (!amendment?.filePath) return;
      try {
        const blob = await getFileFromPath(amendment.filePath);
        if (!cancelled) setAmendmentPdfUrl(URL.createObjectURL(blob));
      } catch (error) {
        console.error("Failed to load amendment PDF:", error);
      }
    };

    loadPdf();
    return () => {
      cancelled = true;
    };
  }, [review?.amendment]);

  // Load the original incorporation contract (PDF + structured data)
  useEffect(() => {
    let cancelled = false;
    const original = review?.originalContract;

    const loadOriginal = async () => {
      if (!original) return;
      const companyName = original.companyName;

      if (original.filePath) {
        try {
          const blob = await getFileFromPath(original.filePath);
          if (!cancelled) setOriginalPdfUrl(URL.createObjectURL(blob));
        } catch (error) {
          console.error("Failed to load original contract PDF:", error);
        }
      }

      if (original.companyId != null && companyName) {
        try {
          const creating = await fetchCompanyCreating(original.companyId, companyName);
          if (!cancelled) {
            setOriginalJson(creating.json || null);
            if (!original.filePath && creating.pdf) {
              setOriginalPdfUrl(URL.createObjectURL(creating.pdf));
            }
          }
        } catch (error) {
          console.error("Failed to load original contract data:", error);
          if (!cancelled) setOriginalJsonError(true);
        }
      }
    };

    loadOriginal();
    return () => {
      cancelled = true;
    };
  }, [review?.originalContract]);

  useEffect(() => {
    return () => {
      if (amendmentPdfUrl) URL.revokeObjectURL(amendmentPdfUrl);
      if (originalPdfUrl) URL.revokeObjectURL(originalPdfUrl);
    };
  }, [amendmentPdfUrl, originalPdfUrl]);

  const handleApprove = async () => {
    setActionError("");
    setActionBusy("approve");
    try {
      await approveTaskReview(taskId);
      navigate("/AssignedTasks");
    } catch (error) {
      setActionError(getApiErrorMessage(error, "تعذر قبول المهمة."));
    } finally {
      setActionBusy("");
    }
  };

  const handleReturn = async () => {
    setActionError("");
    setActionBusy("return");
    try {
      const updated = await returnTaskReview(taskId);
      setReview((prev) => ({ ...prev, task: updated }));
    } catch (error) {
      setActionError(getApiErrorMessage(error, "تعذر إعادة المهمة للتعديل."));
    } finally {
      setActionBusy("");
    }
  };

  if (loading) {
    return (
      <MainLayout title="مراجعة المهمة" subtitle="">
        <div
          dir="rtl"
          className="flex min-h-[60vh] items-center justify-center gap-3 text-appSubtext"
        >
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>جاري تحميل بيانات المراجعة...</span>
        </div>
      </MainLayout>
    );
  }

  if (pageError || !review?.task) {
    return (
      <MainLayout title="مراجعة المهمة" subtitle="">
        <div dir="rtl" className="rounded-2xl border border-appBorder bg-appSurface p-8 text-center shadow-panel">
          <AlertTriangle className="mx-auto h-12 w-12 text-danger" />
          <h3 className="mt-4 text-lg font-bold text-appText">
            {pageError || "المهمة غير موجودة"}
          </h3>
          <button
            onClick={() => navigate("/AssignedTasks")}
            className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-brand hover:underline"
          >
            العودة إلى المهام
          </button>
        </div>
      </MainLayout>
    );
  }

  const task = review.task;
  const subtasks = task.subtasks || [];
  const comments = task.comments || [];
  const amendment = review.amendment;
  const original = review.originalContract;

  return (
    <MainLayout
      title={`مراجعة: ${task.title}`}
      subtitle="مراجعة المهمة وعقد التعديل قبل الاعتماد"
    >
      <div dir="rtl" className="space-y-6">
        {actionError && (
          <p className="rounded-xl border border-appBorder bg-badgeRedBg px-3 py-2 text-sm text-danger">
            {actionError}
          </p>
        )}

        {/* ======================= Task information ======================= */}
        <div className="rounded-2xl border border-appBorder bg-appSurface p-6 shadow-panel">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand">
                <ScrollText size={18} />
              </span>
              <h2 className="text-lg font-extrabold text-appText">{task.title}</h2>
            </div>
            <span
              className={`rounded-lg px-2.5 py-1 text-xs font-bold ${
                task.status === "DONE"
                  ? "bg-yellow-100 text-yellow-700"
                  : task.status === "ACCEPTED"
                    ? "bg-success/15 text-success"
                    : "bg-appMuted text-appSubtext"
              }`}
            >
              {TASK_STATUS_AR[task.status] || task.status}
            </span>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-xs text-appSubtext">الوصف</p>
              <p className="rounded-lg bg-appMuted p-2 text-sm text-appText">
                {task.description || "لا يوجد وصف"}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="flex items-center gap-2">
                <Users size={16} className="text-appSubtext" />
                <div>
                  <p className="text-xs text-appSubtext">الموظف المسؤول</p>
                  <p className="text-sm font-bold text-appText">
                    {task.assignedToName || "غير محدد"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock3 size={16} className="text-appSubtext" />
                <div>
                  <p className="text-xs text-appSubtext">موعد التسليم</p>
                  <p className="text-sm font-bold text-appText">
                    {task.dueDate ? new Date(task.dueDate).toLocaleString() : "غير محدد"}
                  </p>
                </div>
              </div>
            </div>

            {(task.workingEmployees || []).length > 0 && (
              <div>
                <p className="text-xs text-appSubtext mb-1">الموظفون العاملون على المهمة</p>
                <div className="flex flex-wrap gap-2">
                  {task.workingEmployees.map((worker) => (
                    <span
                      key={worker.id}
                      className="rounded-lg border border-appBorder bg-appMuted px-2.5 py-1 text-xs font-bold text-appText"
                    >
                      {worker.fullName}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <p className="text-xs text-appSubtext">المهام الفرعية</p>
                {subtasks.length > 0 && (
                  <span className="rounded-lg border border-appBorder bg-badgeBlueBg px-2 py-1 text-[11px] text-badgeBlueText">
                    {subtasks.filter((s) => s.status === "DONE").length}/{subtasks.length} مكتملة
                  </span>
                )}
              </div>
              {subtasks.length === 0 ? (
                <p className="rounded-lg bg-appMuted p-2 text-xs text-appSubtext">
                  لا توجد مهام فرعية
                </p>
              ) : (
                <div className="max-h-52 space-y-2 overflow-y-auto pl-1">
                  {subtasks.map((subtask) => (
                    <div key={subtask.id} className="rounded-xl border border-appBorder bg-appMuted/40 p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-appText">{subtask.title}</p>
                          {subtask.description && (
                            <p className="mt-1 text-xs text-appSubtext">{subtask.description}</p>
                          )}
                          <div className="mt-2 flex flex-wrap gap-3 text-xs text-appSubtext">
                            <span>الموظف: {subtask.assignedToName || "غير محدد"}</span>
                            <span>
                              التسليم:{" "}
                              {subtask.dueDate ? new Date(subtask.dueDate).toLocaleString() : "غير محدد"}
                            </span>
                          </div>
                        </div>
                        <span className="shrink-0 rounded-lg border border-appBorder bg-appSurface px-2 py-1 text-[11px] text-appSubtext">
                          {SUBTASK_STATUS_LABELS[subtask.status] || subtask.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <p className="mb-2 flex items-center gap-2 text-xs text-appSubtext">
                <MessageSquare size={14} />
                التعليقات
              </p>
              {comments.length === 0 ? (
                <p className="text-xs text-appSubtext">لا توجد تعليقات</p>
              ) : (
                <div className="max-h-40 space-y-2 overflow-y-auto">
                  {comments.map((c, i) => (
                    <div key={i} className="flex items-start gap-2 rounded-lg bg-appMuted p-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand text-xs font-semibold text-white">
                        {c.createdByName?.charAt(0) || "?"}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-appText">
                          {c.createdByName || "Unknown"}
                        </span>
                        <span className="text-xs text-appSubtext">{c.message}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ======================= Amendment accordion ======================= */}
        <AccordionCard
          title="عقد التعديل"
          icon={PenLine}
          expanded={amendmentExpanded}
          onToggle={() => setAmendmentExpanded((prev) => !prev)}
        >
          <div className="space-y-4">
            {!amendment && (
              <p className="rounded-xl bg-appMuted p-4 text-sm text-appSubtext">
                لا يوجد عقد تعديل مرتبط بهذه المهمة
              </p>
            )}

            {amendment && (
              <>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="rounded-lg border border-appBorder bg-appMuted px-2.5 py-1 font-bold text-appSubtext">
                    الحالة:{" "}
                    {amendment.status === "APPROVED"
                      ? "معتمد"
                      : amendment.status === "PENDING_APPROVAL"
                        ? "بانتظار الاعتماد"
                        : amendment.status}
                  </span>
                </div>

                <ViewButtons activeView={amendmentView} onView={setAmendmentView} />

                {amendmentView === "pdf" && <PdfFrame blobUrl={amendmentPdfUrl} />}

                {amendmentView === "data" && (
                  <div className="space-y-4">
                    {!amendmentData ? (
                      <p className="rounded-xl bg-appMuted p-4 text-sm text-appSubtext">
                        لا تتوفر بيانات منظمة لعقد التعديل
                      </p>
                    ) : (
                      <>
                        <div className="rounded-2xl border border-appBorder bg-appSurface p-6 shadow-panel">
                          <div className="mb-3 flex items-center gap-3">
                            <Building2 className="h-5 w-5 text-brand" />
                            <h3 className="text-lg font-extrabold text-appText">
                              {amendmentData.contractTitle}
                            </h3>
                          </div>
                          {amendmentData.introText && (
                            <p className="rounded-xl bg-appMuted p-4 text-sm leading-8 text-appText">
                              {amendmentData.introText}
                            </p>
                          )}
                        </div>

                        {amendmentData.sections.map((section) => (
                          <div
                            key={section.key}
                            className="rounded-2xl border border-appBorder bg-appSurface p-6 shadow-panel"
                          >
                            <div className="mb-4 flex items-center gap-3">
                              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand/10 text-sm font-black text-brand">
                                <FileText size={16} />
                              </div>
                              <h3 className="font-extrabold text-appText">{section.title}</h3>
                            </div>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                              <div>
                                <p className="mb-1 text-xs font-bold text-appSubtext">
                                  النص قبل التعديل
                                </p>
                                <p className="rounded-xl bg-appMuted p-4 text-sm leading-8 text-appText">
                                  {section.beforeText || "غير متوفر"}
                                </p>
                              </div>
                              <div>
                                <p className="mb-1 text-xs font-bold text-brand">
                                  النص بعد التعديل
                                </p>
                                <p className="rounded-xl border border-brand/20 bg-brand/5 p-4 text-sm leading-8 text-appText">
                                  {section.afterText || "غير متوفر"}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </AccordionCard>

        {/* ======================= Original contract accordion ======================= */}
        <AccordionCard
          title="عقد التأسيس"
          icon={Building2}
          expanded={originalExpanded}
          onToggle={() => setOriginalExpanded((prev) => !prev)}
        >
          <div className="space-y-4">
            {!original && (
              <p className="rounded-xl bg-appMuted p-4 text-sm text-appSubtext">
                لا يوجد عقد تأسيس مرتبط بهذه الشركة
              </p>
            )}

            {original && (
              <>
                <p className="text-xs text-appSubtext">
                  عقد التأسيس الأصلي لا يتم تعديله مباشرة — التعديلات تتم عبر عقد التعديل أعلاه
                </p>

                <ViewButtons activeView={originalView} onView={setOriginalView} />

                {originalView === "pdf" && <PdfFrame blobUrl={originalPdfUrl} />}

                {originalView === "data" && (
                  <div className="space-y-4">
                    {!originalJson?.articles?.length ? (
                      <p className="rounded-xl bg-appMuted p-4 text-sm text-appSubtext">
                        {originalJsonError
                          ? "تعذر تحميل بيانات عقد التأسيس"
                          : "لا تتوفر بيانات منظمة لعقد التأسيس"}
                      </p>
                    ) : (
                      <>
                        {originalJson.company_name && (
                          <div className="rounded-2xl border border-appBorder bg-appSurface p-6 shadow-panel">
                            <div className="flex items-center gap-3">
                              <Building2 className="h-5 w-5 text-brand" />
                              <h3 className="text-lg font-extrabold text-appText">
                                {originalJson.company_name}
                              </h3>
                            </div>
                          </div>
                        )}

                        <div className="rounded-2xl border border-appBorder bg-appSurface p-6 shadow-panel">
                          <div className="mb-5 flex items-center gap-3">
                            <FileText className="h-5 w-5 text-brand" />
                            <h2 className="text-lg font-extrabold text-appText">مواد العقد</h2>
                            <span className="rounded-lg bg-appMuted px-2.5 py-1 text-xs font-bold text-appSubtext">
                              {originalJson.articles.length} مادة
                            </span>
                          </div>

                          <div className="space-y-4">
                            {originalJson.articles.map((article, index) => {
                              const modified = amendmentData?.sections.find(
                                (section) =>
                                  String(section.articleId) === String(article.id) &&
                                  section.afterText,
                              );
                              return (
                                <OriginalArticle
                                  key={article.id ?? index}
                                  article={article}
                                  index={index}
                                  modified={modified}
                                />
                              );
                            })}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </AccordionCard>

        {/* ======================= Review actions ======================= */}
        <div className="rounded-2xl border border-appBorder bg-appSurface p-4 shadow-panel">
          <div className="flex flex-wrap items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleReturn}
              disabled={!!actionBusy}
              className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white shadow-panel ui-transition hover:bg-brandDeep disabled:opacity-50"
            >
              {actionBusy === "return" ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <PenLine size={16} />
              )}
              تعديل المهمة
            </button>

            <button
              type="button"
              onClick={handleApprove}
              disabled={!!actionBusy}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-panel ui-transition hover:bg-emerald-700 disabled:opacity-50"
            >
              {actionBusy === "approve" ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <CheckCircle2 size={16} />
              )}
              قبول المهمة
            </button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
