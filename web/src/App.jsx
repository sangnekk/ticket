import { useState, useEffect, useRef, useCallback } from 'react'
import EmbedList from './components/EmbedList'
import EmbedEditor from './components/EmbedEditor'
import EmbedPreview from './components/EmbedPreview'
import { PaletteIcon, HomeIcon, EditIcon, DownloadIcon, RefreshIcon, SaveIcon, EyeIcon, ListIcon, LoadingIcon } from './components/Icons'
import './index.css'

const EMBED_TEMPLATES = [
  {
    id: 'ticket.setup',
    name: 'Ticket Setup',
    description: 'Embed hiển thị khi setup ticket',
    keys: { title: 'ticket.setup.embed_title', description: 'ticket.setup.embed_description' },
    defaultEmbed: {
      title: '🎫 Hệ Thống Ticket',
      description: '**Chào mừng bạn đến với hệ thống hỗ trợ!**\n\nVui lòng chọn loại ticket phù hợp với nhu cầu của bạn:\n\n📦 **Mua Hàng** - Tạo ticket để mua sản phẩm\n❓ **Hỗ Trợ** - Tạo ticket để được hỗ trợ\n\n*Lưu ý: Mỗi loại ticket bạn chỉ được tạo 1 ticket duy nhất.*',
      color: '#5865F2',
      footer: { text: 'J & D Store - Ticket System' }
    }
  },
  {
    id: 'ticket.create.welcome',
    name: 'Ticket Welcome',
    description: 'Embed chào mừng khi tạo ticket',
    keys: { title: 'ticket.create.welcome_title', description: 'ticket.create.welcome_description' },
    defaultEmbed: {
      title: '🎫 Ticket {type}',
      description: 'Xin chào {user}!\n\nCảm ơn bạn đã tạo ticket. Staff sẽ hỗ trợ bạn sớm nhất có thể.\n\n**Loại ticket:** {typeEmoji} {type}\n**Ticket ID:** #{ticketNumber}',
      color: '#5865F2',
      footer: { text: 'J & D Store - Ticket System' }
    }
  },
  {
    id: 'ticket.claim',
    name: 'Ticket Claimed',
    description: 'Embed khi staff claim ticket',
    keys: { title: 'ticket.claim.embed_title', description: 'ticket.claim.embed_description' },
    defaultEmbed: {
      title: '✅ Ticket Đã Được Claim',
      description: 'Staff {staff} đã nhận hỗ trợ ticket này.',
      color: '#00FF00'
    }
  },
  {
    id: 'ticket.close',
    name: 'Ticket Close',
    description: 'Embed xác nhận đóng ticket',
    keys: { title: 'ticket.close.embed_title', description: 'ticket.close.embed_description' },
    defaultEmbed: {
      title: '🔒 Đóng Ticket',
      description: 'Bạn có muốn đóng ticket này không?\n\n**Lưu ý:** Nếu ticket đã được claim, chỉ Staff mới có thể xóa ticket.',
      color: '#FF6B6B',
      footer: { text: 'J & D Store - Ticket System' }
    }
  },
  {
    id: 'ticket.close.denied',
    name: 'Ticket Close Denied',
    description: 'Embed từ chối đóng ticket',
    keys: { title: 'ticket.close.denied_title', description: 'ticket.close.denied_description' },
    defaultEmbed: {
      title: '❌ Action Denied',
      description: 'Xin lỗi, Bạn vui lòng Legit trước khi xóa ticket nha\n\nSau khi xong vui lòng tag tên Staff để staff có thể xóa ticket của bạn đi nheng.',
      color: '#FF0000'
    }
  },
  {
    id: 'ticket.dm.ticket',
    name: 'DM - Ticket Embed',
    description: 'Embed gửi vào ticket khi hoàn thành',
    keys: { title: 'ticket.dm.ticket_embed_title', description: 'ticket.dm.ticket_embed_description' },
    defaultEmbed: {
      title: '✅ Đơn Hàng Hoàn Thành',
      description: 'Đơn hàng của {user} đã được hoàn thành!\n\n**Đơn Hàng:** {reason}\n**Xử lý bởi:** {staff}',
      color: '#00FF00',
      footer: { text: 'J & D Store' }
    }
  },
  {
    id: 'ticket.dm.user',
    name: 'DM - User Embed',
    description: 'Embed gửi DM cho user',
    keys: { title: 'ticket.dm.dm_embed_title', description: 'ticket.dm.dm_embed_description' },
    defaultEmbed: {
      title: '📦 Thông Báo Từ J & D Store',
      description: 'Chủ sốp **{staff}** đã gửi cho bạn 1 tin nhắn!\n\n**Đơn hàng của bạn đã được hoàn thành**\n\n**Đơn Hàng:** {reason}\n\nXin hãy gửi cho chúng tui 1 legit ở <#1384052073439690813>\n\nCảm ơn bạn đã mua hàng ở **J & D Store**\n\nTicket của bạn: {channel}',
      color: '#5865F2',
      footer: { text: 'J & D Store - Cảm ơn bạn!' }
    }
  }
]

const DEFAULT_EMBED = {
  title: '',
  description: '',
  color: '#5865F2',
  author: { name: '', icon_url: '', url: '' },
  thumbnail: { url: '' },
  image: { url: '' },
  footer: { text: '', icon_url: '' },
  fields: [],
  timestamp: false
}

function App() {
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [embed, setEmbed] = useState({ ...DEFAULT_EMBED })
  const [guildId, setGuildId] = useState('')
  const [saveStatus, setSaveStatus] = useState({ type: '', message: '' })
  const [isLoading, setIsLoading] = useState(false)
  const [loadedData, setLoadedData] = useState({}) // Cache loaded data per template
  const prevGuildIdRef = useRef('')

  // Load data for a specific template
  const loadTemplateData = useCallback(async (template, gId) => {
    if (!gId || !template) return null
    
    try {
      const keys = template.keys
      const data = {}
      
      if (keys.title) {
        const res = await fetch('/api/text-override?guildId=' + gId + '&key=' + keys.title)
        const json = await res.json()
        if (json.text) data.title = json.text
      }
      
      if (keys.description) {
        const res = await fetch('/api/text-override?guildId=' + gId + '&key=' + keys.description)
        const json = await res.json()
        if (json.text) data.description = json.text
      }
      
      return Object.keys(data).length > 0 ? data : null
    } catch (error) {
      console.error('Error loading template data:', error)
      return null
    }
  }, [])

  // Load all templates data when Guild ID changes (paste/input)
  const loadAllTemplatesData = useCallback(async (gId) => {
    if (!gId || gId.length < 17) return // Discord Guild ID is 17-19 digits
    
    setIsLoading(true)
    setSaveStatus({ type: 'info', message: 'Đang tải dữ liệu...' })
    
    const newLoadedData = {}
    let hasAnyData = false
    
    for (const template of EMBED_TEMPLATES) {
      const data = await loadTemplateData(template, gId)
      if (data) {
        newLoadedData[template.id] = data
        hasAnyData = true
      }
    }
    
    setLoadedData(newLoadedData)
    setIsLoading(false)
    
    if (hasAnyData) {
      setSaveStatus({ type: 'success', message: 'Đã tải dữ liệu từ database!' })
    } else {
      setSaveStatus({ type: 'warning', message: 'Chưa có dữ liệu custom, sử dụng mặc định' })
    }
    
    setTimeout(() => setSaveStatus({ type: '', message: '' }), 3000)
    
    return newLoadedData
  }, [loadTemplateData])

  // Auto-load when Guild ID changes significantly (paste detection)
  useEffect(() => {
    const prevId = prevGuildIdRef.current
    const currentId = guildId.trim()
    
    // Detect paste: length changed by more than 1 character and new ID is valid length
    const isPaste = currentId.length >= 17 && Math.abs(currentId.length - prevId.length) > 1
    
    if (isPaste) {
      loadAllTemplatesData(currentId)
    }
    
    prevGuildIdRef.current = currentId
  }, [guildId, loadAllTemplatesData])

  // Apply loaded data when selecting a template
  const handleSelectTemplate = (template) => {
    setSelectedTemplate(template)
    
    const cached = loadedData[template.id]
    
    setEmbed({
      ...DEFAULT_EMBED,
      ...template.defaultEmbed,
      author: { ...DEFAULT_EMBED.author, ...template.defaultEmbed?.author },
      thumbnail: { ...DEFAULT_EMBED.thumbnail, ...template.defaultEmbed?.thumbnail },
      image: { ...DEFAULT_EMBED.image, ...template.defaultEmbed?.image },
      footer: { ...DEFAULT_EMBED.footer, ...template.defaultEmbed?.footer },
      fields: template.defaultEmbed?.fields || [],
      // Override with cached data if available
      ...(cached || {})
    })
  }

  // Handle Guild ID input change
  const handleGuildIdChange = (e) => {
    setGuildId(e.target.value)
  }

  // Handle paste event specifically
  const handleGuildIdPaste = async (e) => {
    // Let the paste happen first
    setTimeout(async () => {
      const pastedValue = e.target.value.trim()
      if (pastedValue.length >= 17) {
        const newData = await loadAllTemplatesData(pastedValue)
        // If a template is selected, update it with new data
        if (selectedTemplate && newData && newData[selectedTemplate.id]) {
          setEmbed(prev => ({
            ...prev,
            ...newData[selectedTemplate.id]
          }))
        }
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
      setSaveStatus({ type: 'error', message: 'Vui lòng chọn một embed!' })
      setTimeout(() => setSaveStatus({ type: '', message: '' }), 3000)
      return
    }
    try {
      const savePromises = []
      const keys = selectedTemplate.keys
      if (embed.title && keys.title) {
        savePromises.push(fetch('/api/text-override', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ guildId, key: keys.title, text: embed.title })
        }))
      }
      if (embed.description && keys.description) {
        savePromises.push(fetch('/api/text-override', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ guildId, key: keys.description, text: embed.description })
        }))
      }
      await Promise.all(savePromises)
      setSaveStatus({ type: 'success', message: 'Đã lưu thành công!' })
    } catch (error) {
      setSaveStatus({ type: 'error', message: 'Lỗi kết nối server!' })
    }
    setTimeout(() => setSaveStatus({ type: '', message: '' }), 3000)
  }

  const handleLoad = async () => {
    if (!guildId || !selectedTemplate) {
      setSaveStatus({ type: 'error', message: 'Vui lòng nhập Guild ID và chọn embed!' })
      setTimeout(() => setSaveStatus({ type: '', message: '' }), 3000)
      return
    }
    try {
      const keys = selectedTemplate.keys
      const loadedEmbed = { ...embed }
      let hasData = false
      if (keys.title) {
        const res = await fetch('/api/text-override?guildId=' + guildId + '&key=' + keys.title)
        const data = await res.json()
        if (data.text) {
          loadedEmbed.title = data.text
          hasData = true
        }
      }
      if (keys.description) {
        const res = await fetch('/api/text-override?guildId=' + guildId + '&key=' + keys.description)
        const data = await res.json()
        if (data.text) {
          loadedEmbed.description = data.text
          hasData = true
        }
      }
      setEmbed(loadedEmbed)
      setSaveStatus({ 
        type: hasData ? 'success' : 'warning', 
        message: hasData ? 'Đã tải thành công!' : 'Chưa có dữ liệu, sử dụng mặc định' 
      })
    } catch (error) {
      setSaveStatus({ type: 'error', message: 'Lỗi kết nối server!' })
    }
    setTimeout(() => setSaveStatus({ type: '', message: '' }), 3000)
  }

  const handleReset = () => {
    if (selectedTemplate) {
      setEmbed({
        ...DEFAULT_EMBED,
        ...selectedTemplate.defaultEmbed,
        author: { ...DEFAULT_EMBED.author, ...selectedTemplate.defaultEmbed?.author },
        thumbnail: { ...DEFAULT_EMBED.thumbnail, ...selectedTemplate.defaultEmbed?.thumbnail },
        image: { ...DEFAULT_EMBED.image, ...selectedTemplate.defaultEmbed?.image },
        footer: { ...DEFAULT_EMBED.footer, ...selectedTemplate.defaultEmbed?.footer },
        fields: selectedTemplate.defaultEmbed?.fields || []
      })
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-[300px] bg-dark-secondary border-r border-dark-tertiary flex flex-col flex-shrink-0 h-screen sticky top-0">
        {/* Header */}
        <div className="p-4 bg-gradient-to-b from-discord-blurple/15 to-transparent border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-discord-blurple rounded-lg flex items-center justify-center shadow-lg">
              <PaletteIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-text-header">Embed Editor</h1>
              <p className="text-xs text-text-muted">J & D Store Bot</p>
            </div>
          </div>
        </div>

        {/* Guild Input */}
        <div className="p-3 border-b border-white/5">
          <div className="relative">
            {isLoading ? (
              <LoadingIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-discord-blurple animate-spin" />
            ) : (
              <HomeIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            )}
            <input
              type="text"
              className="w-full pl-10 pr-3 py-2.5 bg-dark-tertiary border border-transparent rounded-lg text-text-normal text-sm transition-all hover:border-dark-hover focus:border-discord-blurple focus:ring-1 focus:ring-discord-blurple outline-none"
              placeholder="Paste Guild ID để tải dữ liệu..."
              value={guildId}
              onChange={handleGuildIdChange}
              onPaste={handleGuildIdPaste}
            />
          </div>
        </div>

        {/* Embed List */}
        <EmbedList
          templates={EMBED_TEMPLATES}
          selectedTemplate={selectedTemplate}
          onSelect={handleSelectTemplate}
        />

        {/* Footer */}
        <div className="p-3 border-t border-white/5 mt-auto">
          <p className="text-xs text-text-muted text-center">© 2024 J & D Store</p>
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
                <button onClick={handleLoad} className="btn btn-secondary">
                  <DownloadIcon className="w-4 h-4" />
                  <span>Tải</span>
                </button>
                <button onClick={handleReset} className="btn btn-secondary">
                  <RefreshIcon className="w-4 h-4" />
                  <span>Reset</span>
                </button>
                <button onClick={handleSave} className="btn btn-primary">
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
            <div className="flex-1 grid grid-cols-2 overflow-hidden">
              {/* Editor Panel */}
              <div className="overflow-y-auto p-4 bg-dark-primary">
                <EmbedEditor embed={embed} setEmbed={setEmbed} />
              </div>

              {/* Preview Panel */}
              <div className="bg-[#36393f] border-l border-dark-tertiary flex flex-col">
                <div className="px-4 py-3 border-b border-white/5 flex items-center gap-2">
                  <EyeIcon className="w-4 h-4 text-text-muted" />
                  <h3 className="text-xs font-bold text-text-header-secondary uppercase tracking-wide">Preview</h3>
                </div>
                <div className="flex-1 p-4 overflow-y-auto">
                  <EmbedPreview embed={embed} />
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-28 h-28 bg-dark-secondary rounded-2xl flex items-center justify-center mb-6 opacity-60">
              <ListIcon className="w-12 h-12 text-text-muted" />
            </div>
            <h2 className="text-2xl font-semibold text-text-header mb-2">Chọn một Embed để chỉnh sửa</h2>
            <p className="text-base text-text-muted max-w-md">Chọn embed từ danh sách bên trái để bắt đầu tùy chỉnh nội dung</p>
          </div>
        )}
      </main>
    </div>
  )
}

export default App
