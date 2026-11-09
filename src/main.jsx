import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App'
import { LanguageProvider } from './context/LanguageContext'
import './styles.css'

if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(console.error))

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode><LanguageProvider><HashRouter><App /></HashRouter></LanguageProvider></React.StrictMode>
)
