import { useState, useEffect, useCallback } from 'react'
import EmbedList from './components/EmbedList'
import ComponentsV2Editor from './components/ComponentsV2Editor'
import ComponentsV2Preview from './components/ComponentsV2Preview'
import { HomeIcon, EditIcon, DownloadIcon, RefreshIcon, SaveIcon, EyeIcon, LoadingIcon, ComponentsIcon } from './components/Icons'
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

  useEffect(() => {
    fetch('/api/locales')
      .then(res => res.json())
      .then(data => setLocales(data))
      .catch(err => console.error('Error fetching locales:', err))
  }, [])

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

  const loadTemplateData = useCallback(async (template, gId) => {
    if (!template) return null
    
    try {
      const url = gId 
        ? `/api/componentsv2/template/${template.id}?guildId=${gId}&locale=${locale}`
        : `/api/componentsv2/template/${template.id}?locale=${locale}`
      
      const res = await fetch(url)
      return await res.json()
    } catch (error) {
      console.error('Error loading template data:', error)
      return null
    }
  }, [locale])

  const buildContainerFromData = (template, values) => {
    const newContainer = {
      title: values.embed_title || values.welcome_title || values.denied_title || values.ticket_embed_title || values.dm_embed_title || '',
      description: values.embed_description || values.welcome_description || values.denied_description || values.ticket_embed_description || values.dm_embed_description || '',
      accentColor: template.accentColor || '#5865F2',
      image: values.embed_image || values.welcome_image || values.denied_image || '',
      buttons: [],
      footer: `-# J & D Store - Ticket System • <t:${Math.floor(Date.now() / 1000)}:f>`
    }
    
    if (template.buttons && template.buttons.length > 0) {
      newContainer.buttons = template.buttons.map(btn => {
        if (btn.id === 'buy') {
          return {
            emoji: values.button_buy_emoji || '📦',
            label: values.button_buy || 'Mua Hàng',
            style: btn.style,
            customId: btn.customId
          }
        } else if (btn.id === 'support') {
          return {
            emoji: values.button_support_emoji || '❓',
            label: values.button_support || 'Hỗ Trợ',
            style: btn.style,
            customId: btn.customId
          }
        } else if (btn.id === 'close') {
          return {
            emoji: '🗑️',
            label: values.button_close || 'Đóng Ticket',
            style: btn.style,
            customId: btn.customId
          }
        } else if (btn.id === 'delete') {
          return {
            emoji: '🗑️',
            label: values.button_delete || 'Xóa Ticket',
            style: btn.style,
            customId: btn.customId
          }
        }
        return btn
      })
    }
    
    return newContainer
  }

  const handleSelectTemplate = async (template) => {
    setSelectedTemplate(template)
    setIsLoading(true)
    
    const data = await loadTemplateData(template, guildId)
    
    if (data) {
      const newContainer = buildContainerFromData(template, data.values)
      setContainer(newContainer)
      
      if (data.hasOverrides && guildId) {
        setSaveStatus({ type: 'success', message: 'Đã tải dữ liệu custom!' })
        setTimeout(() => setSaveStatus({ type: '', message: '' }), 2000)
      }
    } else {
      const newContainer = buildContainerFromData(template, template.defaultValues || {})
      setContainer(newContainer)
    }
    
    setIsLoading(false)
  }

  const handleGuildIdChange = (e) => {
    setGuildId(e.target.value)
  }

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
            message: data.hasOverrides ? 'Đã tải dữ liệu custom!' : 'Sử dụng giá trị mặc định' 
          })
        }
        
        setIsLoading(false)
        setTimeout(() => setSaveStatus({ type: '', message: '' }), 3000)
      }
    }, 0)
  }

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
      
      // Map container fields to locale keys
      const fieldMappings = {
        title: ['embed_title', 'welcome_title', 'denied_title', 'ticket_embed_title', 'dm_embed_title'],
        description: ['embed_description', 'welcome_description', 'denied_description', 'ticket_embed_description', 'dm_embed_description'],
        image: ['embed_image', 'welcome_image', 'denied_image']
      }
      
      // Save title
      if (container.title) {
        for (const field of fieldMappings.title) {
          if (keys[field]) {
            savePromises.push(fetch('/api/text-override', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ guildId, key: keys[field], text: container.title })
            }))
            break
          }
        }
      }
      
      // Save description
      if (container.description) {
        for (const field of fieldMappings.description) {
          if (keys[field]) {
            savePromises.push(fetch('/api/text-override', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ guildId, key: keys[field], text: container.description })
            }))
            break
          }
        }
      }
      
      // Save image
      if (container.image) {
        for (const field of fieldMappings.image) {
          if (keys[field]) {
            savePromises.push(fetch('/api/text-override', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ guildId, key: keys[field], text: container.image })
            }))
            break
          }
        }
      }
      
      // Save button data
      if (container.buttons[0]) {
        if (keys.button_buy) {
          savePromises.push(fetch('/api/text-override', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ guildId, key: keys.button_buy, text: container.buttons[0].label })
          }))
        }
        if (keys.button_buy_emoji) {
          savePromises.push(fetch('/api/text-override', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ guildId, key: keys.button_buy_emoji, text: container.buttons[0].emoji })
          }))
        }
      }
      
      if (container.buttons[1]) {
        if (keys.button_support) {
          savePromises.push(fetch('/api/text-override', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ guildId, key: keys.button_support, text: container.buttons[1].label })
          }))
        }
        if (keys.button_support_emoji) {
          savePromises.push(fetch('/api/text-override', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ guildId, key: keys.button_support_emoji, text: container.buttons[1].emoji })
          }))
        }
      }
      
      await Promise.all(savePromises)
      setSaveStatus({ type: 'success', message: 'Đã lưu thành công!' })
    } catch (error) {
      setSaveStatus({ type: 'error', message: 'Lỗi kết nối server!' })
    }
    
    setIsLoading(false)
    setTimeout(() => setSaveStatus({ type: '', message: '' }), 3000)
  }

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

  const handleReset = async () => {
    if (!selectedTemplate) return
    
    setIsLoading(true)
    
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
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-[280px] bg-[#2b2d31] border-r border-[#1e1f22] flex flex-col flex-shrink-0">
        {/* Header */}
        <div className="p-4 border-b border-[#1e1f22]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#5865f2] to-[#7289da] rounded-xl flex items-center justify-center shadow-lg">
              <ComponentsIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-[#f2f3f5]">Components V2</h1>
              <p className="text-xs text-[#949ba4]">J & D Store Bot</p>
            </div>
          </div>
        </div>

        {/* Guild Input & Locale Select */}
        <div className="p-3 border-b border-[#1e1f22] space-y-2">
          <div className="relative">
            {isLoading ? (
              <LoadingIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5865f2] animate-spin" />
            ) : (
              <HomeIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#949ba4]" />
            )}
            <input
              type="text"
              className="w-full pl-10 pr-3 py-2.5 bg-[#1e1f22] border border-transparent rounded-lg text-[#dbdee1] text-sm transition-all hover:border-[#35373c] focus:border-[#5865f2] focus:ring-1 focus:ring-[#5865f2]/50 outline-none placeholder-[#949ba4]"
              placeholder="Paste Guild ID..."
              value={guildId}
              onChange={handleGuildIdChange}
              onPaste={handleGuildIdPaste}
            />
          </div>
          
          <select
            className="w-full px-3 py-2.5 bg-[#1e1f22] border border-transparent rounded-lg text-[#dbdee1] text-sm transition-all hover:border-[#35373c] focus:border-[#5865f2] outline-none cursor-pointer"
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
            <LoadingIcon className="w-8 h-8 text-[#5865f2] animate-spin" />
          </div>
        ) : (
          <EmbedList
            templates={templates}
            selectedTemplate={selectedTemplate}
            onSelect={handleSelectTemplate}
          />
        )}

        {/* Footer */}
        <div className="p-3 border-t border-[#1e1f22]">
          <p className="text-xs text-[#949ba4] text-center">© 2024 J & D Store</p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden bg-[#313338]">
        {selectedTemplate ? (
          <>
            {/* Header */}
            <header className="flex justify-between items-center px-6 py-3 bg-[#2b2d31] border-b border-[#1e1f22]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-[#1e1f22] rounded-lg flex items-center justify-center">
                  <EditIcon className="w-4 h-4 text-[#dbdee1]" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-[#f2f3f5]">{selectedTemplate.name}</h2>
                  <span className="text-xs text-[#949ba4]">{selectedTemplate.description}</span>
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
              <div className={`px-6 py-2.5 text-sm font-medium flex items-center gap-2 animate-slideDown
                ${saveStatus.type === 'success' ? 'bg-[#23a55a]/15 text-[#23a55a] border-l-4 border-[#23a55a]' : ''}
                ${saveStatus.type === 'error' ? 'bg-[#ed4245]/15 text-[#ed4245] border-l-4 border-[#ed4245]' : ''}
                ${saveStatus.type === 'warning' ? 'bg-[#fee75c]/15 text-[#fee75c] border-l-4 border-[#fee75c]' : ''}
                ${saveStatus.type === 'info' ? 'bg-[#5865f2]/15 text-[#5865f2] border-l-4 border-[#5865f2]' : ''}`}>
                {saveStatus.type === 'info' && <LoadingIcon className="w-4 h-4 animate-spin" />}
                {saveStatus.message}
              </div>
            )}

            {/* Editor Content */}
            <div className="flex-1 grid grid-cols-2 overflow-hidden">
              {/* Editor Panel */}
              <div className="overflow-y-auto p-4 bg-[#313338]">
                <ComponentsV2Editor container={container} setContainer={setContainer} />
              </div>

              {/* Preview Panel */}
              <div className="bg-[#313338] border-l border-[#1e1f22] flex flex-col">
                <div className="px-4 py-3 border-b border-[#1e1f22] flex items-center gap-2 bg-[#2b2d31]">
                  <EyeIcon className="w-4 h-4 text-[#949ba4]" />
                  <h3 className="text-xs font-bold text-[#949ba4] uppercase tracking-wider">Preview</h3>
                </div>
                <div className="flex-1 p-4 overflow-y-auto">
                  <ComponentsV2Preview container={container} />
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-24 h-24 bg-[#2b2d31] rounded-2xl flex items-center justify-center mb-6">
              <ComponentsIcon className="w-10 h-10 text-[#949ba4]" />
            </div>
            <h2 className="text-xl font-semibold text-[#f2f3f5] mb-2">Chọn một Template</h2>
            <p className="text-sm text-[#949ba4] max-w-md mb-6">Chọn template từ danh sách bên trái để bắt đầu tùy chỉnh Components V2</p>
            <div className="p-4 bg-[#2b2d31] rounded-lg border border-[#1e1f22] max-w-md">
              <p className="text-sm text-[#dbdee1]">
                <span className="text-[#5865f2] font-semibold">💡 Tip:</span> Paste Guild ID để tự động tải dữ liệu đã lưu
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default App
