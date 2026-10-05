import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { taskStatuses, type TaskStatus } from '../constants/taskStatus'
import StatusBadge from '../components/common/StatusBadge'
import Input from '../components/common/Input'
describe('shared controls', () => {
  it('exposes all six status labels without relying on color', () => {
    render(<>{(Object.keys(taskStatuses) as TaskStatus[]).map((status) => <StatusBadge key={status} status={status} />)}</>)
    for (const { label } of Object.values(taskStatuses)) expect(screen.getByText(label)).toBeInTheDocument()
  })
  it('associates a validation error with the field', () => {
    render(<Input label="Repository name" error="Enter a name." />)
    const input = screen.getByLabelText('Repository name')
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input).toHaveAccessibleDescription('Enter a name.')
  })
})
