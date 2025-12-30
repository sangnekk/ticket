import { useState } from 'react'
import { ChevronDownIcon, CodeIcon } from './Icons'

const PLACEHOLDER_KEYS = [
  { key: '{user}', desc: 'Tên người dùng' },
  { key: '{staff}', desc: 'Tên staff' },
  { key: '{type}', desc: 'Loại ticket' },
  { key: '{typeEmoji}', desc: 'Emoji loại ticket' },
  { key: '{ticketNumber}', desc: 'Số ticket' },
  { key: '{reason}', desc: 'Lý do' },
  { key: '{channel}', desc: 'Kênh ticket' },
]

function PlaceholderHelp() {
  const [isOpen, setIsOpen] = useState(false)
  
  return (
    <div className="bg-dark-secondary rounded-lg border border-white/5 overflow-hidden">
      <button 
        type="button" 
        className="w-full flex items-center gap-2 px-4 py-3 text-text-header-secondary text-sm font-semibold hover:bg-dark-hover transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <CodeIcon className="w-4 h-4 text-discord-blurple" />
        <span>Placeholders</span>
        <ChevronDownIcon className={`w-4 h-4 ml-auto transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="grid grid-cols-2 gap-2 px-3 pb-3 animate-fadeIn">
          {PLACEHOLDER_KEYS.map((item) => (
            <div key={item.key} className="flex flex-col gap-0.5 p-2 bg-dark-tertiary rounded">
              <code className="text-xs text-discord-blurple font-mono">{item.key}</code>
              <span className="text-xs text-text-muted">{item.desc}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function CollapsibleSection({ title, children, defaultOpen = true }) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  
  return (
    <section className="bg-dark-secondary rounded-lg border border-white/5 overflow-hidden transition-colors hover:border-dark-hover">
      <button 
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-dark-hover transition-colors"
        onClick={() => setIsOpen(!isOpen)} 
        type="button"
      >
        <h3 className="text-xs font-bold text-text-header-secondary uppercase tracking-wide">{title}</h3>
        <ChevronDownIcon className={`w-4 h-4 text-text-muted transition-transform duration-200 ${isOpen ? '' : '-rotate-90'}`} />
      </button>
      {isOpen && (
        <div className="px-4 pb-4 space-y-3 animate-slideDown">
          {children}
        </div>
      )}
    </section>
  )
}

function EmbedEditor({ embed, setEmbed }) {
  const updateEmbed = (key, value) => {
    setEmbed(prev => ({ ...prev, [key]: value }))
  }
  
  const updateNested = (parent, key, value) => {
    setEmbed(prev => ({ ...prev, [parent]: { ...prev[parent], [key]: value } }))
  }
  
  const updateField = (index, key, value) => {
    setEmbed(prev => ({
      ...prev,
      fields: prev.fields.map((f, i) => i === index ? { ...f, [key]: value } : f)
    }))
  }

  const hasFields = embed.fields && embed.fields.length > 0

  return (
    <div className="space-y-3">
      <PlaceholderHelp />
      
      <CollapsibleSection title="Author" defaultOpen={false}>
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-text-header-secondary uppercase tracking-wide">Author Name</label>
          <input 
            type="text"
            className="form-input"
            value={embed.author?.name || ''} 
            onChange={(e) => updateNested('author', 'name', e.target.value)} 
            placeholder="Tên author" 
            maxLength={256}
          />
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Body" defaultOpen={true}>
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-text-header-secondary uppercase tracking-wide">Title</label>
          <input 
            type="text"
            className="form-input"
            value={embed.title || ''} 
            onChange={(e) => updateEmbed('title', e.target.value)} 
            placeholder="Tiêu đề embed" 
            maxLength={256}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-text-header-secondary uppercase tracking-wide">Description</label>
          <textarea 
            className="form-input resize-y min-h-[120px]"
            value={embed.description || ''} 
            onChange={(e) => updateEmbed('description', e.target.value)} 
            placeholder="Nội dung embed (hỗ trợ markdown)" 
            maxLength={4096}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-text-header-secondary uppercase tracking-wide">Color</label>
          <div className="flex items-center gap-2 bg-dark-tertiary rounded border border-transparent hover:border-dark-hover focus-within:border-discord-blurple focus-within:ring-1 focus-within:ring-discord-blurple transition-all">
            <input 
              type="text"
              className="flex-1 px-3 py-2.5 bg-transparent text-text-normal text-sm outline-none"
              value={embed.color || '#5865F2'} 
              onChange={(e) => updateEmbed('color', e.target.value)} 
              placeholder="#rrggbb"
            />
            <input 
              type="color" 
              value={embed.color || '#5865F2'} 
              onChange={(e) => updateEmbed('color', e.target.value)} 
              className="w-8 h-8 rounded cursor-pointer border-none mr-2"
            />
          </div>
        </div>
      </CollapsibleSection>

      {hasFields && (
        <CollapsibleSection title="Fields" defaultOpen={true}>
          {embed.fields.map((field, index) => (
            <div key={index} className="bg-dark-tertiary rounded-lg p-3 border border-white/5 space-y-3">
              <span className="text-xs font-bold text-text-muted uppercase tracking-wide">Field {index + 1}</span>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-header-secondary uppercase tracking-wide">Name</label>
                <input 
                  type="text"
                  className="form-input"
                  value={field.name || ''} 
                  onChange={(e) => updateField(index, 'name', e.target.value)} 
                  placeholder="Tên field" 
                  maxLength={256}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-header-secondary uppercase tracking-wide">Value</label>
                <textarea 
                  className="form-input resize-y min-h-[60px]"
                  value={field.value || ''} 
                  onChange={(e) => updateField(index, 'value', e.target.value)} 
                  placeholder="Giá trị field" 
                  maxLength={1024}
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={field.inline || false} 
                  onChange={(e) => updateField(index, 'inline', e.target.checked)}
                  className="w-4 h-4 accent-discord-blurple cursor-pointer"
                />
                <span className="text-sm text-text-normal">Inline</span>
              </label>
            </div>
          ))}
        </CollapsibleSection>
      )}

      <CollapsibleSection title="Images" defaultOpen={false}>
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-text-header-secondary uppercase tracking-wide">Image URL</label>
          <input 
            type="text"
            className="form-input"
            value={embed.image?.url || ''} 
            onChange={(e) => updateNested('image', 'url', e.target.value)} 
            placeholder="https://example.com/image.png"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-text-header-secondary uppercase tracking-wide">Thumbnail URL</label>
          <input 
            type="text"
            className="form-input"
            value={embed.thumbnail?.url || ''} 
            onChange={(e) => updateNested('thumbnail', 'url', e.target.value)} 
            placeholder="https://example.com/thumbnail.png"
          />
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Footer" defaultOpen={false}>
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-text-header-secondary uppercase tracking-wide">Footer Text</label>
          <input 
            type="text"
            className="form-input"
            value={embed.footer?.text || ''} 
            onChange={(e) => updateNested('footer', 'text', e.target.value)} 
            placeholder="Text footer" 
            maxLength={2048}
          />
        </div>
      </CollapsibleSection>
    </div>
  )
}

export default EmbedEditor
