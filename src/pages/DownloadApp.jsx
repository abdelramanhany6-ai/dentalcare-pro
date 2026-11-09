import { useEffect, useState } from 'react'
import { useLanguage } from '../context/LanguageContext'

export default function DownloadApp() {
  const { t } = useLanguage()
  const [installEvent, setInstallEvent] = useState(null)
  const [installed, setInstalled] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    const onPrompt = event => { event.preventDefault(); setInstallEvent(event) }
    const onInstalled = () => { setInstalled(true); setInstallEvent(null) }
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) setInstalled(true)
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  async function install() {
    if (!installEvent) return
    await installEvent.prompt()
    const choice = await installEvent.userChoice
    setMessage(choice.outcome === 'accepted'
      ? t('تم بدء تثبيت التطبيق.','App installation was accepted.')
      : t('تقدر تثبت التطبيق في أي وقت من قائمة المتصفح.','You can install the app later from your browser menu.'))
    setInstallEvent(null)
  }

  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent)
  return <main className="download-page" dir={t('rtl','ltr')}>
    <section className="download-card">
      <img src="/icon.svg" alt="DentalCare Pro" className="download-icon" />
      <p className="eyebrow">DENTAL CLINIC MANAGEMENT</p>
      <h1>DentalCare Pro</h1>
      <p className="download-description">{t('نظام إدارة عيادة الأسنان، متاح على الموبايل والكمبيوتر.','Dental clinic management, available on mobile and desktop.')}</p>
      {installed
        ? <p className="success-message">{t('التطبيق مثبت بالفعل على هذا الجهاز.','The app is already installed on this device.')}</p>
        : installEvent
          ? <button className="download-install" onClick={install}>{t('تثبيت التطبيق','Install app')}</button>
          : <div className="download-instructions">
              <strong>{isIOS ? t('لتثبيت التطبيق على iPhone / iPad','Install on iPhone / iPad') : t('تثبيت التطبيق من المتصفح','Install from your browser')}</strong>
              <p>{isIOS
                ? t('افتح الرابط في Safari، اضغط مشاركة، ثم اختر Add to Home Screen / إضافة إلى الشاشة الرئيسية.','Open this link in Safari, tap Share, then choose Add to Home Screen.')
                : t('افتح قائمة المتصفح ⋮ ثم اختر Install app أو تثبيت التطبيق أو Add to Home screen إذا كان الخيار متاحًا.','Open your browser menu ⋮ and choose Install app or Add to Home screen when available.')}</p>
            </div>}
      {message && <p className="success-message">{message}</p>}
      <a className="download-open" href="/">{t('فتح DentalCare Pro','Open DentalCare Pro')}</a>
      <p className="download-note">{t('يلزم الاتصال بالإنترنت أول مرة لفتح التطبيق وتسجيل الدخول.','An internet connection is required the first time you open the app and sign in.')}</p>
    </section>
  </main>
}
