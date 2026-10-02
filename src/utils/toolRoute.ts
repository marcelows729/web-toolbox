import { matchPath } from 'react-router-dom'
import { tools } from '../tools/registry'

// Match the same case and trailing-slash rules as the tool's Route.
export function findToolByPath(pathname: string) {
  return tools.find(tool => matchPath({ path: tool.path, end: true, caseSensitive: false }, pathname) !== null)
}
