import { Navigate, Route, Routes } from 'react-router-dom'
import DashboardPage from './features/dashboard/DashboardPage'
import WorkspacePage from './features/workspace/WorkspacePage'
import EvaluatingPage from './features/evaluation/EvaluatingPage'
import ReportPage from './features/report/ReportPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<DashboardPage />} />
      <Route path="/workspace/:id" element={<WorkspacePage />} />
      <Route path="/evaluating/:id" element={<EvaluatingPage />} />
      <Route path="/report/:id" element={<ReportPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
