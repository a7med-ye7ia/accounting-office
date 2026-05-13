const palette = {
  Active: "bg-badgeBlueBg text-badgeBlueText",
  Reviewing: "bg-badgeBlueBg text-badgeBlueText",
  Pending: "bg-badgeGrayBg text-badgeGrayText",
  "Pending Review": "bg-badgeGrayBg text-badgeGrayText",
  Overdue: "bg-badgeRedBg text-badgeRedText",
  Inactive: "bg-badgeGrayBg text-badgeGrayText",
  Verified: "bg-badgePurpleBg text-badgePurpleText",
  "In Progress": "bg-badgeBlueBg text-badgeBlueText",
  "Not Started": "bg-badgeGrayBg text-badgeGrayText",
  Complete: "bg-badgeBlueBg text-badgeBlueText",
  Critical: "bg-badgeRedBg text-badgeRedText",
};

function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider ui-transition ${
        palette[status] ?? "bg-badgeGrayBg text-badgeGrayText"
      }`}
    >
      {status}
    </span>
  );
}

export default StatusBadge;
