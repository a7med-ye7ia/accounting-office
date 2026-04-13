export function getStatusTone(status) {
  if (status === "Overdue") return "bg-badgeRedBg text-badgeRedText";
  if (status === "Verified") return "bg-badgePurpleBg text-badgePurpleText";
  if (status === "Reviewing") return "bg-badgeBlueBg text-badgeBlueText";
  return "bg-badgeGrayBg text-badgeGrayText";
}
