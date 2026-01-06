import { useState, useEffect } from 'react'
import { TrashIcon, SaveIcon, LoadingIcon, MoveUpIcon, MoveDownIcon, InfoIcon } from './Icons'

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

const TICKET_BUTTONS = [
  { id: 'ticket_create_buy', label: 'Mua Hang', emoji: '📦', style: 'primary', description: 'Mua hang' },
  { id: 'ticket_create_support', label: 'Ho Tro', emoji: '❓', style: 'secondary', description: 'Ho tro' },
]

function StockEditor({ guildId, config: externalConfig, setConfig: setExternalConfig, isLoading: externalLoading }) {
  const [config, setConfigInternal] = useState({ enabled: true, embeds: [] })
  const [selectedEmbedIndex, setSelectedEmbedIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [saveStatus, setSaveStatus] = useState({ type: '', message: '' })
  const [showPlaceholders, setShowPlaceholders] = useState(false)

  const actualConfig = externalConfig || config
  const setConfig = setExternalConfig || setConfigInternal
  const loading = externalLoading !== undefined ? externalLoading : isLoading
  const selectedEmbed = (actualConfig.embeds || [])[selectedEmbedIndex]

  useEffect(() => {
    if (guildId && !externalConfig) loadConfig()
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
    if (!guildId || externalConfig) return
    setIsLoading(true)
    try {
      const res = await fetch('/api/stock-config/' + guildId, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(actualConfig)
      })
      const data = await res.json()
      if (data.success) setSaveStatus({ type: 'success', message: 'Da luu!' })
    } catch (error) {
      setSaveStatus({ type: 'error', message: 'Loi!' })
    }
    setIsLoading(false)
    setTimeout(() => setSaveStatus({ type: '', message: '' }), 2000)
  }

  const addEmbed = (type = 'componentsv2') => {
    const newEmbed = {
      id: Date.now().toString(),
      type,
      sections: type === 'componentsv2' ? [] : undefined,
      buttons: [],
      footer: '-# {guild.name} - {timestamp:f}',
      title: type === 'regular' ? '' : undefined,
      description: type === 'regular' ? '' : undefined,
      color: type === 'regular' ? '#5865F2' : undefined,
      image: '',
      thumbnail: type === 'regular' ? '' : undefined,
    }
    const newEmbeds = [...(actualConfig.embeds || []), newEmbed]
    setConfig({ ...actualConfig, embeds: newEmbeds })
    setSelectedEmbedIndex(newEmbeds.length - 1)
  }

  const removeEmbed = (index) => {
    const newEmbeds = (actualConfig.embeds || []).filter((_, i) => i !== index)
    setConfig({ ...actualConfig, embeds: newEmbeds })
    if (selectedEmbedIndex >= newEmbeds.length) {
      setSelectedEmbedIndex(Math.max(0, newEmbeds.length - 1))
    }
  }

  const moveEmbed = (index, direction) => {
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= (actualConfig.embeds || []).length) return
    const newEmbeds = [...(actualConfig.embeds || [])]
    const temp = newEmbeds[index]
    newEmbeds[index] = newEmbeds[newIndex]
    newEmbeds[newIndex] = temp
    setConfig({ ...actualConfig, embeds: newEmbeds })
    setSelectedEmbedIndex(newIndex)
  }

  const updateEmbed = (updates) => {
    if (!selectedEmbed) return
    const newEmbeds = [...(actualConfig.embeds || [])]
    newEmbeds[selectedEmbedIndex] = { ...newEmbeds[selectedEmbedIndex], ...updates }
    setConfig({ ...actualConfig, embeds: newEmbeds })
  }

  const switchEmbedType = (newType) => {
    if (!selectedEmbed || selectedEmbed.type === newType) return
    const currentEmbed = selectedEmbed
    let updatedEmbed = { ...currentEmbed, type: newType }

    if (newType === 'regular') {
      let title = '', description = '', image = currentEmbed.image || ''
      if (currentEmbed.sections && currentEmbed.sections.length > 0) {
        const headings = currentEmbed.sections.filter(s => s.type === 'heading')
        const texts = currentEmbed.sections.filter(s => s.type === 'text')
        const images = currentEmbed.sections.filter(s => s.type === 'image')
        if (headings.length > 0) title = headings[0].content || ''
        if (texts.length > 0) description = texts.map(t => t.content).join('\n\n')
        if (!image && images.length > 0) image = images[0].url || ''
      }
      updatedEmbed = { ...updatedEmbed, title, description, color: '#5865F2', image, thumbnail: '', sections: undefined }
    } else {
      const newSections = []
      if (currentEmbed.title) newSections.push({ type: 'heading', level: 2, content: currentEmbed.title })
      if (currentEmbed.description) newSections.push({ type: 'text', content: currentEmbed.description })
      if (currentEmbed.image) newSections.push({ type: 'image', url: currentEmbed.image })
      updatedEmbed = { ...updatedEmbed, sections: newSections, title: undefined, description: undefined, color: undefined, thumbnail: undefined }
    }
    updateEmbed(updatedEmbed)
  }

  const addSection = (type) => {
    if (!selectedEmbed || selectedEmbed.type !== 'componentsv2') return
    let newSection = { type }
    if (type === 'heading') { newSection.content = 'New Heading'; newSection.level = 2 }
    else if (type === 'text') { newSection.content = 'Text content...' }
    else if (type === 'separator') { newSection.divider = true; newSection.spacing = 'small' }
    else if (type === 'image') { newSection.url = '' }
    updateEmbed({ sections: [...(selectedEmbed.sections || []), newSection] })
  }

  const updateSection = (idx, updates) => {
    if (!selectedEmbed) return
    const arr = [...(selectedEmbed.sections || [])]
    arr[idx] = { ...arr[idx], ...updates }
    updateEmbed({ sections: arr })
  }

  const removeSection = (idx) => {
    if (!selectedEmbed) return
    updateEmbed({ sections: (selectedEmbed.sections || []).filter((_, i) => i !== idx) })
  }

  const moveSection = (idx, dir) => {
    if (!selectedEmbed) return
    const newIdx = dir === 'up' ? idx - 1 : idx + 1
    if (newIdx < 0 || newIdx >= (selectedEmbed.sections || []).length) return
    const arr = [...(selectedEmbed.sections || [])]
    const item = arr.splice(idx, 1)[0]
    arr.splice(newIdx, 0, item)
    updateEmbed({ sections: arr })
  }

  const addEmbedButton = () => {
    if (!selectedEmbed) return
    const embedButtons = selectedEmbed.buttons || []
    if (embedButtons.length >= 2) return
    const existingIds = embedButtons.map(b => b.customId)
    const availableBtn = TICKET_BUTTONS.find(tb => !existingIds.includes(tb.id))
    if (!availableBtn) return
    updateEmbed({
      buttons: [...embedButtons, { label: availableBtn.label, emoji: availableBtn.emoji, style: availableBtn.style, customId: availableBtn.id }]
    })
  }

  const updateEmbedButton = (idx, updates) => {
    if (!selectedEmbed) return
    const arr = [...(selectedEmbed.buttons || [])]
    arr[idx] = { ...arr[idx], ...updates }
    updateEmbed({ buttons: arr })
  }

  const removeEmbedButton = (idx) => {
    if (!selectedEmbed) return
    updateEmbed({ buttons: (selectedEmbed.buttons || []).filter((_, i) => i !== idx) })
  }

  if (!guildId) {
    return <div className="p-6 text-center text-[#949ba4]">Vui long nhap Guild ID</div>
  }

  const embedsArr = actualConfig.embeds || []
  const sectionsArr = selectedEmbed ? (selectedEmbed.sections || []) : []
  const buttonsArr = selectedEmbed ? (selectedEmbed.buttons || []) : []

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-[#f2f3f5]">Stock Config</h3>
          <button 
            onClick={() => setConfig({ ...actualConfig, enabled: !actualConfig.enabled })} 
            className={actualConfig.enabled ? 'px-2 py-1 rounded text-xs bg-[#23a55a]/20 text-[#23a55a]' : 'px-2 py-1 rounded text-xs bg-[#ed4245]/20 text-[#ed4245]'}
          >
            {actualConfig.enabled ? 'ON' : 'OFF'}
          </button>
        </div>
        {!externalConfig && (
          <button onClick={saveConfig} disabled={loading} className="btn btn-primary flex items-center gap-2">
            {loading ? <LoadingIcon className="w-4 h-4 animate-spin" /> : <SaveIcon className="w-4 h-4" />}
            Luu
          </button>
        )}
      </div>

      {saveStatus.message && (
        <div className={saveStatus.type === 'success' ? 'px-4 py-2 rounded-lg text-sm bg-[#23a55a]/15 text-[#23a55a]' : 'px-4 py-2 rounded-lg text-sm bg-[#ed4245]/15 text-[#ed4245]'}>
          {saveStatus.message}
        </div>
      )}

      <div className="bg-[#2b2d31] rounded-lg border border-[#1e1f22] p-4">
        <div className="flex justify-between items-center mb-3">
          <label className="text-sm font-medium text-[#dbdee1]">Embeds ({embedsArr.length})</label>
          <div className="flex gap-2">
            <button onClick={() => addEmbed('componentsv2')} className="px-2 py-1 bg-[#5865f2] rounded text-xs text-white hover:bg-[#4752c4]">+ V2</button>
            <button onClick={() => addEmbed('regular')} className="px-2 py-1 bg-[#4e5058] rounded text-xs text-white hover:bg-[#6d6f78]">+ Regular</button>
          </div>
        </div>
        {embedsArr.length === 0 ? (
          <div className="text-center py-6 text-[#949ba4] text-sm">Chua co embed. Click nut tren de them.</div>
        ) : (
          <div className="space-y-2">
            {embedsArr.map((embed, idx) => (
              <div 
                key={embed.id || idx} 
                className={selectedEmbedIndex === idx ? 'flex items-center gap-2 p-2 rounded cursor-pointer bg-[#5865f2]/20 border border-[#5865f2]' : 'flex items-center gap-2 p-2 rounded cursor-pointer bg-[#1e1f22] hover:bg-[#35373c] border border-transparent'} 
                onClick={() => setSelectedEmbedIndex(idx)}
              >
                <span className={embed.type === 'componentsv2' ? 'w-2 h-2 rounded-full bg-[#5865f2]' : 'w-2 h-2 rounded-full bg-[#fee75c]'}></span>
                <span className="text-sm text-[#dbdee1] flex-1">
                  #{idx + 1} - {embed.type === 'componentsv2' ? 'V2' : 'Regular'}
                  {(embed.buttons || []).length > 0 && <span className="ml-2 text-xs text-[#5865f2]">[{(embed.buttons || []).length} btn]</span>}
                </span>
                <button onClick={(e) => { e.stopPropagation(); moveEmbed(idx, 'up') }} disabled={idx === 0} className="p-1 text-[#949ba4] hover:text-white disabled:opacity-30"><MoveUpIcon className="w-4 h-4" /></button>
                <button onClick={(e) => { e.stopPropagation(); moveEmbed(idx, 'down') }} disabled={idx === embedsArr.length - 1} className="p-1 text-[#949ba4] hover:text-white disabled:opacity-30"><MoveDownIcon className="w-4 h-4" /></button>
                <button onClick={(e) => { e.stopPropagation(); removeEmbed(idx) }} className="p-1 text-[#949ba4] hover:text-[#ed4245]"><TrashIcon className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedEmbed && (
        <div className="space-y-4">
          <div className="bg-[#2b2d31] rounded-lg border border-[#1e1f22] p-4">
            <label className="text-sm font-medium text-[#dbdee1] mb-3 block">Loai Embed #{selectedEmbedIndex + 1}</label>
            <div className="flex gap-2">
              <button 
                onClick={() => switchEmbedType('componentsv2')} 
                className={selectedEmbed.type === 'componentsv2' ? 'flex-1 px-4 py-2 rounded-lg text-sm font-medium bg-[#5865f2] text-white' : 'flex-1 px-4 py-2 rounded-lg text-sm font-medium bg-[#1e1f22] text-[#949ba4] hover:bg-[#35373c]'}
              >
                Components V2
              </button>
              <button 
                onClick={() => switchEmbedType('regular')} 
                className={selectedEmbed.type === 'regular' ? 'flex-1 px-4 py-2 rounded-lg text-sm font-medium bg-[#5865f2] text-white' : 'flex-1 px-4 py-2 rounded-lg text-sm font-medium bg-[#1e1f22] text-[#949ba4] hover:bg-[#35373c]'}
              >
                Regular Embed
              </button>
            </div>
          </div>

          <div className="bg-[#2b2d31] rounded-lg border border-[#1e1f22]">
            <button onClick={() => setShowPlaceholders(!showPlaceholders)} className="w-full px-4 py-3 flex items-center justify-between hover:bg-[#35373c] rounded-lg">
              <span className="text-sm font-medium text-[#dbdee1] flex items-center gap-2"><InfoIcon className="w-4 h-4 text-[#5865f2]" />Placeholders</span>
              <span className="text-xs text-[#949ba4]">{showPlaceholders ? 'Hide' : 'Show'}</span>
            </button>
            {showPlaceholders && (
              <div className="px-4 pb-4 grid grid-cols-2 gap-2 text-xs">
                {['{user}', '{user.name}', '{guild.name}', '{guild.memberCount}', '{timestamp:f}', '{timestamp:R}', '{channel}'].map(p => (
                  <div key={p} className="px-2 py-1 bg-[#1e1f22] rounded cursor-pointer hover:bg-[#35373c]" onClick={() => navigator.clipboard.writeText(p)}>
                    <code className="text-[#5865f2]">{p}</code>
                  </div>
                ))}
              </div>
            )}
          </div>

          {selectedEmbed.type === 'componentsv2' && (
            <div className="space-y-4">
              <div className="flex gap-2 flex-wrap">
                {SECTION_TYPES.map((st) => (
                  <button key={st.type} onClick={() => addSection(st.type)} className="px-3 py-1.5 bg-[#2b2d31] hover:bg-[#35373c] rounded-lg text-sm text-[#dbdee1]">+ {st.label}</button>
                ))}
              </div>
              <div className="space-y-2">
                {sectionsArr.map((sec, idx) => (
                  <SectionItem key={idx} section={sec} index={idx} total={sectionsArr.length} onUpdate={(u) => updateSection(idx, u)} onRemove={() => removeSection(idx)} onMove={(d) => moveSection(idx, d)} />
                ))}
              </div>
            </div>
          )}

          {selectedEmbed.type === 'regular' && (
            <div className="bg-[#2b2d31] rounded-lg p-4 border border-[#1e1f22] space-y-4">
              <div>
                <label className="text-sm font-medium text-[#dbdee1] mb-2 block">Title</label>
                <input type="text" value={selectedEmbed.title || ''} onChange={(e) => updateEmbed({ title: e.target.value })} className="w-full px-3 py-2 bg-[#1e1f22] rounded text-sm text-[#dbdee1]" placeholder="Embed title..." />
              </div>
              <div>
                <label className="text-sm font-medium text-[#dbdee1] mb-2 block">Description</label>
                <textarea value={selectedEmbed.description || ''} onChange={(e) => updateEmbed({ description: e.target.value })} rows={6} className="w-full px-3 py-2 bg-[#1e1f22] rounded text-sm text-[#dbdee1] resize-none" placeholder="Embed description..." />
              </div>
              <div>
                <label className="text-sm font-medium text-[#dbdee1] mb-2 block">Color</label>
                <div className="flex gap-2">
                  <input type="color" value={selectedEmbed.color || '#5865F2'} onChange={(e) => updateEmbed({ color: e.target.value })} className="w-12 h-10 bg-[#1e1f22] rounded cursor-pointer" />
                  <input type="text" value={selectedEmbed.color || '#5865F2'} onChange={(e) => updateEmbed({ color: e.target.value })} className="flex-1 px-3 py-2 bg-[#1e1f22] rounded text-sm text-[#dbdee1]" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-[#dbdee1] mb-2 block">Image URL</label>
                <input type="text" value={selectedEmbed.image || ''} onChange={(e) => updateEmbed({ image: e.target.value })} className="w-full px-3 py-2 bg-[#1e1f22] rounded text-sm text-[#dbdee1]" placeholder="https://..." />
              </div>
              <div>
                <label className="text-sm font-medium text-[#dbdee1] mb-2 block">Thumbnail URL</label>
                <input type="text" value={selectedEmbed.thumbnail || ''} onChange={(e) => updateEmbed({ thumbnail: e.target.value })} className="w-full px-3 py-2 bg-[#1e1f22] rounded text-sm text-[#dbdee1]" placeholder="https://..." />
              </div>
            </div>
          )}

          <div className="bg-[#2b2d31] rounded-lg p-4 border border-[#1e1f22]">
            <label className="text-sm font-medium text-[#dbdee1] mb-2 block">Footer</label>
            <input type="text" value={selectedEmbed.footer || ''} onChange={(e) => updateEmbed({ footer: e.target.value })} className="w-full px-3 py-2 bg-[#1e1f22] rounded text-sm text-[#dbdee1]" placeholder="-# {guild.name} - {timestamp:f}" />
          </div>

          <div className="bg-[#2b2d31] rounded-lg p-4 border border-[#1e1f22]">
            <div className="flex justify-between items-center mb-3">
              <label className="text-sm font-medium text-[#dbdee1]">Buttons cua Embed #{selectedEmbedIndex + 1} ({buttonsArr.length}/2)</label>
              <button onClick={addEmbedButton} disabled={buttonsArr.length >= 2} className="px-2 py-1 bg-[#5865f2] rounded text-xs text-white disabled:opacity-50">+ Add</button>
            </div>
            {buttonsArr.length === 0 ? (
              <div className="text-center py-3 text-[#949ba4] text-xs">Embed nay chua co button</div>
            ) : (
              <div className="space-y-2">
                {buttonsArr.map((btn, idx) => (
                  <TicketButtonItem key={idx} button={btn} onUpdate={(u) => updateEmbedButton(idx, u)} onRemove={() => removeEmbedButton(idx)} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="p-3 bg-[#1e1f22] rounded-lg text-sm text-[#949ba4]">
        Su dung <code className="px-1 bg-[#2b2d31] rounded text-[#5865f2]">+stock</code> trong Discord
      </div>
    </div>
  )
}

function SectionItem({ section, index, total, onUpdate, onRemove, onMove }) {
  return (
    <div className="bg-[#2b2d31] rounded-lg border border-[#1e1f22] p-3">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm text-[#dbdee1] flex-1 capitalize">{section.type}</span>
        <button onClick={() => onMove('up')} disabled={index === 0} className="p-1 text-[#949ba4] disabled:opacity-30"><MoveUpIcon className="w-4 h-4" /></button>
        <button onClick={() => onMove('down')} disabled={index === total - 1} className="p-1 text-[#949ba4] disabled:opacity-30"><MoveDownIcon className="w-4 h-4" /></button>
        <button onClick={onRemove} className="p-1 text-[#949ba4] hover:text-[#ed4245]"><TrashIcon className="w-4 h-4" /></button>
      </div>
      {section.type === 'heading' && (
        <div className="space-y-2">
          <select value={section.level || 2} onChange={(e) => onUpdate({ level: parseInt(e.target.value) })} className="w-full px-3 py-2 bg-[#1e1f22] rounded text-sm text-[#dbdee1]">
            <option value={1}>H1</option>
            <option value={2}>H2</option>
            <option value={3}>H3</option>
          </select>
          <input type="text" value={section.content || ''} onChange={(e) => onUpdate({ content: e.target.value })} className="w-full px-3 py-2 bg-[#1e1f22] rounded text-sm text-[#dbdee1]" />
        </div>
      )}
      {section.type === 'text' && (
        <textarea value={section.content || ''} onChange={(e) => onUpdate({ content: e.target.value })} rows={3} className="w-full px-3 py-2 bg-[#1e1f22] rounded text-sm text-[#dbdee1] resize-none" />
      )}
      {section.type === 'separator' && (
        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-sm text-[#dbdee1]">
            <input type="checkbox" checked={section.divider !== false} onChange={(e) => onUpdate({ divider: e.target.checked })} />
            Divider
          </label>
          <select value={section.spacing || 'small'} onChange={(e) => onUpdate({ spacing: e.target.value })} className="px-2 py-1 bg-[#1e1f22] rounded text-sm text-[#dbdee1]">
            <option value="small">Small</option>
            <option value="large">Large</option>
          </select>
        </div>
      )}
      {section.type === 'image' && (
        <input type="text" value={section.url || ''} onChange={(e) => onUpdate({ url: e.target.value })} className="w-full px-3 py-2 bg-[#1e1f22] rounded text-sm text-[#dbdee1]" placeholder="Image URL" />
      )}
    </div>
  )
}

function TicketButtonItem({ button, onUpdate, onRemove }) {
  const ticketType = TICKET_BUTTONS.find(tb => tb.id === button.customId)
  return (
    <div className="flex gap-2 items-center bg-[#1e1f22] rounded p-2">
      <input type="text" value={button.emoji || ''} onChange={(e) => onUpdate({ emoji: e.target.value })} className="w-12 px-2 py-1 bg-[#2b2d31] rounded text-center text-sm" placeholder="E" />
      <input type="text" value={button.label || ''} onChange={(e) => onUpdate({ label: e.target.value })} className="flex-1 px-2 py-1 bg-[#2b2d31] rounded text-sm text-[#dbdee1]" placeholder="Label" />
      <select value={button.style || 'primary'} onChange={(e) => onUpdate({ style: e.target.value })} className="px-2 py-1 bg-[#2b2d31] rounded text-sm text-[#dbdee1]">
        {BUTTON_STYLES.map((s) => (
          <option key={s.value} value={s.value}>{s.label}</option>
        ))}
      </select>
      <span className="px-2 py-1 bg-[#5865f2]/20 text-[#5865f2] rounded text-xs">{ticketType ? ticketType.description : button.customId}</span>
      <button onClick={onRemove} className="p-1 text-[#949ba4] hover:text-[#ed4245]"><TrashIcon className="w-4 h-4" /></button>
    </div>
  )
}

export default StockEditor
