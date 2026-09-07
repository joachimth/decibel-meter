import type { Tab } from '../types'

interface TabBarProps {
  active: Tab
  onChange: (tab: Tab) => void
  isListening: boolean
}

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'meter', label: 'Meter', icon: 'M' },
  { id: 'spectrum', label: 'Spectrum', icon: '∿' },
  { id: 'dosimeter', label: 'Dose', icon: '%' },
  { id: 'history', label: 'History', icon: '◷' },
  { id: 'settings', label: 'Settings', icon: '⚙' },
]

export function TabBar({ active, onChange, isListening }: TabBarProps) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 flex items-center justify-around bg-meter-bg/95 backdrop-blur-md border-t border-meter-border z-50"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {TABS.map((tab) => {
        const isActive = active === tab.id
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`flex flex-col items-center justify-center py-2 px-1 flex-1 transition-colors min-h-[44px] ${
              isActive ? 'text-meter-glow' : 'text-slate-500'
            }`}
          >
            <span
              className={`text-lg font-mono leading-none ${isActive && isListening ? 'rec-pulse' : ''}`}
              style={{ fontWeight: isActive ? 700 : 400 }}
            >
              {tab.icon}
            </span>
            <span className="text-[9px] font-mono mt-0.5 uppercase tracking-wide">{tab.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
