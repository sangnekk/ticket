import { useState, useEffect, useRef, useCallback } from 'react'
import EmbedList from './components/EmbedList'
import ComponentsV2Editor from './components/ComponentsV2Editor'
import ComponentsV2Preview from './components/ComponentsV2Preview'
import { PaletteIcon, HomeIcon, EditIcon, DownloadIcon, RefreshIcon, SaveIcon, EyeIcon, ListIcon, LoadingIcon, ComponentsIcon } from './components/Icons'
import './index.css'

const DEFAULT_CONTAINER = {
  title: '',
  description: '',
  accentColor: '#5865F2',
  image: '',
  buttons: [],
  footer: ''
}

function App() {
  const [templates, setTemplates] = useState([])
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [container, setContainer] = useState({ ...DEFAULT_CONTAINER })
  const [guildId, setGuildId] = useState('')
  const [locale, setLocale] = useState('Vietnamese')
  const [locales, setLocales] = useState([])
  const [saveStatus, setSaveStatus] = useState({ type: '', message: '' })
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true)
  const prevGuildIdRef = useRef('')

  // Fetch available locales on mount
  useEffect(() => {
    fetch('/api/locales')
      .then(res => res.json())
      .then(data => setLocales(data))
      .catch(err => console.error('Error fetching locales:', err))
  }, [])

  // Fetch templates from API when locale changes
  useEffect(() => {
    setIsLoadingTemplates(true)
    fetch(`/api/componentsv2/templates?locale=${locale}`)
      .then(res => res.json())
      .then(data => {
        setTemplates(data)
        setIsLoadingTemplates(false)
      })
      .catch(err => {
        console.error('Error fetching templates:', err)
        setIsLoadingTemplates(false)
      })
  }, [locale])

  // Load template data with guild overrides
  const loadTemplateData = useCallback(async (template, gId) => {
    if (!template) return null
    
    try {
      const url = gId 
        ? `/api/componentsv2/template/${template.id}?guildId=${gId}&locale=${locale}`
        : `/api/componentsv2/template/${template.id}?locale=${locale}`
      
      const res = await fetch(url)
      const data = await res.json()
      
      return data
    } catch (error) {
      console.error('Error loading template data:', error)
      return null
    }
  }, [locale])

  // Build container from template data
  const buildContainerFromData = (template, values) => {
    const newContainer = {
      title: values.title || '',
      description: values.description || '',
      accentColor: template.accentColor || '#5865F2',
      image: values.image || '',
      buttons: [],
      footer: `-# J & D Store - Ticket System • <t:${Math.floor(Date.now() / 1000)}:f>`
    }
    
    // Build buttons from template structure and values
    if (template.buttons && template.buttons.length > 0) {
      newContainer.buttons = template.buttons.map(btn => {
        if (btn.id === 'buy') {
          return {
            emoji: values.button_buy_emoji || '📦',
            label: values.button_buy_label || 'Mua Hàng',
            style: btn.style,
            customId: btn.customId
          }
        } else if (btn.id === 'support') {
          return {
            emoji: values.button_support_emoji || '❓',
            label: values.button_support_label || 'Hỗ Trợ',
            style: btn.style,
            customId: btn.customId
          }
        }
        return btn
      })
    }
    
    return newContainer
  }

  // Handle template selection
  const handleSelectTemplate = async (template) => {
    setSelectedTemplate(template)
    setIsLoading(true)
    
    const data = await loadTemplateData(template, guildId)
    
    if (data) {
      const newContainer = buildContainerFromData(template, data.values)
      setContainer(newContainer)
      
      if (data.hasOverrides && guildId) {
        setSaveStatus({ type: 'success', message: 'Đã tải dữ liệu custom từ database!' })
        setTimeout(() => setSaveStatus({ type: '', message: '' }), 2000)
      }
    } else {
      // Use default values from template
      const newContainer = buildContainerFromData(template, template.defaultValues || {})
      setContainer(newContainer)
    }
    
    setIsLoading(false)
  }

  // Handle Guild ID change
  const handleGuildIdChange = (e) => {
    setGuildId(e.target.value)
  }

  // Handle Guild ID paste - auto reload current template
  const handleGuildIdPaste = async (e) => {
    setTimeout(async () => {
      const pastedValue = e.target.value.trim()
      if (pastedValue.length >= 17 && selectedTemplate) {
        setIsLoading(true)
        setSaveStatus({ type: 'info', message: 'Đang tải dữ liệu...' })
        
        const data = await loadTemplateData(selectedTemplate, pastedValue)
        
        if (data) {
          const newContainer = buildContainerFromData(selectedTemplate, data.values)
          setContainer(newContainer)
          
          setSaveStatus({ 
            type: data.hasOverrides ? 'success' : 'warning', 
            message: data.hasOverrides ? 'Đã tải dữ liệu custom!' : 'Sử dụng giá trị mặc định từ locale' 
          })
        }
        
        setIsLoading(false)
        setTimeout(() => setSaveStatus({ type: '', message: '' }), 3000)
      }
    }, 0)
  }

  // Save to database
  const handleSave = async () => {
    if (!guildId) {
      setSaveStatus({ type: 'error', message: 'Vui lòng nhập Guild ID!' })
      setTimeout(() => setSaveStatus({ type: '', message: '' }), 3000)
      return
    }
    if (!selectedTemplate) {
      setSaveStatus({ type: 'error', message: 'Vui lòng chọn một template!' })
      setTimeout(() => setSaveStatus({ type: '', message: '' }), 3000)
      return
    }
    
    setIsLoading(true)
    
    try {
      const savePromises = []
      const keys = selectedTemplate.keys
      
      // Save title
      if (container.title && keys.title) {
        savePromises.push(fetch('/api/text-override', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ guildId, key: keys.title, text: container.title })
        }))
      }
      
      // Save description
      if (container.description && keys.description) {
        savePromises.push(fetch('/api/text-override', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ guildId, key: keys.description, text: container.description })
        }))
      }
      
      // Save image
      if (container.image && keys.image) {
        savePromises.push(fetch('/api/text-override', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ guildId, key: keys.image, text: container.image })
        }))
      }
      
      // Save button data
      if (container.buttons[0] && keys.button_buy_label) {
        savePromises.push(fetch('/api/text-override', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ guildId, key: keys.button_buy_label, text: container.buttons[0].label })
        }))
      }
      if (container.buttons[0] && keys.button_buy_emoji) {
        savePromises.push(fetch('/api/text-override', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ guildId, key: keys.button_buy_emoji, text: container.buttons[0].emoji })
        }))
      }
      if (container.buttons[1] && keys.button_support_label) {
        savePromises.push(fetch('/api/text-override', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ guildId, key: keys.button_support_label, text: container.buttons[1].label })
        }))
      }
      if (container.buttons[1] && keys.button_support_emoji) {
        savePromises.push(fetch('/api/text-override', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ guildId, key: keys.button_support_emoji, text: container.buttons[1].emoji })
        }))
      }
      
      await Promise.all(savePromises)
      setSaveStatus({ type: 'success', message: 'Đã lưu thành công!' })
    } catch (error) {
      setSaveStatus({ type: 'error', message: 'Lỗi kết nối server!' })
    }
    
    setIsLoading(false)
    setTimeout(() => setSaveStatus({ type: '', message: '' }), 3000)
  }

  // Load from database
  const handleLoad = async () => {
    if (!guildId || !selectedTemplate) {
      setSaveStatus({ type: 'error', message: 'Vui lòng nhập Guild ID và chọn template!' })
      setTimeout(() => setSaveStatus({ type: '', message: '' }), 3000)
      return
    }
    
    setIsLoading(true)
    setSaveStatus({ type: 'info', message: 'Đang tải...' })
    
    const data = await loadTemplateData(selectedTemplate, guildId)
    
    if (data) {
      const newContainer = buildContainerFromData(selectedTemplate, data.values)
      setContainer(newContainer)
      
      setSaveStatus({ 
        type: data.hasOverrides ? 'success' : 'warning', 
        message: data.hasOverrides ? 'Đã tải dữ liệu custom!' : 'Sử dụng giá trị mặc định' 
      })
    } else {
      setSaveStatus({ type: 'error', message: 'Lỗi tải dữ liệu!' })
    }
    
    setIsLoading(false)
    setTimeout(() => setSaveStatus({ type: '', message: '' }), 3000)
  }

  // Reset to locale defaults
  const handleReset = async () => {
    if (!selectedTemplate) return
    
    setIsLoading(true)
    
    // Fetch fresh from locale (without guild overrides)
    const data = await loadTemplateData(selectedTemplate, null)
    
    if (data) {
      const newContainer = buildContainerFromData(selectedTemplate, data.values)
      setContainer(newContainer)
      setSaveStatus({ type: 'success', message: 'Đã reset về giá trị mặc định!' })
    }
    
    setIsLoading(false)
    setTimeout(() => setSaveStatus({ type: '', message: '' }), 2000)
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-[300px] bg-dark-secondary border-r border-dark-tertiary flex flex-col flex-shrink-0 h-screen sticky top-0">
        {/* Header */}
        <div className="p-4 bg-gradient-to-b from-discord-blurple/15 to-transparent border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-discord-blurple rounded-lg flex items-center justify-center shadow-lg">
              <ComponentsIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-text-header">Components V2 Editor</h1>
              <p className="text-xs text-text-muted">J & D Store Bot</p>
            </div>
          </div>
        </div>

        {/* Guild Input & Locale Select */}
        <div className="p-3 border-b border-white/5 space-y-2">
          <div className="relative">
            {isLoading ? (
              <LoadingIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-discord-blurple animate-spin" />
            ) : (
              <HomeIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            )}
            <input
              type="text"
              className="w-full pl-10 pr-3 py-2.5 bg-dark-tertiary border border-transparent rounded-lg text-text-normal text-sm transition-all hover:border-dark-hover focus:border-discord-blurple focus:ring-1 focus:ring-discord-blurple outline-none"
              placeholder="Paste Guild ID..."
              value={guildId}
              onChange={handleGuildIdChange}
              onPaste={handleGuildIdPaste}
            />
          </div>
          
          <select
            className="w-full px-3 py-2 bg-dark-tertiary border border-transparent rounded-lg text-text-normal text-sm transition-all hover:border-dark-hover focus:border-discord-blurple outline-none"
            value={locale}
            onChange={(e) => setLocale(e.target.value)}
          >
            {locales.map(loc => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>
        </div>

        {/* Template List */}
        {isLoadingTemplates ? (
          <div className="flex-1 flex items-center justify-center">
            <LoadingIcon className="w-8 h-8 text-discord-blurple animate-spin" />
          </div>
        ) : (
          <EmbedList
            templates={templates}
            selectedTemplate={selectedTemplate}
            onSelect={handleSelectTemplate}
          />
        )}

        {/* Footer */}
        <div className="p-3 border-t border-white/5 mt-auto">
          <p className="text-xs text-text-muted text-center">© 2024 J & D Store • Components V2</p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {selectedTemplate ? (
          <>
            {/* Header */}
            <header className="flex justify-between items-center px-6 py-4 bg-dark-secondary border-b border-white/5 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-dark-active rounded-lg flex items-center justify-center">
                  <EditIcon className="w-4 h-4 text-text-normal" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-text-header">{selectedTemplate.name}</h2>
                  <span className="text-xs text-text-muted">{selectedTemplate.description}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={handleLoad} className="btn btn-secondary" disabled={isLoading}>
                  {isLoading ? <LoadingIcon className="w-4 h-4 animate-spin" /> : <DownloadIcon className="w-4 h-4" />}
                  <span>Tải</span>
                </button>
                <button onClick={handleReset} className="btn btn-secondary" disabled={isLoading}>
                  <RefreshIcon className="w-4 h-4" />
                  <span>Reset</span>
                </button>
                <button onClick={handleSave} className="btn btn-primary" disabled={isLoading}>
                  <SaveIcon className="w-4 h-4" />
                  <span>Lưu</span>
                </button>
              </div>
            </header>

            {/* Status Bar */}
            {saveStatus.message && (
              <div className={`px-6 py-3 text-sm font-medium flex items-center gap-2 animate-slideDown
                ${saveStatus.type === 'success' ? 'bg-discord-green/20 text-discord-green border-l-4 border-discord-green' : ''}
                ${saveStatus.type === 'error' ? 'bg-discord-red/20 text-discord-red border-l-4 border-discord-red' : ''}
                ${saveStatus.type === 'warning' ? 'bg-discord-yellow/20 text-discord-yellow border-l-4 border-discord-yellow' : ''}
                ${saveStatus.type === 'info' ? 'bg-discord-blurple/20 text-discord-blurple border-l-4 border-discord-blurple' : ''}`}>
                {saveStatus.type === 'info' && <LoadingIcon className="w-4 h-4 animate-spin" />}
                {saveStatus.message}
              </div>
            )}

            {/* Editor Content */}
            <div className="texx-1 grid grid-cols-2 overflow-hidden">
              {/* Editor Panel */}
              <div className="overflow-y-auto p-4 bg-dark-primary">
                <ComponentsV2Editor container={container} setContainer={setContainer} />
              </div>

              {/* Preview Panel */}
              <div className="bg-[#313338] border-l border-dark-tertiary flex flex-col">
                <div className="px-4 py-3 border-b border-white/5 flex items-center gap-2">
                  <EyeIcon className="w-4 h-4 text-text-muted" />
                  <h3 className="text-xs font-bold text-text-header-secondary uppercase tracking-wide">Preview - Components V2</h3>
                </div>
                <div className="flex-1 p-4 overflow-y-auto">
                  <ComponentsV2Preview container={container} />
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-28 h-28 bg-dark-secondary rounded-2xl flex items-center justify-center mb-6 opacity-60">
              <ComponentsIcon className="w-12 h-12 text-text-muted" />
            </div>
            <h2 className="text-2xl font-semibold text-text-header mb-2">Chọn một Template để chỉnh sửa</h2>
            <p className="text-base text-text-muted max-w-md">Chọn template từ danh sách bên trái để bắt đầu tùy chỉnh Components V2</p>
            <div className="mt-6 p-4 bg-dark-secondary rounded-lg border border-white/5 max-w-md">
              <p className="text-sm text-text-normal">
                <span className="text-discord-blurple font-semibold">💡 Tip:</span> Paste Guild ID vào ô input để tự động tải dữ liệu đã lưu
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default App
