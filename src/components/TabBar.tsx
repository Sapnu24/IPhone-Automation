import { NavLink } from 'react-router-dom'
import { IconChart, IconGear, IconHome, IconTimer, IconWallet } from './Icons'

const tabs = [
  { to: '/', label: 'Home', Icon: IconHome, end: true },
  { to: '/money', label: 'Money', Icon: IconWallet, end: false },
  { to: '/focus', label: 'Focus', Icon: IconTimer, end: false },
  { to: '/insights', label: 'Insights', Icon: IconChart, end: false },
  { to: '/settings', label: 'Settings', Icon: IconGear, end: false },
]

export default function TabBar() {
  return (
    <nav className="tabbar" aria-label="Primary">
      {tabs.map(({ to, label, Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) => 'tabbar__item' + (isActive ? ' is-active' : '')}
        >
          <Icon />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
