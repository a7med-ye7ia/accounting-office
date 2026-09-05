import React, { useEffect, useState } from "react";
import {
  X,
  Save,
  Plus,
  Trash2,
  Edit3,
  Check,
  FileText,
  ChevronDown,
  ChevronUp,
  Download,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import html2pdf from "html2pdf.js";

/*
  FinalContractReview

  Expected data shape:

  {
    companyName: "اسم الشركة",
    title: "عقد تعديل المواد",
    modificationCount: 2,

    partyLines: [
      "السيد / ........",
      "السيدة / ........"
    ],

    preambleTitle: "تمهيد",
    preambleText: "النص التمهيدي...",

    modifications: [
      {
        articleId: "7",
        before: "النص القديم...",
        after: "النص الجديد..."
      }
    ]
  }

  Props:

  open
  data
  onChange
  onClose
  onSave
  saving
  readOnly

  readOnly:
    false -> normal editing mode
    true  -> view-only mode
*/


/* =========================================================
   EditableText
   ========================================================= */

function EditableText({
  value,
  onChange,
  className = "",
  multiline = true,
  placeholder = "",
  readOnly = false,
}) {
  const [editing, setEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value ?? "");

  useEffect(() => {
    setLocalValue(value ?? "");
  }, [value]);

  const startEditing = () => {
    if (readOnly) return;

    setLocalValue(value ?? "");
    setEditing(true);
  };

  const saveEditing = () => {
    onChange(localValue);
    setEditing(false);
  };

  const cancelEditing = () => {
    setLocalValue(value ?? "");
    setEditing(false);
  };

  /* =========================================================
     READ ONLY MODE
     ========================================================= */

  if (readOnly) {
    return (
      <div
        className={`
          rounded-lg
          px-4
          py-3
          ${className}
        `}
      >
        <div className="whitespace-pre-wrap leading-8 text-gray-800">
          {value || (
            <span className="text-gray-400">
              {placeholder || "لا يوجد نص"}
            </span>
          )}
        </div>
      </div>
    );
  }

  /* =========================================================
     EDITING MODE
     ========================================================= */

  if (editing) {
    return (
      <div className="relative">
        {multiline ? (
          <textarea
            autoFocus
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            placeholder={placeholder}
            className={`
              w-full
              min-h-[140px]
              resize-y
              rounded-lg
              border
              border-gray-300
              bg-white
              px-4
              py-3
              text-right
              text-gray-900
              leading-8
              outline-none
              focus:border-blue-500
              focus:ring-2
              focus:ring-blue-100
              ${className}
            `}
          />
        ) : (
          <input
            autoFocus
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            placeholder={placeholder}
            className={`
              w-full
              rounded-lg
              border
              border-gray-300
              bg-white
              px-4
              py-3
              text-right
              text-gray-900
              outline-none
              focus:border-blue-500
              focus:ring-2
              focus:ring-blue-100
              ${className}
            `}
          />
        )}

        <div className="mt-2 flex items-center justify-start gap-2">
          <button
            type="button"
            onClick={saveEditing}
            className="
              inline-flex
              items-center
              gap-1.5
              rounded-md
              bg-green-600
              px-3
              py-1.5
              text-sm
              font-medium
              text-white
              hover:bg-green-700
            "
          >
            <Check size={15} />
            حفظ
          </button>

          <button
            type="button"
            onClick={cancelEditing}
            className="
              rounded-md
              border
              border-gray-300
              bg-white
              px-3
              py-1.5
              text-sm
              text-gray-700
              hover:bg-gray-50
            "
          >
            إلغاء
          </button>
        </div>
      </div>
    );
  }

  /* =========================================================
     NORMAL DISPLAY MODE
     ========================================================= */

  return (
    <div
      onClick={startEditing}
      className={`
        group
        relative
        cursor-text
        rounded-lg
        border
        border-transparent
        px-4
        py-3
        transition
        hover:border-blue-200
        hover:bg-blue-50/30
        ${className}
      `}
      title="اضغط للتعديل"
    >
      <div className="absolute left-2 top-2 hidden rounded-md bg-blue-100 p-1.5 text-blue-600 group-hover:block">
        <Edit3 size={14} />
      </div>

      <div className="whitespace-pre-wrap leading-8 text-gray-800">
        {value || (
          <span className="text-gray-400">
            {placeholder || "اضغط هنا لإضافة النص"}
          </span>
        )}
      </div>
    </div>
  );
}


/* =========================================================
   EditableMarkdown
   ========================================================= */

function EditableMarkdown({
  value,
  onChange,
  readOnly = false,
}) {
  const [editing, setEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value ?? "");

  useEffect(() => {
    setLocalValue(value ?? "");
  }, [value]);

  /* =========================================================
     EDITING MODE
     ========================================================= */

  if (editing && !readOnly) {
    return (
      <div className="rounded-xl border border-blue-300 bg-blue-50/20 p-4">
        <textarea
          autoFocus
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          className="
            min-h-[220px]
            w-full
            resize-y
            rounded-lg
            border
            border-gray-300
            bg-white
            p-4
            text-right
            leading-8
            text-gray-900
            outline-none
            focus:border-blue-500
            focus:ring-2
            focus:ring-blue-100
          "
          dir="rtl"
        />

        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={() => {
              onChange(localValue);
              setEditing(false);
            }}
            className="
              inline-flex
              items-center
              gap-1.5
              rounded-md
              bg-green-600
              px-3
              py-1.5
              text-sm
              text-white
              hover:bg-green-700
            "
          >
            <Check size={15} />
            حفظ
          </button>

          <button
            type="button"
            onClick={() => {
              setLocalValue(value ?? "");
              setEditing(false);
            }}
            className="
              rounded-md
              border
              border-gray-300
              bg-white
              px-3
              py-1.5
              text-sm
              text-gray-700
              hover:bg-gray-50
            "
          >
            إلغاء
          </button>
        </div>
      </div>
    );
  }

  /* =========================================================
     DISPLAY MODE
     ========================================================= */

  return (
    <div
      className={`
        relative
        rounded-xl
        border
        border-transparent
        p-4
        ${
          !readOnly
            ? "group cursor-text transition hover:border-blue-200 hover:bg-blue-50/20"
            : ""
        }
      `}
      onClick={
        readOnly
          ? undefined
          : () => setEditing(true)
      }
      title={
        readOnly
          ? undefined
          : "اضغط لتعديل النص"
      }
    >
      {!readOnly && (
        <div className="absolute left-2 top-2 hidden rounded-md bg-blue-100 p-1.5 text-blue-600 group-hover:block">
          <Edit3 size={14} />
        </div>
      )}

      <div className="prose prose-sm max-w-none text-right">
        {value ? (
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              table: ({ children }) => (
                <div className="my-5 overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300 text-right">
                    {children}
                  </table>
                </div>
              ),

              thead: ({ children }) => (
                <thead className="bg-gray-100">
                  {children}
                </thead>
              ),

              tbody: ({ children }) => (
                <tbody>{children}</tbody>
              ),

              tr: ({ children }) => (
                <tr className="border-b border-gray-300">
                  {children}
                </tr>
              ),

              th: ({ children }) => (
                <th className="border border-gray-300 px-3 py-2 font-semibold text-gray-900">
                  {children}
                </th>
              ),

              td: ({ children }) => (
                <td className="border border-gray-300 px-3 py-2 text-gray-800">
                  {children}
                </td>
              ),

              p: ({ children }) => (
                <p className="mb-3 leading-8 text-gray-800">
                  {children}
                </p>
              ),

              ul: ({ children }) => (
                <ul className="mb-3 list-disc pr-6 leading-8">
                  {children}
                </ul>
              ),

              ol: ({ children }) => (
                <ol className="mb-3 list-decimal pr-6 leading-8">
                  {children}
                </ol>
              ),

              strong: ({ children }) => (
                <strong className="font-bold text-gray-900">
                  {children}
                </strong>
              ),
            }}
          >
            {value}
          </ReactMarkdown>
        ) : (
          <span className="text-gray-400">
            اضغط هنا لإضافة النص
          </span>
        )}
      </div>
    </div>
  );
}


/* =========================================================
   ArticleBlock
   ========================================================= */

function ArticleBlock({
  modification,
  index,
  onChange,
  onRemove,
  readOnly = false,
}) {
  const [collapsed, setCollapsed] = useState(false);

  const updateBefore = (value) => {
    onChange(index, {
      ...modification,
      before: value,
    });
  };

  const updateAfter = (value) => {
    onChange(index, {
      ...modification,
      after: value,
    });
  };

  return (
    <section
      className="
        mb-10
        border-b
        border-gray-300
        pb-10
      "
    >
      {/* =====================================================
          ARTICLE HEADER
          ===================================================== */}

      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-900 text-sm font-bold text-white">
            {index + 1}
          </div>

          <h3 className="text-xl font-bold text-gray-900">
            المادة {modification.articleId}
          </h3>
        </div>

        {/* ===================================================
            EDIT CONTROLS
            Hidden in read-only mode
            =================================================== */}

        {!readOnly && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                setCollapsed((prev) => !prev)
              }
              className="
                rounded-lg
                border
                border-gray-300
                bg-white
                p-2
                text-gray-600
                hover:bg-gray-50
              "
              title={
                collapsed
                  ? "إظهار"
                  : "إخفاء"
              }
            >
              {collapsed ? (
                <ChevronDown size={18} />
              ) : (
                <ChevronUp size={18} />
              )}
            </button>

            <button
              type="button"
              onClick={() => onRemove(index)}
              className="
                rounded-lg
                border
                border-red-200
                bg-red-50
                p-2
                text-red-600
                hover:bg-red-100
              "
              title="حذف التعديل"
            >
              <Trash2 size={18} />
            </button>
          </div>
        )}
      </div>

      {!collapsed && (
        <div className="space-y-8">
          {/* =================================================
              BEFORE
              ================================================= */}

          <div>
            <div className="mb-3 flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-gray-500" />

              <h4 className="text-lg font-bold text-gray-800">
                المادة {modification.articleId} قبل التعديل
              </h4>
            </div>

            <div
              className="
                rounded-xl
                border
                border-gray-300
                bg-gray-50
                p-2
              "
            >
              <EditableMarkdown
                value={modification.before}
                onChange={updateBefore}
                readOnly={readOnly}
              />
            </div>
          </div>

          {/* =================================================
              AFTER
              ================================================= */}

          <div>
            <div className="mb-3 flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-600" />

              <h4 className="text-lg font-bold text-gray-800">
                المادة {modification.articleId} بعد التعديل
              </h4>
            </div>

            <div
              className="
                rounded-xl
                border
                border-green-200
                bg-green-50/30
                p-2
              "
            >
              <EditableMarkdown
                value={modification.after}
                onChange={updateAfter}
                readOnly={readOnly}
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}


/* =========================================================
   FinalContractReview
   ========================================================= */

export default function FinalContractReview({
  open,
  data,
  onChange,
  onClose,
  onSave,
  saving = false,
  readOnly = false,
}) {
  const [localData, setLocalData] = useState(data);
  const [downloadingPdf, setDownloadingPdf] =
    useState(false);

  useEffect(() => {
    setLocalData(data);
  }, [data]);

  /*
    Keep parent state synchronized.

    If the parent doesn't provide onChange,
    the component still works locally.
  */
  const updateData = (nextData) => {
    setLocalData(nextData);

    if (onChange) {
      onChange(nextData);
    }
  };

  if (!open || !localData) {
    return null;
  }

  const modifications =
    localData.modifications ?? [];

  /* =========================================================
     PARTY LINES
     ========================================================= */

  const updatePartyLine = (index, value) => {
    if (readOnly) return;

    const nextPartyLines = [
      ...(localData.partyLines ?? []),
    ];

    nextPartyLines[index] = value;

    updateData({
      ...localData,
      partyLines: nextPartyLines,
    });
  };

  const addPartyLine = () => {
    if (readOnly) return;

    updateData({
      ...localData,
      partyLines: [
        ...(localData.partyLines ?? []),
        "",
      ],
    });
  };

  const removePartyLine = (index) => {
    if (readOnly) return;

    const nextPartyLines = (
      localData.partyLines ?? []
    ).filter((_, i) => i !== index);

    updateData({
      ...localData,
      partyLines: nextPartyLines,
    });
  };

  /* =========================================================
     MODIFICATIONS
     ========================================================= */

  const updateModification = (
    index,
    modification
  ) => {
    if (readOnly) return;

    const nextModifications = [
      ...modifications,
    ];

    nextModifications[index] = modification;

    updateData({
      ...localData,
      modifications: nextModifications,
      modificationCount:
        nextModifications.length,
    });
  };

  const removeModification = (index) => {
    if (readOnly) return;

    const nextModifications =
      modifications.filter(
        (_, i) => i !== index
      );

    updateData({
      ...localData,
      modifications: nextModifications,
      modificationCount:
        nextModifications.length,
    });
  };

  const addModification = () => {
    if (readOnly) return;

    const nextModifications = [
      ...modifications,
      {
        articleId: "",
        before: "",
        after: "",
      },
    ];

    updateData({
      ...localData,
      modifications: nextModifications,
      modificationCount:
        nextModifications.length,
    });
  };

  /* =========================================================
     PREAMBLE
     ========================================================= */

  const updatePreamble = (value) => {
    if (readOnly) return;

    updateData({
      ...localData,
      preambleText: value,
    });
  };

  /* =========================================================
     COMPANY NAME
     ========================================================= */

  const updateCompanyName = (value) => {
    if (readOnly) return;

    updateData({
      ...localData,
      companyName: value,
    });
  };

  /* =========================================================
     TITLE
     ========================================================= */

  const updateTitle = (value) => {
    if (readOnly) return;

    updateData({
      ...localData,
      title: value,
    });
  };

  /* =========================================================
     SAVE
     ========================================================= */

  const handleSave = async () => {
    if (readOnly) return;

    if (!onSave) {
      console.warn(
        "FinalContractReview: onSave was not provided."
      );
      return;
    }

    await onSave(localData);
  };

  /* =========================================================
     DOWNLOAD PDF
     ========================================================= */

  const handleDownloadPdf = async () => {
    const element = document.getElementById(
      "final-contract-document"
    );

    if (!element) {
      console.error(
        "Contract document element not found."
      );
      return;
    }

    try {
      setDownloadingPdf(true);

      const options = {
        margin: [12, 12, 12, 12],

        filename: `${
          localData.companyName || "العقد"
        } - عقد تعديل المواد.pdf`,

        image: {
          type: "jpeg",
          quality: 0.98,
        },

        html2canvas: {
          scale: 2,
          useCORS: true,
          logging: false,

          // Important for Arabic / RTL
          windowWidth: element.scrollWidth,
        },

        jsPDF: {
          unit: "mm",
          format: "a4",
          orientation: "portrait",
        },

        pagebreak: {
          mode: ["css", "legacy"],
        },
      };

      await html2pdf()
        .set(options)
        .from(element)
        .save();
    } catch (error) {
      console.error(
        "Error generating PDF:",
        error
      );
    } finally {
      setDownloadingPdf(false);
    }
  };

  return (
    <div
      className="
        fixed
        inset-0
        z-[100]
        flex
        flex-col
        bg-black/60
      "
      dir="rtl"
    >
      {/* =====================================================
          TOP BAR
          ===================================================== */}

      <header
        className="
          flex
          min-h-[64px]
          items-center
          justify-between
          border-b
          border-gray-200
          bg-white
          px-5
          shadow-sm
        "
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-900 text-white">
            <FileText size={20} />
          </div>

          <div>
            <h2 className="font-bold text-gray-900">
              مراجعة العقد النهائي
            </h2>

            <p className="text-xs text-gray-500">
              {readOnly
                ? "وضع القراءة فقط"
                : "اضغط على أي نص لتعديله"}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="
            rounded-lg
            border
            border-gray-300
            bg-white
            p-2
            text-gray-600
            hover:bg-gray-50
          "
          title="إغلاق"
        >
          <X size={22} />
        </button>
      </header>

      {/* =====================================================
          DOCUMENT AREA
          ===================================================== */}

      <main
        className="
          flex-1
          overflow-y-auto
          bg-gray-100
          px-4
          py-8
          sm:px-8
        "
      >
        <div
          id="final-contract-document"
          dir="rtl"
          className="
            mx-auto
            min-h-[1100px]
            max-w-[950px]
            bg-white
            px-8
            py-12
            shadow-xl
            sm:px-14
            sm:py-16
          "
        >
          {/* =================================================
              COMPANY NAME TOP RIGHT
              ================================================= */}

          <div className="mb-20 text-right">
            <EditableText
              value={localData.companyName}
              onChange={updateCompanyName}
              multiline={false}
              readOnly={readOnly}
              className="
                inline-block
                min-w-[220px]
                px-2
                py-1
                text-lg
                font-bold
                text-gray-900
              "
              placeholder="اسم الشركة"
            />
          </div>

          {/* =================================================
              CONTRACT TITLE
              ================================================= */}

          <div className="mb-16 text-center">
            <EditableText
              value={
                localData.title ||
                "عقد تعديل المواد"
              }
              onChange={updateTitle}
              multiline={false}
              readOnly={readOnly}
              className="
                text-3xl
                font-bold
                text-gray-900
              "
              placeholder="عنوان العقد"
            />

            <div className="mt-5">
              <span className="text-lg text-gray-700">
                عدد المواد المعدلة:
              </span>

              <span className="mr-2 text-xl font-bold text-gray-900">
                {modifications.length}
              </span>
            </div>

            <div className="mt-4">
              <EditableText
                value={localData.companyName}
                onChange={updateCompanyName}
                multiline={false}
                readOnly={readOnly}
                className="
                  inline-block
                  text-xl
                  font-bold
                  text-gray-800
                "
              />
            </div>
          </div>

          {/* =================================================
              PARTY LINES
              ================================================= */}

          <section className="mb-14">
            <div className="space-y-2">
              {(localData.partyLines ?? []).map(
                (line, index) => (
                  <div
                    key={index}
                    className="
                      group
                      flex
                      items-center
                      gap-2
                    "
                  >
                    <div className="flex-1">
                      <EditableText
                        value={line}
                        onChange={(value) =>
                          updatePartyLine(
                            index,
                            value
                          )
                        }
                        multiline={false}
                        readOnly={readOnly}
                        className="
                          text-lg
                          text-gray-800
                        "
                        placeholder="السيد / السيدة ..."
                      />
                    </div>

                    {!readOnly && (
                      <button
                        type="button"
                        onClick={() =>
                          removePartyLine(index)
                        }
                        className="
                          rounded-md
                          p-2
                          text-gray-400
                          opacity-0
                          transition
                          hover:bg-red-50
                          hover:text-red-600
                          group-hover:opacity-100
                        "
                        title="حذف"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                )
              )}
            </div>

            {!readOnly && (
              <button
                type="button"
                onClick={addPartyLine}
                className="
                  mt-3
                  inline-flex
                  items-center
                  gap-2
                  rounded-lg
                  border
                  border-dashed
                  border-gray-300
                  px-3
                  py-2
                  text-sm
                  text-gray-600
                  hover:border-blue-400
                  hover:bg-blue-50
                  hover:text-blue-600
                "
              >
                <Plus size={16} />
                إضافة سطر
              </button>
            )}
          </section>

          {/* =================================================
              PREAMBLE
              ================================================= */}

          <section className="mb-16">
            <div className="mb-5 text-center">
              <EditableText
                value={
                  localData.preambleTitle ||
                  "تمهيد"
                }
                onChange={(value) =>
                  updateData({
                    ...localData,
                    preambleTitle: value,
                  })
                }
                multiline={false}
                readOnly={readOnly}
                className="
                  inline-block
                  text-2xl
                  font-bold
                  text-gray-900
                "
              />
            </div>

            <div
              className="
                rounded-xl
                border
                border-gray-200
                bg-gray-50/50
                p-2
              "
            >
              <EditableText
                value={localData.preambleText}
                onChange={updatePreamble}
                multiline={true}
                readOnly={readOnly}
                className="
                  text-lg
                  text-gray-800
                "
                placeholder="اكتب نص التمهيد..."
              />
            </div>
          </section>

          {/* =================================================
              MODIFICATIONS
              ================================================= */}

          <section>
            {modifications.length === 0 ? (
              <div
                className="
                  rounded-xl
                  border
                  border-dashed
                  border-gray-300
                  bg-gray-50
                  p-10
                  text-center
                "
              >
                <FileText
                  size={40}
                  className="mx-auto mb-3 text-gray-400"
                />

                <p className="text-gray-600">
                  لا توجد مواد معدلة حالياً.
                </p>
              </div>
            ) : (
              modifications.map(
                (modification, index) => (
                  <ArticleBlock
                    key={`${modification.articleId}-${index}`}
                    modification={modification}
                    index={index}
                    onChange={updateModification}
                    onRemove={removeModification}
                    readOnly={readOnly}
                  />
                )
              )
            )}
          </section>

          {/* =================================================
              ADD MODIFICATION
              ================================================= */}

          {!readOnly && (
            <div className="mt-8 border-t border-gray-200 pt-8 text-center">
              <button
                type="button"
                onClick={addModification}
                className="
                  inline-flex
                  items-center
                  gap-2
                  rounded-lg
                  border
                  border-dashed
                  border-gray-400
                  px-5
                  py-3
                  text-sm
                  font-medium
                  text-gray-700
                  hover:border-blue-500
                  hover:bg-blue-50
                  hover:text-blue-600
                "
              >
                <Plus size={18} />
                إضافة مادة معدلة
              </button>
            </div>
          )}
        </div>
      </main>

      {/* =====================================================
          BOTTOM ACTION BAR
          ===================================================== */}

      <footer
        className="
          flex
          min-h-[72px]
          items-center
          justify-between
          gap-4
          border-t
          border-gray-200
          bg-white
          px-5
          shadow-[0_-4px_12px_rgba(0,0,0,0.05)]
        "
      >
        {/* Close */}

        <button
          type="button"
          onClick={onClose}
          disabled={saving}
          className="
            rounded-lg
            border
            border-gray-300
            bg-white
            px-5
            py-2.5
            text-sm
            font-medium
            text-gray-700
            hover:bg-gray-50
            disabled:cursor-not-allowed
            disabled:opacity-50
          "
        >
          إغلاق
        </button>

        <div className="flex items-center gap-3">
          {/* Number of modifications */}

          <span className="hidden text-sm text-gray-500 sm:block">
            {modifications.length} مادة معدلة
          </span>

          {/* =================================================
              DOWNLOAD PDF

              Available in both edit and read-only modes.
              ================================================= */}

          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={
              downloadingPdf || saving
            }
            className="
              inline-flex
              items-center
              gap-2
              rounded-lg
              border
              border-gray-300
              bg-white
              px-5
              py-2.5
              text-sm
              font-bold
              text-gray-800
              shadow-sm
              transition
              hover:bg-gray-50
              disabled:cursor-not-allowed
              disabled:opacity-60
            "
          >
            {downloadingPdf ? (
              <>
                <span
                  className="
                    h-4
                    w-4
                    animate-spin
                    rounded-full
                    border-2
                    border-gray-500
                    border-t-transparent
                  "
                />

                جاري إنشاء PDF...
              </>
            ) : (
              <>
                <Download size={18} />
                تحميل PDF
              </>
            )}
          </button>

          {/* =================================================
              SAVE CONTRACT

              Completely hidden in read-only mode.
              ================================================= */}

          {!readOnly && (
            <button
              type="button"
              onClick={handleSave}
              disabled={
                saving || downloadingPdf
              }
              className="
                inline-flex
                items-center
                gap-2
                rounded-lg
                bg-gray-900
                px-6
                py-2.5
                text-sm
                font-bold
                text-white
                shadow-sm
                transition
                hover:bg-gray-800
                disabled:cursor-not-allowed
                disabled:opacity-60
              "
            >
              {saving ? (
                <>
                  <span
                    className="
                      h-4
                      w-4
                      animate-spin
                      rounded-full
                      border-2
                      border-white
                      border-t-transparent
                    "
                  />

                  جاري الحفظ...
                </>
              ) : (
                <>
                  <Save size={18} />
                  حفظ العقد
                </>
              )}
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}