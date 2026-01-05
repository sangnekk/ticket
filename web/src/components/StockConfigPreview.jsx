import { useMemo } from 'react'

const BUTTON_COLORS = {
  primary: 'bg-[#5865f2] hover:bg-[#4752c4]',
  secondary: 'bg-[#4e5058] hover:bg-[#6d6f78]',
  success: 'bg-[#23a55a] hover:bg-[#1a7f45]',
  danger: 'bg-[#ed4245] hover:bg-[#c93b3e]',
}

function StockConfigPreview({ config }) {
  const formatTimestamp = () => {
    const now = new Date()
    return now.toLocaleDateString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })
  }

  const replacePlaceholders = (text) => {
    if (!text) return ''
    const now = Math.floor(Date.now() / 1000)
    return text
      .replace(/\{user\}/g, '<span class="text-[#00aff4]">@User</span>')
      .replace(/\{user\.tag\}/g, 'User#0000')
      .replace(/\{user\.name\}/g, 'User')
      .replace(/\{user\.id\}/g, '123456789')
      .replace(/\{guild\.name\}/g, 'J & D Store')
      .replace(/\{guild\.id\}/g, '987654321')
      .replace(/\{guild\.memberCount\}/g, '1,234')
      .replace(/\{timestamp:R\}/g, `<span class="bg-[#1e1f22] px-1.5 py-0.5 rounded">vài giây trước</span>`)
      .replace(/\{timestamp:F\}/g, `<span class="bg-[#1e1f22] px-1.5 py-0.5 rounded">${formatTimestamp()}</span>`)
      .replace(/\{timestamp:f\}/g, `<span class="bg-[#1e1f22] px-1.5 py-0.5 rounded">${formatTimestamp()}</span>`)
      .replace(/\{timestamp:D\}/g, `<span class="bg-[#1e1f22] px-1.5 py-0.5 rounded">${new Date().toLocaleDateString('vi-VN')}</span>`)
      .replace(/\{timestamp:T\}/g, `<span class="bg-[#1e1f22] px-1.5 py-0.5 rounded">${new Date().toLocaleTimeString('vi-VN')}</span>`)
      .replace(/\{timestamp\}/g, `<span class="bg-[#1e1f22] px-1.5 py-0.5 rounded">${now}</span>`)
      .replace(/\{date\}/g, new Date().toLocaleDateString('vi-VN'))
      .replace(/\{time\}/g, new Date().toLocaleTimeString('vi-VN'))
      .replace(/\{channel\}/g, '<span class="text-[#00aff4]">#channel</span>')
      .replace(/<t:(\d+):([a-zA-Z])>/g, `<span class="bg-[#1e1f22] px-1.5 py-0.5 rounded">${formatTimestamp()}</span>`)
  }

  const parseMarkdown = (text) => {
    if (!text) return ''
    text = replacePlaceholders(text)
    // Headers
    text = text.replace(/^### (.*?)$/gm, '<div class="text-base font-semibold text-[#f2f3f5] mb-1">$1</div>')
    text = text.replace(/^## (.*?)$/gm, '<div class="text-lg font-semibold text-[#f2f3f5] mb-2">$1</div>')
    text = text.replace(/^# (.*?)$/gm, '<div class="text-xl font-bold text-[#f2f3f5] mb-2">$1</div>')
    // Formatting
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
    text = text.replace(/\*(.*?)\*/g, '<em>$1</em>')
    text = text.replace(/__(.*?)__/g, '<u>$1</u>')
    text = text.replace(/~~(.*?)~~/g, '<del class="opacity-60">$1</del>')
    text = text.replace(/`(.*?)`/g, '<code class="bg-[#1e1f22] px-1.5 py-0.5 rounded text-sm font-mono text-[#e8912d]">$1</code>')
    text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-[#00aff4] hover:underline">$1</a>')
    text = text.replace(/^-# (.*?)$/gm, '<span class="text-xs text-[#949ba4]">$1</span>')
    text = text.replace(/\n/g, '<br/>')
    return text
  }

  const sections = useMemo(() => {
    return Array.isArray(config?.sections) ? config.sections : []
  }, [config?.sections])

  const buttons = useMemo(() => {
    return Array.isArray(config?.buttons) ? config.buttons : []
  }, [config?.buttons])

  if (!config?.enabled && config?.enabled !== undefined) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-20 h-20 bg-[#2b2d31] rounded-2xl flex items-center justify-center mb-4">
          <svg className="w-10 h-10 text-[#949ba4]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
        </div>
        <p className="text-base text-[#f2f3f5] font-medium mb-1">Stock Disabled</p>
        <span className="text-sm text-[#949ba4]">Bật stock để xem preview</span>
      </div>
    )
  }

  if (sections.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-20 h-20 bg-[#2b2d31] rounded-2xl flex items-center justify-center mb-4">
          <svg className="w-10 h-10 text-[#949ba4]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
          </svg>
        </div>
        <p className="text-base text-[#f2f3f5] font-medium mb-1">Chưa có nội dung</p>
        <span className="text-sm text-[#949ba4]">Thêm sections để xem preview</span>
      </div>
    )
  }

  return (
    <div className="flex gap-4 py-2">
      {/* Bot Avatar */}
      <div className="flex-shrink-0">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#5865f2] to-[#7289da] flex items-center justify-center text-white font-bold text-sm">
          JD
        </div>
      </div>
      
      <div className="flex-1 min-w-0">
        {/* Bot Name & Badge */}
        <div className="flex items-center gap-2 mb-1">
          <span className="text-base font-medium text-[#f2f3f5] hover:underline cursor-pointer">J & D Store Bot</span>
          <span className="bg-[#5865f2] text-white text-[10px] font-semibold px-1.5 py-0.5 rounded">BOT</span>
          <span className="text-xs text-[#949ba4]">
            Today at {new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        
        {/* Components V2 Container */}
        <div className="rounded-lg overflow-hidden max-w-[520px] shadow-lg bg-[#2b2d31] border-l-4 border-[#5865f2]">
          <div className="p-4 space-y-3">
            {sections.map((section, idx) => (
              <div key={idx}>
                {section.type === 'heading' && (
                  <div 
                    className="text-[#f2f3f5]"
                    dangerouslySetInnerHTML={{ 
                      __html: parseMarkdown(
                        section.level === 1 ? `# ${section.content}` :
                        section.level === 3 ? `### ${section.content}` :
                        `## ${section.content}`
                      ) 
                    }}
                  />
                )}
                
                {section.type === 'text' && (
                  <div 
                    className="text-sm text-[#dbdee1] leading-relaxed whitespace-pre-wrap break-words"
                    dangerouslySetInnerHTML={{ __html: parseMarkdown(section.content) }}
                  />
                )}
                
                {section.type === 'separator' && (
                  <div className={section.spacing === 'large' ? 'py-2' : 'py-1'}>
                    {section.divider !== false && <div className="h-px bg-white/10"></div>}
                  </div>
                )}
                
                {section.type === 'image' && section.url && (
                  <img 
                    src={section.url} 
                    alt="Media" 
                    className="w-full max-h-[300px] rounded-lg object-cover"
                    onError={(e) => {
                      e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200" viewBox="0 0 400 200"><rect fill="%231e1f22" width="400" height="200"/><text fill="%23949ba4" font-family="sans-serif" font-size="14" x="50%" y="50%" text-anchor="middle" dy=".3em">Image failed to load</text></svg>'
                    }}
                  />
                )}
              </div>
            ))}
            
            {/* Footer */}
            {config?.footer && (
              <div 
                className="text-xs text-[#949ba4] pt-2"
                dangerouslySetInnerHTML={{ __html: parseMarkdown(config.footer) }}
              />
            )}
          </div>
          
          {/* Buttons */}
          {buttons.length > 0 && (
            <div className="px-4 pb-4 flex gap-2 flex-wrap">
              {buttons.map((btn, idx) => (
                <button
                  key={idx}
                  className={`px-4 py-2 rounded text-sm font-medium text-white transition-colors flex items-center gap-2 ${BUTTON_COLORS[btn.style] || BUTTON_COLORS.primary}`}
                >
                  {btn.emoji && <span>{btn.emoji}</span>}
                  {btn.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default StockConfigPreview
