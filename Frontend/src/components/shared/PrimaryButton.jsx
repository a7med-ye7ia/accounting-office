function PrimaryButton({ children, className = "", ...props }) {
  return (
    <button
      className={`rounded-lg bg-gradient-to-b from-brand to-brandDeep px-4 py-2 text-sm font-semibold text-white shadow-panel ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export default PrimaryButton;
