import type { Plugin } from 'vite'

export function resolveIcons(): Plugin {
  return {
    name: 'resolve-icons',
    resolveId(id) {
      if (id.startsWith('@arco-design/web-react/icon/react-icon/') && !id.endsWith('.js')) {
        return id + '.js'
      }
      return null
    },
    transform(code, id) {
      if (id.includes('@arco-design/web-react/icon/index.es.js')) {
        return code.replace(
          /from '\.\/react-icon\/([^']+)\/index'/g,
          "from './react-icon/$1/index.js'"
        )
      }
      return null
    },
  }
}
