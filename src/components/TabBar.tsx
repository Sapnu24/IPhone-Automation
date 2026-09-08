import { NavLink } from 'react-router-dom'
import { IconGrid, IconHome, IconReceipt, IconTimer, IconWallet } from './Icons'

const tabs = [
  { to: '/', label: 'Home', Icon: IconHome, end: true },
  { to: '/wallet', label: 'Wallet', Icon: IconWallet, end: false },
  { to: '/money', label: 'Money', Icon: IconReceipt, end: false },
  { to: '/focus', label: 'Focus', Icon: IconTimer, end: false },
  { to: '/more', label: 'More', Icon: IconGrid, end: false },
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
