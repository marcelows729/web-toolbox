import { findToolByPath } from './toolRoute'
export const HOME_TITLE = 'ぽけつる - ちょっと便利なWebツール集'
export const HOME_DESCRIPTION = 'ちょっと便利なツールを、ポケットに。開発や日常作業で使えるWebツールをまとめたサイトです。'
export function pageMetadata(pathname: string) {
  const tool = findToolByPath(pathname)
  if (tool) return { title: tool.name + ' | ぽけつる', description: tool.description }
  if (pathname === '/') return { title: HOME_TITLE, description: HOME_DESCRIPTION }
  return { title: 'ページが見つかりません | ぽけつる', description: '指定されたページは見つかりません。道具一覧からツールを選んでください。' }
}
