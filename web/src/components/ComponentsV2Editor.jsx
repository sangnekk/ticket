import { useState } from 'react'
import { ChevronDownIcon, CodeIcon, ImageIcon, ButtonIcon } from './Icons'

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
        <span>Placeholders & Markdown</span>
        <ChevronDownIcon className={`w-4 h-4 ml-auto transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="px-3 pb-3 space-y-3 animate-fadeIn">
          <div className="grid grid-cols-2 gap-2">
            {PLACEHOLDER_KEYS.map((item) => (
              <div key={item.key} className="flex flex-col gap-0.5 p-2 bg-dark-tertiary rounded">
                <code className="text-xs text-discord-blurple font-mono">{item.key}</code>
                <span className="text-xs text-text-muted">{item.desc}</span>
              </div>
            ))}
          </div>
          <div className="p-2 bg-dark-tertiary rounded">
            <p className="text-xs text-text-muted mb-2">Markdown hỗ trợ:</p>
            <div className="grid grid-cols-2 gap-1 text-xs">
              <code className="text-discord-blurple">## Title</code>
              <span className="text-text-muted">Heading</span>
              <code className="text-discord-blurple">**bold**</code>
              <span className="text-text-muted">In đậm</span>
              <code className="text-discord-blurple">-# text</code>
              <span className="text-text-muted">Subtext nhỏ</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function CollapsibleSection({ title, icon, children, defaultOpen = true }) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  
  return (
    <section className="bg-dark-secondary rounded-lg border border-white/5 overflow-hidden transition-colors hover:border-dark-hover">
      <button 
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-dark-hover transition-colors"
        onClick={() => setIsOpen(!isOpen)} 
        type="button"
      >
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="text-xs font-bold text-text-header-secondary uppercase tracking-wide">{title}</h3>
        </div>
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

function ComponentsV2Editor({ container, setContainer }) {
  const updateContainer = (key, value) => {
    setContainer(prev => ({ ...prev, [key]: value }))
  }
  
  const updateButton = (index, key, value) => {
    setContainer(prev => ({
      ...prev,
      buttons: prev.buttons.map((btn, i) => i === index ? { ...btn, [key]: value } : btn)
    }))
  }

  return (
    <div className="space-y-3">
      <PlaceholderHelp />
      
      {/* Content Section */}
      <CollapsibleSection title="Nội dung" defaultOpen={true}>
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-text-header-secondary uppercase tracking-wide">Title</label>
          <input 
            type="text"
            className="form-input"
            value={container.title || ''} 
            onChange={(e) => updateContainer('title', e.target.value)} 
            placeholder="## 🎫 Tiêu đề (hỗ trợ markdown)" 
          />
          <p className="text-xs text-text-muted">Dùng ## để tạo heading lớn</p>
        </div>
        
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-text-header-secondary uppercase tracking-wide">Description</label>
          <textarea 
            className="form-input resize-y min-h-[120px]"
            value={container.description || ''} 
            onChange={(e) => updateContainer('description', e.target.value)} 
            placeholder="Nội dung chính (hỗ trợ markdown)" 
          />
        </div>
        
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-text-header-secondary uppercase tracking-wide">Accent Color</label>
          <div className="flex items-center gap-2 bg-dark-tertiary rounded border border-transparent hover:border-dark-hover focus-within:border-discord-blurple focus-within:ring-1 focus-within:ring-discord-blurple transition-all">
            <input 
              type="text"
              className="flex-1 px-3 py-2.5 bg-transparent text-text-normal text-sm outline-none"
              value={container.accentColor || '#5865F2'} 
              onChange={(e) => updateContainer('accentColor', e.target.value)} 
              placeholder="#rrggbb"
            />
            <input 
              type="color" 
              value={container.accentColor || '#5865F2'} 
              onChange={(e) => updateContainer('accentColor', e.target.value)} 
              className="w-8 h-8 rounded cursor-pointer border-none mr-2"
            />
          </div>
        </div>
      </CollapsibleSection>

      {/* Media Gallery Section */}
      <CollapsibleSection 
        title="Media Gallery" 
        icon={<ImageIcon className="w-4 h-4 text-discord-green" />}
        defaultOpen={false}
      >
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-text-header-secondary uppercase tracking-wide">Image URL</label>
          <input 
            type="text"
            className="form-input"
            value={container.image || ''} 
            onChange={(e) => updateContainer('image', e.target.value)} 
            placeholder="https://example.com/banner.png"
          />
          <p className="text-xs text-text-muted">Ảnh sẽ hiển thị trong MediaGallery</p>
        </div>
        
        {container.image && (
          <div className="mt-2 p-2 bg-dark-tertiary rounded">
            <img 
              src={container.image} 
              alt="Preview" 
              className="max-h-[100px] rounded object-contain"
              onError={(e) => {
                e.target.style.display = 'none'
              }}
            />
          </div>
        )}
      </CollapsibleSection>

      {/* Buttons Section */}
      {container.buttons?.length > 0 && (
        <CollapsibleSection 
          title="Buttons" 
          icon={<ButtonIcon className="w-4 h-4 text-discord-blurple" />}
          defaultOpen={true}
        >
          {container.buttons.map((btn, index) => (
            <div key={index} className="bg-dark-tertiary rounded-lg p-3 border border-white/5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-text-muted uppercase tracking-wide">Button {index + 1}</span>
                <span className={`text-xs px-2 py-0.5 rounded ${
                  btn.style === 'primary' ? 'bg-discord-blurple/20 text-discord-blurple' :
                  btn.style === 'secondary' ? 'bg-gray-500/20 text-gray-400' :
                  btn.style === 'success' ? 'bg-discord-green/20 text-discord-green' :
                  'bg-discord-red/20 text-discord-red'
                }`}>
                  {btn.style}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text-header-secondary uppercase tracking-wide">Emoji</label>
                  <input 
                    type="text"
                    className="form-input"
                    value={btn.emoji || ''} 
                    onChange={(e) => updateButton(index, 'emoji', e.target.value)} 
                    placeholder="📦"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text-header-secondary uppercase tracking-wide">Label</label>
                  <input 
                    type="text"
                    className="form-input"
                    value={btn.label || ''} 
                    onChange={(e) => updateButton(index, 'label', e.target.value)} 
                    placeholder="Button text"
                  />
                </div>
              </div>
              
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-header-secondary uppercase tracking-wide">Style</label>
                <select
                  className="form-input"
                  value={btn.style || 'primary'}
                  onChange={(e) => updateButton(index, 'style', e.target.value)}
                >
                  <option value="primary">Primary (Blurple)</option>
                  <option value="secondary">Secondary (Gray)</option>
                  <option value="success">Success (Green)</option>
                  <option value="danger">Danger (Red)</option>
                </select>
              </div>
            </div>
          ))}
        </CollapsibleSection>
      )}

      {/* Footer Section */}
      <CollapsibleSection title="Footer" defaultOpen={false}>
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-text-header-secondary uppercase tracking-wide">Footer Text</label>
          <input 
            type="text"
            className="form-input"
            value={container.footer || ''} 
            onChange={(e) => updateContainer('footer', e.target.value)} 
            placeholder="-# J & D Store - Ticket System • timestamp"
          />
          <p className="text-xs text-text-muted">Dùng -# để tạo text nhỏ, dùng {'<t:timestamp:f>'} cho thời gian</p>
        </div>
      </CollapsibleSection>
    </div>
  )
}

export default ComponentsV2Editor
