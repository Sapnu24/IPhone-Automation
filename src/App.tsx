import { HashRouter, Route, Routes } from 'react-router-dom'
import { AppProvider, useApp } from './store'
import TabBar from './components/TabBar'
import HomeScreen from './features/home/HomeScreen'
import MoneyScreen from './features/money/MoneyScreen'
import FocusScreen from './features/focus/FocusScreen'
import InsightsScreen from './features/insights/InsightsScreen'
import SettingsScreen from './features/settings/SettingsScreen'

function Splash() {
  return (
    <div className="screen" style={{ display: 'grid', placeItems: 'center', minHeight: '70vh' }}>
      <div style={{ textAlign: 'center', opacity: 0.7 }}>
        <div style={{ fontSize: 44 }}>⚓️</div>
        <div style={{ fontWeight: 800, marginTop: 8 }}>Anchor</div>
      </div>
    </div>
  )
}

function Shell() {
  const { loading } = useApp()
  return (
    <div className="app">
      {loading ? (
        <Splash />
      ) : (
        <Routes>
          <Route path="/" element={<HomeScreen />} />
          <Route path="/money" element={<MoneyScreen />} />
          <Route path="/focus" element={<FocusScreen />} />
          <Route path="/insights" element={<InsightsScreen />} />
          <Route path="/settings" element={<SettingsScreen />} />
        </Routes>
      )}
      {!loading && <TabBar />}
    </div>
  )
}

export default function App() {
  return (
    <HashRouter>
      <AppProvider>
        <Shell />
      </AppProvider>
    </HashRouter>
  )
}
