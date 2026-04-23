import { NavLink } from 'react-router-dom';

const tabs = [
  { to: '/', label: 'Favorites', emoji: '🍽️' },
  { to: '/planner', label: 'Planner', emoji: '📅' },
  { to: '/wheel', label: 'Wheel', emoji: '🎡' },
  { to: '/shopping', label: 'Shopping', emoji: '🛒' },
];

export default function NavBar() {
  return (
    <header className="no-print sticky top-0 z-10 bg-cream/90 backdrop-blur border-b border-orange-100">
      <div className="mx-auto max-w-6xl flex items-center gap-3 px-4 py-3">
        <div className="flex items-center gap-2 mr-auto">
          <span className="text-2xl" aria-hidden>🍕</span>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">
            Dinner<span className="text-orange-500">Wheel</span>
          </h1>
        </div>
        <nav className="flex gap-1 overflow-x-auto" aria-label="Primary">
          {tabs.map((t) => (
            <NavLink
              key={t.to}
              to={t.to}
              end={t.to === '/'}
              className={({ isActive }) =>
                [
                  'px-3 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition',
                  isActive
                    ? 'bg-orange-500 text-white shadow-soft'
                    : 'text-slate-700 hover:bg-orange-100',
                ].join(' ')
              }
            >
              <span aria-hidden className="mr-1">{t.emoji}</span>
              {t.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}
