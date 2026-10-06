import { File, Folder } from 'lucide-react'
import type { FileMetadata } from '../../types/workspace'
import EmptyState from '../common/EmptyState'

interface Node { name: string; children: Map<string, Node>; file?: FileMetadata }
function Branch({ nodes }: { nodes: Map<string, Node> }) {
  return <ul className="file-tree">{[...nodes.values()].sort((a, b) => Number(!!b.children.size) - Number(!!a.children.size) || a.name.localeCompare(b.name)).map((node) =>
    <li key={node.name}>{node.children.size ? <details open><summary><Folder size={16} aria-hidden="true" />{node.name}</summary><Branch nodes={node.children} /></details>
      : <div className="file-entry"><span><File size={15} aria-hidden="true" />{node.name}</span><small>{node.file?.size.toLocaleString()} bytes</small></div>}</li>)}</ul>
}
export default function FileTree({ files }: { files: FileMetadata[] }) {
  const root = new Map<string, Node>()
  for (const file of files) {
    let children = root
    for (const [index, name] of file.path.split('/').entries()) {
      if (!children.has(name)) children.set(name, { name, children: new Map() })
      const node = children.get(name)!
      if (index === file.path.split('/').length - 1) node.file = file
      children = node.children
    }
  }
  return files.length ? <div className="file-summary"><p className="muted">{files.length} files · Metadata only</p><Branch nodes={root} /></div>
    : <EmptyState title="No files yet" description="File metadata will appear once the repository is prepared." />
}
