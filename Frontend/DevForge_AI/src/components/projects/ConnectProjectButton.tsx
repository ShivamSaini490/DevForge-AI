import { useState } from 'react'
import { Plus } from 'lucide-react'
import Button from '../common/Button'
import Modal from '../common/Modal'
import ProjectForm from './ProjectForm'
import { useAuthStore } from '../../store/authStore'

export default function ConnectProjectButton({ label = 'Create / Connect project' }: { label?: string }) {
  const owner = useAuthStore((state) => state.user?.id)
  return <ProjectButton key={owner} label={label} />
}

function ProjectButton({ label }: { label: string }) {
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)
  return <>
    <Button onClick={() => setOpen(true)}><Plus size={17} aria-hidden="true" />{label}</Button>
    <Modal open={open} onClose={() => setOpen(false)} dismissible={!pending} title="Create or connect a project">
      {open && <ProjectForm onCancel={() => setOpen(false)} onPendingChange={setPending} />}
    </Modal>
  </>
}
