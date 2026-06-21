import { storage } from '@/utils/storage'
import { api } from '@/services/api'

export interface ContactProfile {
  name: string
  function: string
  email: string
  phone: string
  mobile: string
  website: string
  company_name: string
  vat: string
  street: string
  street2: string
  city: string
  zip: string
  state_name: string
  country_name: string
  lang: string
  odoo_id?: number
}

export const defaultProfile = (): ContactProfile => ({
  name: '', function: '', email: '', phone: '', mobile: '', website: '',
  company_name: '', vat: '', street: '', street2: '', city: '', zip: '',
  state_name: '', country_name: 'ประเทศไทย', lang: 'th_TH',
})

export const fetchContact = async (email: string): Promise<ContactProfile | null> => {
  void email
  const response = await api.profile.get()
  if (!response.success || !response.data || typeof response.data !== 'object') return null
  const profile = response.data as Record<string, unknown>
  const address = profile.address && typeof profile.address === 'object'
    ? profile.address as Record<string, unknown>
    : {}
  return {
    ...defaultProfile(),
    name: String(profile.name ?? ''),
    email: String(profile.email ?? ''),
    function: String(profile.function ?? ''),
    phone: String(profile.phone ?? ''),
    mobile: String(profile.mobile ?? ''),
    website: String(profile.website ?? ''),
    company_name: String(profile.company_name ?? ''),
    vat: String(profile.vat ?? ''),
    street: String(address.street ?? ''),
    street2: String(address.street2 ?? ''),
    city: String(address.city ?? ''),
    zip: String(address.zip ?? ''),
    state_name: String(address.state ?? ''),
    country_name: String(address.country ?? ''),
    lang: String(profile.lang ?? 'th_TH'),
  }
}

export const updateContact = async (_email: string, profile: ContactProfile): Promise<void> => {
  await api.profile.update({
    name: profile.name,
    function: profile.function,
    phone: profile.phone,
    mobile: profile.mobile,
    website: profile.website,
    company_name: profile.company_name,
    vat: profile.vat,
    lang: profile.lang,
    address: {
      street: profile.street,
      street2: profile.street2,
      city: profile.city,
      state: profile.state_name,
      zip: profile.zip,
      country: profile.country_name,
    },
  })
  const auth = storage.auth.get()
  if (auth) {
    storage.auth.set({
      ...auth,
      name: profile.name,
      email: profile.email,
      phone: profile.phone,
      company: profile.company_name,
    })
  }
}
