import { useEffect, useState } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Layout from './components/layout/Layout'
import HomePage from './pages/HomePage'
import JsonFormatter from './tools/json-formatter/JsonFormatter'
import './App.css'

type ThemeMode = 'light' | 'dark'

const THEME_STORAGE_KEY = 'poketsuru-theme'

const getSystemTheme = (): ThemeMode =>
  window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'

const getStoredTheme = (): ThemeMode => {
  if (typeof window === 'undefined') {
    return 'light'
  }

  try {
    const storedValue = window.localStorage.getItem(THEME_STORAGE_KEY)
    if (storedValue === 'light' || storedValue === 'dark') {
      return storedValue
    }
  } catch {
    // LocalStorageの利用に失敗してもアプリ続行
  }

  return getSystemTheme()
}

function App() {
  const [theme, setTheme] = useState<ThemeMode>(getStoredTheme)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    const syncTheme = () => {
      document.documentElement.setAttribute('data-theme', theme)
    }

    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme)
    } catch {
      // LocalStorageの利用に失敗してもアプリ続行
    }

    syncTheme()

    const handleSystemThemeChange = () => {
      if (window.localStorage.getItem(THEME_STORAGE_KEY) === null) {
        const nextTheme = getSystemTheme()
        setTheme(nextTheme)
      }
    }

    mediaQuery.addEventListener('change', handleSystemThemeChange)
    return () => mediaQuery.removeEventListener('change', handleSystemThemeChange)
  }, [theme])

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout theme={theme} setTheme={setTheme} />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/tools/json-formatter" element={<JsonFormatter />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
