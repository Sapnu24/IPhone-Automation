import { HashRouter, Route, Routes } from 'react-router-dom'
import { AppProvider, useApp } from './store'
import TabBar from './components/TabBar'
import HomeScreen from './features/home/HomeScreen'
import WalletScreen from './features/wallet/WalletScreen'
import MoneyScreen from './features/money/MoneyScreen'
import FocusScreen from './features/focus/FocusScreen'
import InsightsScreen from './features/insights/InsightsScreen'
import ChatScreen from './features/chat/ChatScreen'
import PlanScreen from './features/plan/PlanScreen'
import LedgerScreen from './features/ledger/LedgerScreen'
import NotesScreen from './features/notes/NotesScreen'
import MoreScreen from './features/more/MoreScreen'
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
          <Route path="/wallet" element={<WalletScreen />} />
          <Route path="/money" element={<MoneyScreen />} />
          <Route path="/focus" element={<FocusScreen />} />
          <Route path="/chat" element={<ChatScreen />} />
          <Route path="/plan" element={<PlanScreen />} />
          <Route path="/debt" element={<LedgerScreen direction="debt" />} />
          <Route path="/owed" element={<LedgerScreen direction="owed" />} />
          <Route path="/notes" element={<NotesScreen />} />
          <Route path="/insights" element={<InsightsScreen />} />
          <Route path="/more" element={<MoreScreen />} />
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
