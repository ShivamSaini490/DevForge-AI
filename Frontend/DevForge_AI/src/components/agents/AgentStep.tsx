import { Check, Circle, LoaderCircle, X } from 'lucide-react'
import { agentInfo } from '../../constants/agentNames'
import type { AgentProgress } from '../../types/execution'

export default function AgentStep({ agent }: { agent: AgentProgress }) {
  const info = agentInfo(agent.id)
  const Icon = agent.state === 'done' ? Check : agent.state === 'failed' ? X : agent.state === 'active' ? LoaderCircle : Circle
  return <li className={`agent-step agent-${agent.state}`} aria-current={agent.state === 'active' ? 'step' : undefined}>
    <span className="agent-step-icon" aria-hidden="true"><Icon size={18} /></span>
    <div><details><summary title={info.description}><strong>{info.label}</strong><span className="agent-state">{agent.state}</span></summary><p>{info.description}</p></details>
      {agent.state === 'active' && <p className="agent-current">{agent.message ?? info.description}</p>}
      {agent.state === 'failed' && <p>{agent.message ?? 'This stage could not finish. Check the logs for details.'}</p>}
    </div>
  </li>
}
