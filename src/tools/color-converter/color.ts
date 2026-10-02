export type ColorFormat = 'hex' | 'rgb' | 'hsl'
export type ColorValues = { hex: string; r: string; g: string; b: string; h: string; s: string; l: string }
export type ColorResult = { hex: string; rgb: string; hsl: string }

// Normalize only fullwidth ASCII; do not accept unrelated compatibility glyphs.
const normalize = (text: string) => text.replace(/[！-～]/g, character => String.fromCharCode(character.charCodeAt(0) - 0xfee0)).trim()
const cycleHue = (hue: number) => { const remainder = hue % 360; return remainder < 0 ? remainder + 360 : remainder }
const display = (value: number) => Number(value.toFixed(4))

function numberField(text: string, label: string, min: number, max: number, integer = false) {
  if (text.length > 32) throw new Error(`${label}の入力は32文字以内にしてください。`)
  const value = normalize(text)
  if (!value) throw new Error(`${label}を入力してください。`)
  const pattern = integer ? /^\d+$/ : /^[+-]?(?:\d+(?:\.\d{1,6})?|\.\d{1,6})$/
  if (!pattern.test(value)) throw new Error(`${label}は${integer ? '整数' : '小数6桁までの数値'}で入力してください。`)
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < min || parsed > max) throw new Error(`${label}は${min}〜${max}の範囲で入力してください。`)
  return parsed
}

function fromRgb(r: number, g: number, b: number): ColorResult {
  const [red, green, blue] = [r / 255, g / 255, b / 255]
  const max = Math.max(red, green, blue), min = Math.min(red, green, blue)
  const delta = max - min, light = (max + min) / 2
  let hue = 0, saturation = 0
  if (delta !== 0) {
    saturation = delta / (1 - Math.abs(2 * light - 1))
    if (max === red) hue = 60 * ((green - blue) / delta)
    else if (max === green) hue = 60 * ((blue - red) / delta + 2)
    else hue = 60 * ((red - green) / delta + 4)
  }
  return {
    hex: '#' + [r, g, b].map(channel => channel.toString(16).padStart(2, '0')).join('').toUpperCase(),
    rgb: `rgb(${r}, ${g}, ${b})`,
    hsl: `hsl(${cycleHue(display(cycleHue(hue)))}, ${display(saturation * 100)}%, ${display(light * 100)}%)`,
  }
}

export function convertColor(format: ColorFormat, values: ColorValues): ColorResult {
  if (format === 'hex') {
    const hex = normalize(values.hex)
    if (values.hex.length > 32 || !/^#(?:[\da-f]{3}|[\da-f]{6})$/i.test(hex)) throw new Error('HEXは#RGBまたは#RRGGBBで入力してください（例：#2563EB）。')
    const digits = hex.slice(1), expanded = digits.length === 3 ? [...digits].map(digit => digit + digit).join('') : digits
    return fromRgb(...[0, 2, 4].map(index => parseInt(expanded.slice(index, index + 2), 16)) as [number, number, number])
  }
  if (format === 'rgb') return fromRgb(numberField(values.r, 'R（赤）', 0, 255, true), numberField(values.g, 'G（緑）', 0, 255, true), numberField(values.b, 'B（青）', 0, 255, true))
  if (format !== 'hsl') throw new Error('入力形式を選択してください。')
  const hue = cycleHue(numberField(values.h, 'H（色相）', -360000, 360000))
  const saturation = numberField(values.s, 'S（彩度）', 0, 100) / 100
  const light = numberField(values.l, 'L（明度）', 0, 100) / 100
  const chroma = (1 - Math.abs(2 * light - 1)) * saturation
  const x = chroma * (1 - Math.abs((hue / 60) % 2 - 1)), offset = light - chroma / 2
  const sectors = [[chroma, x, 0], [x, chroma, 0], [0, chroma, x], [0, x, chroma], [x, 0, chroma], [chroma, 0, x]]
  const rgb = sectors[Math.floor(hue / 60)].map(channel => Math.round((channel + offset) * 255))
  return fromRgb(...rgb as [number, number, number])
}
