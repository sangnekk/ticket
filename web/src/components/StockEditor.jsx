import { useState, useEffect } from 'react'
import { PlusIcon, TrashIcon, SaveIcon, LoadingIcon, MoveUpIcon, MoveDownIcon, InfoIcon } from './Icons'

const SECTION_TYPES = [
  { type: 'heading', label: 'Heading' },
  { type: 'text', label: 'Text' },
  { type: 'separator', label: 'Separator' },
  { type: 'image', label: 'Image' },
]

const BUTTON_STYLES = [
  { value: 'primary', label: 'Primary' },
  { value: 'secondary', label: 'Secondary' },
  { value: 'success', label: 'Success' },
  { value: 'danger', label: 'Danger' },
]

// Predefined buttons that trigger ticket creation
const TICKET_BUTTONS = [
  { id: 'ticket_create_buy', label: 'Mua Hàng', emoji: '📦', style: 'primary', description: 'Tạo ticket mua hàng' },
  { id: 'ticket_create_support', label: 'Hỗ Trợ', emoji: '❓', style: 'secondary', description: 'Tạo ticket hỗ trợ' },
]

function StockEditor({ guildId, config: externalConfig, setConfig: setExternalConfig, isLoading: externalLoading }) {
  const [config, setConfigInternal] = useState({
    enabled: true,
    sections: [],
    buttons: [],
    footer: '-# {guild.name} • {timestamp:f}'
  })
  const [isLoading, setIsLoading] = useState(false)
  const [saveStatus, setSaveStatus] = useState({ type: '', message: '' })
  const [showPlaceholders, setShowPlaceholders] = useState(false)

  // Use external config if provided, otherwise use internal
  const actualConfig = externalConfig || config
  const setConfig = setExternalConfig || setConfigInternal
  const loading = externalLoading !== undefined ? externalLoading : isLoading

  useEffect(() => {
    if (guildId && !externalConfig) {
      loadConfig()
    }
  }, [guildId])

  const loadConfig = async () => {
    if (!guildId || externalConfig) return
    setIsLoading(true)
    try {
      const res = await fetch('/api/stock-config/' + guildId)
      const data = await res.json()
      setConfigInternal(data)
    } catch (error) {
      console.error('Error:', error)
    }
    setIsLoading(false)
  }

  const saveConfig = async () => {
    if (!guildId || externalConfig) return // Don't save if using external config (App.jsx handles it)
    setIsLoading(true)
    try {
      const res = await fetch('/api/stock-config/' + guildId, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(actualConfig)
      })
      const data = await res.json()
      if (data.success) {
        setSaveStatus({ type: 'success', message: 'Saved!' })
      }
    } catch (error) {
      setSaveStatus({ type: 'error', message: 'Error!' })
    }
    setIsLoading(false)
    setTimeout(() => setSaveStatus({ type: '', message: '' }), 2000)
  }

  const addSection = (type) => {
    let newSection = { type }
    if (type === 'heading') {
      newSection.content = '## New Heading'
      newSection.level = 2
    } else if (type === 'text') {
      newSection.content = 'Text content...'
    } else if (type === 'separator') {
      newSection.divider = true
      newSection.spacing = 'small'
    } else if (type === 'image') {
      newSection.url = ''
    }
    setConfig({ ...actualConfig, sections: [...actualConfig.sections, newSection] })
  }

  const updateSection = (idx, updates) => {
    const arr = [...actualConfig.sections]
    arr[idx] = { ...arr[idx], ...updates }
    setConfig({ ...actualConfig, sections: arr })
  }

  const removeSection = (idx) => {
    setConfig({ ...actualConfig, sections: actualConfig.sections.filter((_, i) => i !== idx) })
  }

  const moveSection = (idx, dir) => {
    const newIdx = dir === 'up' ? idx - 1 : idx + 1
    if (newIdx < 0 || newIdx >= actualConfig.sections.length) return
    const arr = [...actualConfig.sections]
    const item = arr.splice(idx, 1)[0]
    arr.splice(newIdx, 0, item)
    setConfig({ ...actualConfig, sections: arr })
  }

  const addButton = () => {
    if (actualConfig.buttons.length >= 2) return // Max 2 ticket buttons
    
    // Find which ticket button is not yet added
    const existingIds = actualConfig.buttons.map(b => b.customId)
    const availableBtn = TICKET_BUTTONS.find(tb => !existingIds.includes(tb.id))
    
    if (!availableBtn) return
    
    setConfig({
      ...actualConfig,
      buttons: [...actualConfig.buttons, { 
        label: availableBtn.label, 
        emoji: availableBtn.emoji,
        style: availableBtn.style, 
        customId: availableBtn.id 
      }]
    })
  }

  const updateButton = (idx, updates) => {
    const arr = [...actualConfig.buttons]
    arr[idx] = { ...arr[idx], ...updates }
    setConfig({ ...actualConfig, buttons: arr })
  }

  const removeButton = (idx) => {
    setConfig({ ...actualConfig, buttons: actualConfig.buttons.filter((_, i) => i !== idx) })
  }

  if (!guildId) {
    return (
      <div className="p-6 text-center text-[#949ba4]">
        Please enter Guild ID
      </div>
    )
  }

  const statusClass = saveStatus.type === 'success'
    ? 'px-4 py-2 rounded-lg text-sm bg-[#23a55a]/15 text-[#23a55a]'
    : 'px-4 py-2 rounded-lg text-sm bg-[#ed4245]/15 text-[#ed4245]'

  const toggleClass = actualConfig.enabled
    ? 'px-2 py-1 rounded text-xs bg-[#23a55a]/20 text-[#23a55a]'
    : 'px-2 py-1 rounded text-xs bg-[#ed4245]/20 text-[#ed4245]'

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-[#f2f3f5]">Stock Config</h3>
          <button onClick={() => setConfig({ ...actualConfig, enabled: !actualConfig.enabled })} className={toggleClass}>
            {actualConfig.enabled ? 'ON' : 'OFF'}
          </button>
        </div>
        {!externalConfig && (
          <button onClick={saveConfig} disabled={loading} className="btn btn-primary flex items-center gap-2">
            {loading ? <LoadingIcon className="w-4 h-4 animate-spin" /> : <SaveIcon className="w-4 h-4" />}
            Save
          </button>
        )}
      </div>

      {saveStatus.message ? <div className={statusClass}>{saveStatus.message}</div> : null}

      <div className="bg-[#2b2d31] rounded-lg border border-[#1e1f22]">
        <button onClick={() => setShowPlaceholders(!showPlaceholders)} className="w-full px-4 py-3 flex items-center justify-between hover:bg-[#35373c] rounded-lg transition-colors">
          <span className="text-sm font-medium text-[#dbdee1] flex items-center gap-2">
            <InfoIcon className="w-4 h-4 text-[#5865f2]" />
            Placeholders
          </span>
          <span className="text-xs text-[#949ba4]">{showPlaceholders ? '▲' : '▼'}</span>
        </button>
        {showPlaceholders && (
          <div className="px-4 pb-4 space-y-4">
            {/* User Placeholders */}
            <div>
              <h4 className="text-xs font-semibold text-[#5865f2] uppercase tracking-wider mb-2 flex items-center gap-2">
                <span className="w-5 h-5 bg-[#5865f2]/20 rounded flex items-center justify-center">👤</span>
                User
              </h4>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { key: '{user}', desc: 'Mention' },
                  { key: '{user.tag}', desc: 'Tag' },
                  { key: '{user.name}', desc: 'Name' },
                  { key: '{user.id}', desc: 'ID' },
                  { key: '{user.avatar}', desc: 'Avatar' },
                ].map(p => (
                  <div key={p.key} className="flex items-center gap-2 px-2 py-1.5 bg-[#1e1f22] rounded hover:bg-[#35373c] cursor-pointer group" onClick={() => navigator.clipboard.writeText(p.key)}>
                    <code className="text-[#5865f2] text-xs font-mono">{p.key}</code>
                    <span className="text-[#949ba4] text-xs hidden group-hover:inline">📋</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Guild Placeholders */}
            <div>
              <h4 className="text-xs font-semibold text-[#23a55a] uppercase tracking-wider mb-2 flex items-center gap-2">
                <span className="w-5 h-5 bg-[#23a55a]/20 rounded flex items-center justify-center">🏠</span>
                Guild
              </h4>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { key: '{guild.name}', desc: 'Name' },
                  { key: '{guild.id}', desc: 'ID' },
                  { key: '{guild.memberCount}', desc: 'Members' },
                  { key: '{guild.icon}', desc: 'Icon' },
                ].map(p => (
                  <div key={p.key} className="flex items-center gap-2 px-2 py-1.5 bg-[#1e1f22] rounded hover:bg-[#35373c] cursor-pointer group" onClick={() => navigator.clipboard.writeText(p.key)}>
                    <code className="text-[#23a55a] text-xs font-mono">{p.key}</code>
                    <span className="text-[#949ba4] text-xs hidden group-hover:inline">📋</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Time Placeholders */}
            <div>
              <h4 className="text-xs font-semibold text-[#fee75c] uppercase tracking-wider mb-2 flex items-center gap-2">
                <span className="w-5 h-5 bg-[#fee75c]/20 rounded flex items-center justify-center">⏰</span>
                Time
              </h4>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { key: '{timestamp}', desc: 'Unix' },
                  { key: '{timestamp:R}', desc: 'Relative' },
                  { key: '{timestamp:F}', desc: 'Full' },
                  { key: '{timestamp:f}', desc: 'Short' },
                  { key: '{timestamp:D}', desc: 'Date' },
                  { key: '{timestamp:T}', desc: 'Time' },
                  { key: '{date}', desc: 'Date VN' },
                  { key: '{time}', desc: 'Time VN' },
                ].map(p => (
                  <div key={p.key} className="flex items-center gap-2 px-2 py-1.5 bg-[#1e1f22] rounded hover:bg-[#35373c] cursor-pointer group" onClick={() => navigator.clipboard.writeText(p.key)}>
                    <code className="text-[#fee75c] text-xs font-mono">{p.key}</code>
                    <span className="text-[#949ba4] text-xs hidden group-hover:inline">📋</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Other Placeholders */}
            <div>
              <h4 className="text-xs font-semibold text-[#eb459e] uppercase tracking-wider mb-2 flex items-center gap-2">
                <span className="w-5 h-5 bg-[#eb459e]/20 rounded flex items-center justify-center">📌</span>
                Other
              </h4>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { key: '{channel}', desc: 'Channel' },
                ].map(p => (
                  <div key={p.key} className="flex items-center gap-2 px-2 py-1.5 bg-[#1e1f22] rounded hover:bg-[#35373c] cursor-pointer group" onClick={() => navigator.clipboard.writeText(p.key)}>
                    <code className="text-[#eb459e] text-xs font-mono">{p.key}</code>
                    <span className="text-[#949ba4] text-xs hidden group-hover:inline">📋</span>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-xs text-[#949ba4] text-center pt-2 border-t border-[#1e1f22]">
              Click để copy placeholder
            </p>
          </div>
        )}
      </div>

      <div className="flex gap-2 flex-wrap">
        {SECTION_TYPES.map((st) => (
          <button key={st.type} onClick={() => addSection(st.type)} className="px-3 py-1.5 bg-[#2b2d31] hover:bg-[#35373c] rounded-lg text-sm text-[#dbdee1]">
            + {st.label}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {actualConfig.sections.map((sec, idx) => (
          <SectionItem
            key={idx}
            section={sec}
            index={idx}
            total={actualConfig.sections.length}
            onUpdate={(u) => updateSection(idx, u)}
            onRemove={() => removeSection(idx)}
            onMove={(d) => moveSection(idx, d)}
          />
        ))}
      </div>

      <div className="bg-[#2b2d31] rounded-lg p-4 border border-[#1e1f22]">
        <label className="text-sm font-medium text-[#dbdee1] mb-2 block">Footer</label>
        <input
          type="text"
          value={actualConfig.footer || ''}
          onChange={(e) => setConfig({ ...actualConfig, footer: e.target.value })}
          className="w-full px-3 py-2 bg-[#1e1f22] rounded text-sm text-[#dbdee1]"
        />
      </div>

      <div className="bg-[#2b2d31] rounded-lg p-4 border border-[#1e1f22]">
        <div className="flex justify-between items-center mb-3">
          <label className="text-sm font-medium text-[#dbdee1]">Ticket Buttons ({actualConfig.buttons.length}/2)</label>
          <button onClick={addButton} disabled={actualConfig.buttons.length >= 2} className="px-2 py-1 bg-[#5865f2] rounded text-xs text-white disabled:opacity-50">
            + Add
          </button>
        </div>
        <p className="text-xs text-[#949ba4] mb-3">Buttons sẽ tạo ticket khi click (Mua Hàng / Hỗ Trợ)</p>
        <div className="space-y-2">
          {actualConfig.buttons.map((btn, idx) => (
            <TicketButtonItem key={idx} button={btn} onUpdate={(u) => updateButton(idx, u)} onRemove={() => removeButton(idx)} />
          ))}
        </div>
      </div>

      <div className="p-3 bg-[#1e1f22] rounded-lg text-sm text-[#949ba4]">
        Use <code className="px-1 bg-[#2b2d31] rounded text-[#5865f2]">+stock</code> in Discord
      </div>
    </div>
  )
}

function SectionItem({ section, index, total, onUpdate, onRemove, onMove }) {
  return (
    <div className="bg-[#2b2d31] rounded-lg border border-[#1e1f22] p-3">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm text-[#dbdee1] flex-1 capitalize">{section.type}</span>
        <button onClick={() => onMove('up')} disabled={index === 0} className="p-1 text-[#949ba4] disabled:opacity-30">
          <MoveUpIcon className="w-4 h-4" />
        </button>
        <button onClick={() => onMove('down')} disabled={index === total - 1} className="p-1 text-[#949ba4] disabled:opacity-30">
          <MoveDownIcon className="w-4 h-4" />
        </button>
        <button onClick={onRemove} className="p-1 text-[#949ba4] hover:text-[#ed4245]">
          <TrashIcon className="w-4 h-4" />
        </button>
      </div>

      {section.type === 'heading' ? (
        <div className="space-y-2">
          <select
            value={section.level || 2}
            onChange={(e) => onUpdate({ level: parseInt(e.target.value) })}
            className="w-full px-3 py-2 bg-[#1e1f22] rounded text-sm text-[#dbdee1]"
          >
            <option value={1}>H1</option>
            <option value={2}>H2</option>
            <option value={3}>H3</option>
          </select>
          <input
            type="text"
            value={section.content || ''}
            onChange={(e) => onUpdate({ content: e.target.value })}
            className="w-full px-3 py-2 bg-[#1e1f22] rounded text-sm text-[#dbdee1]"
          />
        </div>
      ) : null}

      {section.type === 'text' ? (
        <textarea
          value={section.content || ''}
          onChange={(e) => onUpdate({ content: e.target.value })}
          rows={3}
          className="w-full px-3 py-2 bg-[#1e1f22] rounded text-sm text-[#dbdee1] resize-none"
        />
      ) : null}

      {section.type === 'separator' ? (
        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-sm text-[#dbdee1]">
            <input
              type="checkbox"
              checked={section.divider !== false}
              onChange={(e) => onUpdate({ divider: e.target.checked })}
            />
            Divider
          </label>
          <select
            value={section.spacing || 'small'}
            onChange={(e) => onUpdate({ spacing: e.target.value })}
            className="px-2 py-1 bg-[#1e1f22] rounded text-sm text-[#dbdee1]"
          >
            <option value="small">Small</option>
            <option value="large">Large</option>
          </select>
        </div>
      ) : null}

      {section.type === 'image' ? (
        <input
          type="text"
          value={section.url || ''}
          onChange={(e) => onUpdate({ url: e.target.value })}
          className="w-full px-3 py-2 bg-[#1e1f22] rounded text-sm text-[#dbdee1]"
          placeholder="Image URL"
        />
      ) : null}
    </div>
  )
}

function ButtonItem({ button, onUpdate, onRemove }) {
  const isLink = button.style === 'link'
  return (
    <div className="flex gap-2 items-center bg-[#1e1f22] rounded p-2">
      <input
        type="text"
        value={button.emoji || ''}
        onChange={(e) => onUpdate({ emoji: e.target.value })}
        className="w-12 px-2 py-1 bg-[#2b2d31] rounded text-center text-sm"
        placeholder="😀"
      />
      <input
        type="text"
        value={button.label || ''}
        onChange={(e) => onUpdate({ label: e.target.value })}
        className="flex-1 px-2 py-1 bg-[#2b2d31] rounded text-sm text-[#dbdee1]"
        placeholder="Label"
      />
      <select
        value={button.style || 'primary'}
        onChange={(e) => onUpdate({ style: e.target.value })}
        className="px-2 py-1 bg-[#2b2d31] rounded text-sm text-[#dbdee1]"
      >
        {BUTTON_STYLES.map((s) => (
          <option key={s.value} value={s.value}>{s.label}</option>
        ))}
      </select>
      <input
        type="text"
        value={isLink ? (button.url || '') : (button.customId || '')}
        onChange={(e) => onUpdate(isLink ? { url: e.target.value } : { customId: e.target.value })}
        className="w-28 px-2 py-1 bg-[#2b2d31] rounded text-sm text-[#dbdee1]"
        placeholder={isLink ? 'URL' : 'Custom ID'}
      />
      <button onClick={onRemove} className="p-1 text-[#949ba4] hover:text-[#ed4245]">
        <TrashIcon className="w-4 h-4" />
      </button>
    </div>
  )
}

// Ticket Button Item - only allows editing label, emoji, style (customId is fixed)
function TicketButtonItem({ button, onUpdate, onRemove }) {
  const ticketType = TICKET_BUTTONS.find(tb => tb.id === button.customId)
  
  return (
    <div className="flex gap-2 items-center bg-[#1e1f22] rounded p-2">
      <input
        type="text"
        value={button.emoji || ''}
        onChange={(e) => onUpdate({ emoji: e.target.value })}
        className="w-12 px-2 py-1 bg-[#2b2d31] rounded text-center text-sm"
        placeholder="😀"
      />
      <input
        type="text"
        value={button.label || ''}
        onChange={(e) => onUpdate({ label: e.target.value })}
        className="flex-1 px-2 py-1 bg-[#2b2d31] rounded text-sm text-[#dbdee1]"
        placeholder="Label"
      />
      <select
        value={button.style || 'primary'}
        onChange={(e) => onUpdate({ style: e.target.value })}
        className="px-2 py-1 bg-[#2b2d31] rounded text-sm text-[#dbdee1]"
      >
        {BUTTON_STYLES.map((s) => (
          <option key={s.value} value={s.value}>{s.label}</option>
        ))}
      </select>
      <span className="px-2 py-1 bg-[#5865f2]/20 text-[#5865f2] rounded text-xs whitespace-nowrap">
        {ticketType?.description || button.customId}
      </span>
      <button onClick={onRemove} className="p-1 text-[#949ba4] hover:text-[#ed4245]">
        <TrashIcon className="w-4 h-4" />
      </button>
    </div>
  )
}

export default StockEditor
