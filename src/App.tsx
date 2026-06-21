import { BrowserRouter, Navigate, Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import { MailCheck } from 'lucide-react'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import CookieBanner from '@/components/layout/CookieBanner'
import ScrollToTop from '@/components/layout/ScrollToTop'
import Home from '@/pages/Home'
import About from '@/pages/About'
import FAQPage from '@/pages/FAQPage'
import PrivacyPolicy from '@/pages/PrivacyPolicy'
import Terms from '@/pages/Terms'
import WhyUs from '@/pages/WhyUs'
import Support from '@/pages/Support'
import Helpdesk from '@/pages/Helpdesk'
import HelpdeskTrack from '@/pages/HelpdeskTrack'
import Login from '@/pages/Login'
import Register from '@/pages/Register'
import ForgotPassword from '@/pages/ForgotPassword'
import Dashboard from '@/pages/Dashboard'
import CreatePolicy from '@/pages/CreatePolicy'
import Admin from '@/pages/Admin'
import Legal from '@/pages/Legal'
import PolicyView from '@/pages/PolicyView'
import PolicyEdit from '@/pages/PolicyEdit'
import NotFound from '@/pages/NotFound'
import { roleHome, type UserRole } from '@/utils/storage'

function ProtectedRoute({ children, roles }: { children: React.ReactNode; roles: UserRole[] }) {
  const location = useLocation()
  const { auth, loading } = useAuth()

  if (loading) return <div className="min-h-screen" style={{ backgroundColor: '#f8fafc' }} />

  if (!auth?.token) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  const role = auth.role
  if (!roles.includes(role)) return <Navigate to={roleHome(role)} replace />
  return children
}

function VerifiedRoute({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate()
  const { auth } = useAuth()

  if (auth?.emailVerified !== false) return children

  return (
    <div className="min-h-screen flex items-center justify-center p-5" style={{ backgroundColor: '#f4f6f9' }}>
      <section className="w-full max-w-md bg-white border border-gray-200 p-7" style={{ borderRadius: '8px' }}>
        <div className="w-10 h-10 flex items-center justify-center mb-5" style={{ backgroundColor: '#dcefe8', borderRadius: '6px' }}>
          <MailCheck className="w-5 h-5" style={{ color: 'var(--green)' }} aria-hidden="true" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">ยืนยันอีเมลก่อนใช้งาน</h1>
        <p className="text-sm leading-relaxed text-gray-600 mb-6">
          คุณสามารถเข้าดูบัญชีได้แล้ว แต่ต้องยืนยันอีเมลก่อนสร้างหรือจัดการนโยบาย
        </p>
        <button
          type="button"
          className="btn-green w-full py-3 text-sm"
          onClick={() => navigate('/dashboard', { replace: true, state: { view: 'settings' } })}
        >
          ไปที่ตั้งค่าบัญชี
        </button>
      </section>
    </div>
  )
}

function AnimatedRoutes() {
  const { pathname } = useLocation()
  return (
    <div key={pathname} className="page-enter">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/faq" element={<FAQPage />} />
        <Route path="/why-us" element={<WhyUs />} />
        <Route path="/support" element={<Support />} />
        <Route path="/helpdesk" element={<Helpdesk />} />
        <Route path="/helpdesk/track" element={<HelpdeskTrack />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <ScrollToTop />
          <Routes>
            <Route path="/admin" element={<ProtectedRoute roles={['admin']}><Admin /></ProtectedRoute>} />
            <Route path="/legal" element={<ProtectedRoute roles={['legal']}><Legal /></ProtectedRoute>} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/dashboard" element={<ProtectedRoute roles={['merchant']}><Dashboard /></ProtectedRoute>} />
            <Route path="/dashboard/policies/:policyId" element={<ProtectedRoute roles={['merchant']}><VerifiedRoute><PolicyEdit /></VerifiedRoute></ProtectedRoute>} />
            <Route path="/create/policy" element={<ProtectedRoute roles={['merchant']}><VerifiedRoute><CreatePolicy /></VerifiedRoute></ProtectedRoute>} />
            <Route path="/get-started" element={<Navigate to="/login" replace state={{ from: '/create/policy' }} />} />
            <Route path="/p/:slug" element={<PolicyView />} />
            <Route
              path="*"
              element={
                <>
                  <Navbar />
                  <main>
                    <AnimatedRoutes />
                  </main>
                  <Footer />
                  <CookieBanner />
                </>
              }
            />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  )
}
