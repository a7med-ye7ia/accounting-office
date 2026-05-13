function PrimaryButton({ children, className = "", ...props }) {
  return (
    <button
      type="button"
      className={`rounded-2xl bg-gradient-to-b from-brand to-brandDeep px-5 py-2.5 text-sm font-bold text-white shadow-panel ui-transition hover:brightness-110 hover:shadow-raise active:scale-[0.97] disabled:pointer-events-none disabled:opacity-45 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export default PrimaryButton;
