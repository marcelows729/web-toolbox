import { useEffect, useState } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Layout from './components/layout/Layout'
import HomePage from './pages/HomePage'
import NotFoundPage from './pages/NotFoundPage'
import Base64EncodeDecode from './tools/base64-encode-decode/Base64EncodeDecode'
import CharacterCounter from './tools/character-counter/CharacterCounter'
import DateCalculator from './tools/date-calculator/DateCalculator'
import JapaneseEraConverter from './tools/japanese-era-converter/JapaneseEraConverter'
import JsonFormatter from './tools/json-formatter/JsonFormatter'
import QrCodeGenerator from './tools/qr-code-generator/QrCodeGenerator'
import SqlInGenerator from './tools/sql-in-generator/SqlInGenerator'
import TextDiff from './tools/text-diff/TextDiff'
import TimestampConverter from './tools/timestamp-converter/TimestampConverter'
import UrlEncodeDecode from './tools/url-encode-decode/UrlEncodeDecode'
import UuidGenerator from './tools/uuid-generator/UuidGenerator'
import Ipv4Cidr from './tools/ipv4-cidr/Ipv4Cidr'
import Sha256 from './tools/sha256/Sha256'
import RadixConverter from './tools/radix-converter/RadixConverter'
import HtmlEscape from './tools/html-escape/HtmlEscape'
import PercentageCalculator from './tools/percentage-calculator/PercentageCalculator'
import ToolShelfProvider from './state/ToolShelfProvider'
import UnitConverter from './tools/unit-converter/UnitConverter'
import BillSplitter from './tools/bill-splitter/BillSplitter'
import RoulettePicker from './tools/roulette-picker/RoulettePicker'
import HolidayStyle from './tools/holiday-style/HolidayStyle'
import PocketCompanion from './tools/pocket-companion/PocketCompanion'
import ImageResizer from './tools/image-resizer/ImageResizer'
import ImageJoiner from './tools/image-joiner/ImageJoiner'
import UnitPriceComparison from './tools/unit-price-comparison/UnitPriceComparison'
import RecipeScaler from './tools/recipe-scaler/RecipeScaler'
import TextFormatter from './tools/text-formatter/TextFormatter'
import DurationCalculator from './tools/duration-calculator/DurationCalculator'
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
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
      </ToolShelfProvider>
    </BrowserRouter>
  )
}

export default App
