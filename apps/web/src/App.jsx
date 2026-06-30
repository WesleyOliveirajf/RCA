import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { Layout } from '@/components/layout/Layout'
import { LoginPage } from '@/pages/LoginPage'
import { PipelinePage } from '@/pages/PipelinePage'
import { DashboardPage } from '@/pages/DashboardPage'
import { ClientesPage } from '@/pages/ClientesPage'
import { ClienteDetailPage } from '@/pages/ClienteDetailPage'
import { QualificacaoPage } from '@/pages/QualificacaoPage'
import { ConfigPage } from '@/pages/ConfigPage'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route index element={<PipelinePage />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="clientes" element={<ClientesPage />} />
              <Route path="clientes/:id" element={<ClienteDetailPage />} />
              <Route path="qualificacao" element={<QualificacaoPage />} />
              <Route path="config" element={<ConfigPage />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
