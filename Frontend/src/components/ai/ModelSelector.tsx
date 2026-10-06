import type { AgentConfig } from '../../types/workspace'
import Select from '../common/Select'

export interface ModelChoice { provider: string; model: string }
export default function ModelSelector({ config, value, onChange, disabled }: { config: AgentConfig; value: ModelChoice; onChange: (value: ModelChoice) => void; disabled: boolean }) {
  const provider = config.providers.find((p) => p.id === value.provider)
  return <div className="model-selector">
    <p className="muted">AI model: <strong>{value.provider === 'auto' ? 'Auto - system chooses' : `${provider?.label} / ${provider?.models.find((m) => m.id === value.model)?.label ?? 'Choose a model'}`}</strong></p>
    <details><summary>Advanced model settings</summary>
      {!config.supportsModelSelection ? <p className="muted">This workspace chooses the model automatically.</p> : <div className="form-grid">
        <Select label="Provider" value={value.provider} disabled={disabled} onChange={(event) => onChange({ provider: event.target.value, model: '' })}>
          <option value="auto">Auto - system chooses</option>
          {config.providers.map((p) => <option key={p.id} value={p.id} disabled={!p.available || !p.models.some((m) => m.available)}>{p.label}{!p.available ? ' - not configured' : !p.models.some((m) => m.available) ? ' - no available models' : ''}</option>)}
        </Select>
        {provider && <Select label="Model" value={value.model} disabled={disabled} onChange={(event) => onChange({ ...value, model: event.target.value })}>
          <option value="">Choose a model</option>{provider.models.map((m) => <option key={m.id} value={m.id} disabled={!m.available}>{m.label}{!m.available ? ' - unavailable' : ''}</option>)}
        </Select>}
        <p className="field-helper">Unavailable providers or models cannot be selected. Credentials are managed by your workspace administrator.</p>
      </div>}
    </details>
  </div>
}
