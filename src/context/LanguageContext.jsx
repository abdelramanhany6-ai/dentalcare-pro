import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const LanguageContext = createContext(null)
export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    try { return localStorage.getItem('dentalcare-language') || 'ar' } catch { return 'ar' }
  })
  useEffect(() => {
    try { localStorage.setItem('dentalcare-language', language) } catch {}
    document.documentElement.lang = language
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr'
  }, [language])
  const value = useMemo(() => ({
    language,
    setLanguage,
    t: (ar, en) => language === 'ar' ? ar : en,
    locale: language === 'ar' ? 'ar-EG' : 'en-GB',
  }), [language])
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}
export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) throw new Error('useLanguage must be used inside LanguageProvider')
  return context
}
