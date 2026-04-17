// Accenture brand metric tiles — solid fills (no gradients per brand guide),
// sharp corners, white text on dark purple/black, or black text on light.
const COLOR_SCHEMES = {
  'purple':          { bg: 'bg-accenture-purple',          text: 'text-white', icon: 'text-white/80',              subtitle: 'text-white/85' },
  'purple-dark':     { bg: 'bg-accenture-purple-dark',     text: 'text-white', icon: 'text-white/80',              subtitle: 'text-white/85' },
  'purple-darkest':  { bg: 'bg-accenture-purple-darkest',  text: 'text-white', icon: 'text-accenture-purple-light', subtitle: 'text-accenture-purple-light' },
  'black':           { bg: 'bg-black',                     text: 'text-white', icon: 'text-accenture-purple-light', subtitle: 'text-accenture-gray-light' },
};

export default function MetricCard({ title, value, unit, subtitle, icon: Icon, colorScheme }) {
  const c = COLOR_SCHEMES[colorScheme] || COLOR_SCHEMES['purple'];

  return (
    <div className={`${c.bg} ${c.text} p-6 border border-transparent transition-all duration-300 hover:-translate-y-1`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-medium text-sm tracking-tight opacity-90">{title}</h3>
        <Icon className={`w-5 h-5 ${c.icon}`} aria-hidden="true" />
      </div>
      <div className="text-4xl font-semibold tracking-tight mb-1">
        {value} <span className="text-xl font-medium opacity-85">{unit}</span>
      </div>
      <div className={`text-sm ${c.subtitle}`}>{subtitle}</div>
    </div>
  );
}
