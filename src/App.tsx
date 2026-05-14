import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
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
import Login from '@/pages/Login'
import Register from '@/pages/Register'
import Dashboard from '@/pages/Dashboard'
import CreatePolicy from '@/pages/CreatePolicy'
import NotFound from '@/pages/NotFound'

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
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/create/policy" element={<CreatePolicy />} />
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
    </BrowserRouter>
  )
}
