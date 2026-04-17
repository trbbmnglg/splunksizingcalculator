// variant: 'primary' (purple) | 'secondary' (black outline)
export default function ExportButton({ onClick, icon: Icon, label, variant = 'primary', disabled = false }) {
  const styles = variant === 'secondary'
    ? 'border border-black bg-white text-black hover:bg-black hover:text-white'
    : 'bg-accenture-purple text-white hover:bg-accenture-purple-dark border border-transparent';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${styles}`}
    >
      <Icon className="w-4 h-4" aria-hidden="true" />
      <span>{label}</span>
    </button>
  );
}
