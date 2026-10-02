import { readFile, writeFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import { tools } from '../src/tools/registry.ts'
import { categoryLabels } from '../src/types/tool.ts'

export const SITE_ORIGIN = 'https://poketsuru.com'
export const START = '<!-- public-tools:start -->'
export const END = '<!-- public-tools:end -->'
const newline = text => text.replace(/\r\n/g,'\n')
const label = text => text.replace(/[\\[\]]/g, character => '\\' + character)

export function cataloguePaths(entries) {
  const paths = entries.map(tool => {
    if (!/^\/tools\/[a-z0-9]+(?:-[a-z0-9]+)*$/.test(tool.path)) throw new Error('Invalid public tool path: ' + tool.path)
    if (!tool.id || !tool.name || !Object.hasOwn(categoryLabels, tool.category)) throw new Error('Invalid tool metadata: ' + tool.id)
    return tool.path
  })
  if (new Set(paths).size !== paths.length) throw new Error('Duplicate public tool paths')
  if (new Set(entries.map(tool => tool.id)).size !== entries.length) throw new Error('Duplicate tool IDs')
  return ['/', ...paths]
}

export function renderSitemap(entries = tools) {
  return '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + cataloguePaths(entries).map(path => '  <url><loc>' + SITE_ORIGIN + path + '</loc></url>').join('\n') + '\n</urlset>\n'
}

export function renderCatalogue(entries = tools) {
  cataloguePaths(entries)
  const categories = Object.keys(categoryLabels).filter(category => entries.some(tool => tool.category === category))
  return ['公開ツール：' + entries.length + '件。現在ツールが登録されているカテゴリ：' + categories.length + '種類。', '', ...categories.flatMap(category => ['### ' + categoryLabels[category], '', ...entries.filter(tool => tool.category === category).map(tool => '- [' + label(tool.name) + '](' + SITE_ORIGIN + tool.path + ')'), ''])].join('\n')
}

export function renderReadme(current, entries = tools) {
  const starts = current.split(START).length - 1, ends = current.split(END).length - 1
  const block = START + '\n' + renderCatalogue(entries) + END
  if (starts === 0 && ends === 0) return current.trimEnd() + '\n\n## 公開ツール一覧\n\nレジストリから生成しています。ツール追加時は `node scripts/sync-catalogue.mjs`、確認は `node scripts/sync-catalogue.mjs --check` を実行してください。サイトマップも同時に更新します。\n\n' + block + '\n'
  if (starts !== 1 || ends !== 1 || current.indexOf(START) >= current.indexOf(END)) throw new Error('Invalid README catalogue markers')
  return current.slice(0,current.indexOf(START)) + block + current.slice(current.indexOf(END) + END.length)
}

export async function syncCatalogue(check = false) {
  const readmeUrl = new URL('../README.md',import.meta.url), sitemapUrl = new URL('../public/sitemap.xml',import.meta.url)
  const readme = await readFile(readmeUrl,'utf8')
  const outputs = [[readmeUrl,renderReadme(readme)], [sitemapUrl,renderSitemap()]]
  if (check) {
    for (const [url,expected] of outputs) {
      const actual = await readFile(url,'utf8')
      if (newline(actual) !== newline(expected)) throw new Error('Catalogue out of date: ' + url.pathname + '; run node scripts/sync-catalogue.mjs')
    }
    console.log('PASS: README and sitemap match ' + tools.length + ' registered tools')
  } else {
    for (const [url,content] of outputs) await writeFile(url,content,'utf8')
    console.log('Updated README and sitemap for ' + tools.length + ' registered tools')
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await syncCatalogue(process.argv.includes('--check'))
