import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import { MailCheck } from 'lucide-react'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import CookieBanner from '@/components/layout/CookieBanner'
import ScrollToTop from '@/components/layout/ScrollToTop'
import { roleHome, type UserRole } from '@/utils/storage'
import PrivacyNoticeGate from '@/components/auth/PrivacyNoticeGate'

const Home = lazy(() => import('@/pages/Home'))
const About = lazy(() => import('@/pages/About'))
const FAQPage = lazy(() => import('@/pages/FAQPage'))
const PrivacyPolicy = lazy(() => import('@/pages/PrivacyPolicy'))
const PrivacyNotice = lazy(() => import('@/pages/PrivacyNotice'))
const Terms = lazy(() => import('@/pages/Terms'))
const WhyUs = lazy(() => import('@/pages/WhyUs'))
const Support = lazy(() => import('@/pages/Support'))
const Helpdesk = lazy(() => import('@/pages/Helpdesk'))
const HelpdeskTrack = lazy(() => import('@/pages/HelpdeskTrack'))
const Login = lazy(() => import('@/pages/Login'))
const Register = lazy(() => import('@/pages/Register'))
const ForgotPassword = lazy(() => import('@/pages/ForgotPassword'))
const Dashboard = lazy(() => import('@/pages/Dashboard'))
const CreatePolicy = lazy(() => import('@/pages/CreatePolicy'))
const Admin = lazy(() => import('@/pages/Admin'))
const Legal = lazy(() => import('@/pages/Legal'))
const PolicyView = lazy(() => import('@/pages/PolicyView'))
const PolicyEdit = lazy(() => import('@/pages/PolicyEdit'))
const NotFound = lazy(() => import('@/pages/NotFound'))

function RouteFallback() {
  return <div className="min-h-screen" style={{ backgroundColor: '#f8fafc' }} aria-busy="true" />
}

function ProtectedRoute({ children, roles }: { children: React.ReactNode; roles: UserRole[] }) {
  const location = useLocation()
  const { auth, loading } = useAuth()

  if (loading) return <div className="min-h-screen" style={{ backgroundColor: '#f8fafc' }} />

  if (!auth?.token) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  const role = auth.role
  if (role === 'merchant' && auth.emailVerified === false) {
    return (
      <Navigate
        to="/register"
        replace
        state={{ verificationEmail: auth.email, requestOtp: true }}
      />
    )
  }
  if (!roles.includes(role)) return <Navigate to={roleHome(role)} replace />
  if (role === 'merchant' && auth.privacyNoticeAccepted !== true) {
    return <PrivacyNoticeGate>{children}</PrivacyNoticeGate>
  }
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
          onClick={() => navigate('/dashboard?view=settings', { replace: true })}
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
        <Route path="/privacy-notice" element={<PrivacyNotice />} />
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
          <Suspense fallback={<RouteFallback />}>
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
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  )
}
