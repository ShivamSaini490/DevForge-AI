import { useState } from 'react'
import { Plus } from 'lucide-react'
import Button from '../common/Button'
import Modal from '../common/Modal'

export default function ConnectProjectButton({ label = 'Create / Connect project' }: { label?: string }) {
  const [open, setOpen] = useState(false)
  return <>
    <Button onClick={() => setOpen(true)}><Plus size={17} aria-hidden="true" />{label}</Button>
    <Modal open={open} onClose={() => setOpen(false)} title="Create or connect a project">
      <p className="connection-notice">Project creation and repository connections are not available in this workspace yet. You can browse existing projects and their task summaries.</p>
      <Button variant="secondary" onClick={() => setOpen(false)}>Back to workspace</Button>
    </Modal>
  </>
}
