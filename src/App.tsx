import { lazy, useEffect, useState } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Layout from './components/layout/Layout'
import HomePage from './pages/HomePage'
import NotFoundPage from './pages/NotFoundPage'
import ToolShelfProvider from './state/ToolShelfProvider'
import './App.css'

const Base64EncodeDecode = lazy(() => import('./tools/base64-encode-decode/Base64EncodeDecode'))
const CharacterCounter = lazy(() => import('./tools/character-counter/CharacterCounter'))
const DateCalculator = lazy(() => import('./tools/date-calculator/DateCalculator'))
const JapaneseEraConverter = lazy(() => import('./tools/japanese-era-converter/JapaneseEraConverter'))
const JsonFormatter = lazy(() => import('./tools/json-formatter/JsonFormatter'))
const QrCodeGenerator = lazy(() => import('./tools/qr-code-generator/QrCodeGenerator'))
const SqlInGenerator = lazy(() => import('./tools/sql-in-generator/SqlInGenerator'))
const TextDiff = lazy(() => import('./tools/text-diff/TextDiff'))
const TimestampConverter = lazy(() => import('./tools/timestamp-converter/TimestampConverter'))
const UrlEncodeDecode = lazy(() => import('./tools/url-encode-decode/UrlEncodeDecode'))
const UuidGenerator = lazy(() => import('./tools/uuid-generator/UuidGenerator'))
const Ipv4Cidr = lazy(() => import('./tools/ipv4-cidr/Ipv4Cidr'))
const Sha256 = lazy(() => import('./tools/sha256/Sha256'))
const RadixConverter = lazy(() => import('./tools/radix-converter/RadixConverter'))
const HtmlEscape = lazy(() => import('./tools/html-escape/HtmlEscape'))
const PercentageCalculator = lazy(() => import('./tools/percentage-calculator/PercentageCalculator'))
const UnitConverter = lazy(() => import('./tools/unit-converter/UnitConverter'))
const BillSplitter = lazy(() => import('./tools/bill-splitter/BillSplitter'))
const RoulettePicker = lazy(() => import('./tools/roulette-picker/RoulettePicker'))
const HolidayStyle = lazy(() => import('./tools/holiday-style/HolidayStyle'))
const PocketCompanion = lazy(() => import('./tools/pocket-companion/PocketCompanion'))
const ImageResizer = lazy(() => import('./tools/image-resizer/ImageResizer'))
const ImageJoiner = lazy(() => import('./tools/image-joiner/ImageJoiner'))
const UnitPriceComparison = lazy(() => import('./tools/unit-price-comparison/UnitPriceComparison'))
const RecipeScaler = lazy(() => import('./tools/recipe-scaler/RecipeScaler'))
const TextFormatter = lazy(() => import('./tools/text-formatter/TextFormatter'))
const DurationCalculator = lazy(() => import('./tools/duration-calculator/DurationCalculator'))
const RandomGrouping = lazy(() => import('./tools/random-grouping/RandomGrouping'))

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
      try {
        if (window.localStorage.getItem(THEME_STORAGE_KEY) === null) setTheme(getSystemTheme())
      } catch {
        // 保存不可でもOSテーマ変更でアプリを停止しない。
        setTheme(getSystemTheme())
      }
    }

    mediaQuery.addEventListener('change', handleSystemThemeChange)
    return () => mediaQuery.removeEventListener('change', handleSystemThemeChange)
  }, [theme])

  return (
    <BrowserRouter>
      <ToolShelfProvider>
      <Routes>
        <Route element={<Layout theme={theme} setTheme={setTheme} />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/tools/json-formatter" element={<JsonFormatter />} />
          <Route path="/tools/sql-in-generator" element={<SqlInGenerator />} />
          <Route path="/tools/timestamp-converter" element={<TimestampConverter />} />
          <Route path="/tools/character-counter" element={<CharacterCounter />} />
          <Route path="/tools/url-encode-decode" element={<UrlEncodeDecode />} />
          <Route path="/tools/base64-encode-decode" element={<Base64EncodeDecode />} />
          <Route path="/tools/uuid-generator" element={<UuidGenerator />} />
          <Route path="/tools/date-calculator" element={<DateCalculator />} />
          <Route path="/tools/japanese-era-converter" element={<JapaneseEraConverter />} />
          <Route path="/tools/qr-code-generator" element={<QrCodeGenerator />} />
          <Route path="/tools/text-diff" element={<TextDiff />} />
          <Route path="/tools/ipv4-cidr" element={<Ipv4Cidr />} />
          <Route path="/tools/sha256" element={<Sha256 />} />
          <Route path="/tools/radix-converter" element={<RadixConverter />} />
          <Route path="/tools/html-escape" element={<HtmlEscape />} />
          <Route path="/tools/percentage-calculator" element={<PercentageCalculator />} />
          <Route path="/tools/unit-converter" element={<UnitConverter />} />
          <Route path="/tools/bill-splitter" element={<BillSplitter />} />
          <Route path="/tools/roulette-picker" element={<RoulettePicker />} />
          <Route path="/tools/holiday-style" element={<HolidayStyle />} />
          <Route path="/tools/pocket-companion" element={<PocketCompanion />} />
          <Route path="/tools/image-resizer" element={<ImageResizer />} />
          <Route path="/tools/image-joiner" element={<ImageJoiner />} />
          <Route path="/tools/unit-price-comparison" element={<UnitPriceComparison />} />
          <Route path="/tools/recipe-scaler" element={<RecipeScaler />} />
          <Route path="/tools/text-formatter" element={<TextFormatter />} />
          <Route path="/tools/duration-calculator" element={<DurationCalculator />} />
          <Route path="/tools/random-grouping" element={<RandomGrouping />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
      </ToolShelfProvider>
    </BrowserRouter>
  )
}

export default App
