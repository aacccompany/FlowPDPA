import Hero from '@/components/sections/Hero'
import UpdateBanner from '@/components/sections/UpdateBanner'
import PDPAInfo from '@/components/sections/PDPAInfo'
import Stats from '@/components/sections/Stats'
import ClientLogos from '@/components/sections/ClientLogos'
import CheckWebsite from '@/components/sections/CheckWebsite'
import WhyChoose from '@/components/sections/WhyChoose'
import Services from '@/components/sections/Services'
import OtherServices from '@/components/sections/OtherServices'
import OneTimeValue from '@/components/sections/OneTimeValue'
import HowItWorks from '@/components/sections/HowItWorks'
import Integrations from '@/components/sections/Integrations'
import Referral from '@/components/sections/Referral'
import Certified from '@/components/sections/Certified'
import Testimonial from '@/components/sections/Testimonial'
import FAQ from '@/components/sections/FAQ'
import Contact from '@/components/sections/Contact'

export default function Home() {
  return (
    <>
      <Hero />
      <UpdateBanner />
      <PDPAInfo />
      <Stats />
      <ClientLogos />
      <CheckWebsite />
      <WhyChoose />
      <Services />
      <OtherServices />
      <OneTimeValue />
      <HowItWorks />
      <Integrations />
      <Referral />
      <Certified />
      <Testimonial />
      <FAQ />
      <Contact />
    </>
  )
}
