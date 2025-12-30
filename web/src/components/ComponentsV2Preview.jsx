function ComponentsV2Preview({ container }) {
  const formatTimestamp = () => {
    const now = new Date()
    return now.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const parseMarkdown = (text) => {
    if (!text) return ''
    
    // Headers
    text = text.replace(/^## (.*?)$/gm, '<div class="text-lg font-semibold text-[#f2f3f5] mb-2">$1</div>')
    text = text.replace(/^### (.*?)$/gm, '<div class="text-base font-semibold text-[#f2f3f5] mb-1">$1</div>')
    
    // Bold, italic, underline, strikethrough
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
    text = text.replace(/\*(.*?)\*/g, '<em>$1</em>')
    text = text.replace(/__(.*?)__/g, '<u>$1</u>')
    text = text.replace(/~~(.*?)~~/g, '<del class="opacity-60">$1</del>')
    
    // Code blocks
    text = text.replace(/```([\s\S]*?)```/g, '<pre class="bg-[#1e1f22] p-2 rounded my-2 overflow-x-auto text-sm"><code>$1</code></pre>')
    text = text.replace(/`(.*?)`/g, '<code class="bg-[#1e1f22] px-1.5 py-0.5 rounded text-sm font-mono text-[#e8912d]">$1</code>')
    
    // Links
    text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-[#00aff4] hover:underline">$1</a>')
    
    // Discord mentions
    text = text.replace(/<#(\d+)>/g, '<span class="bg-[#5865f2]/25 text-[#c9cdfb] px-1 rounded font-medium cursor-pointer hover:bg-[#5865f2] hover:text-white transition-colors">#channel</span>')
    text = text.replace(/<@!?(\d+)>/g, '<span class="bg-[#5865f2]/25 text-[#c9cdfb] px-1 rounded font-medium cursor-pointer hover:bg-[#5865f2] hover:text-white transition-colors">@user</span>')
    text = text.replace(/<@&(\d+)>/g, '<span class="bg-[#5865f2]/25 text-[#c9cdfb] px-1 rounded font-medium cursor-pointer hover:bg-[#5865f2] hover:text-white transition-colors">@role</span>')
    
    // Timestamps
    text = text.replace(/<t:(\d+):([a-zA-Z])>/g, '<span class="bg-[#1e1f22] px-1.5 py-0.5 rounded text-[#dbdee1]">' + formatTimestamp() + '</span>')
    
    // Subtext (Discord's -# syntax)
    text = text.replace(/^-# (.*?)$/gm, '<span class="text-xs text-[#949ba4]">$1</span>')
    
    // Placeholders
    text = text.replace(/\{(\w+)\}/g, '<span class="bg-[#fee75c]/20 text-[#fee75c] px-1 rounded font-mono text-sm">{$1}</span>')
    
    // Line breaks
    text = text.replace(/\n/g, '<br/>')
    
    return text
  }

  const hasContent = container.title || container.description || container.buttons?.length > 0 || container.image

  if (!hasContent) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-20 h-20 bg-[#2b2d31] rounded-2xl flex items-center justify-center mb-4">
          <svg className="w-10 h-10 text-[#949ba4]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
          </svg>
        </div>
        <p className="text-base text-[#f2f3f5] font-medium mb-1">Container trống</p>
        <span  className="text-sm text-[#949ba4]">Thêm nội dung để xem preview</span>
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
        <div 
          className="rounded-lg overflow-hidden max-w-[520px] mt-1 shadow-lg"
          style={{ 
            backgroundColor: '#2b2d31',
            borderLeft: `4px solid ${container.accentColor || '#5865F2'}` 
          }}
        >
          {/* Title Section */}
          {container.title && (
            <div className="px-4 pt-4">
              <div 
                className="text-[#f2f3f5]"
                dangerouslySetInnerHTML={{ __html: parseMarkdown(container.title) }}
              />
            </div>
          )}

          {/* Separator */}
          {container.title && container.description && (
            <div className="px-4 py-3">
              <div className="h-px bg-white/10"></div>
            </div>
          )}

          {/* Description Section */}
          {container.description && (
            <div className="px-4 pb-3">
              <div 
                className="text-sm text-[#dbdee1] leading-relaxed whitespace-pre-wrap break-words"
                dangerouslySetInnerHTML={{ __html: parseMarkdown(container.description) }}
              />
            </div>
          )}

          {/* Media Gallery */}
          {container.image && (
            <div className="px-4 py-2">
              <img 
                src={container.image} 
                alt="Media Gallery" 
                className="w-full max-h-[300px] rounded-lg object-cover"
                onError={(e) => {
                  e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200" viewBox="0 0 400 200"><rect fill="%231e1f22" width="400" height="200"/><text fill="%23949ba4" font-family="sans-serif" font-size="14" x="50%" y="50%" text-anchor="middle" dy=".3em">Image failed to load</text></svg>'
                }}
              />
            </div>
          )}

          {/* Separator before buttons */}
          {container.buttons?.length > 0 && (
            <div className="px-4 py-2">
              <div className="h-px bg-white/10"></div>
            </div>
          )}

          {/* Action Row - Buttons */}
          {container.buttons?.length > 0 && (
            <div className="px-4 pb-4">
              <div className="flex flex-wrap gap-2">
                {container.buttons.map((btn, index) => (
                  <button
                    key={index}
                    className={`
                      inline-flex items-center gap-2 px-4 py-2 rounded text-sm font-medium transition-all cursor-pointer
                      ${btn.style === 'primary' ? 'bg-[#5865f2] hover:bg-[#4752c4] text-white' : ''}
                      ${btn.style === 'secondary' ? 'bg-[#4e5058] hover:bg-[#6d6f78] text-white' : ''}
                      ${btn.style === 'success' ? 'bg-[#23a55a] hover:bg-[#1e8e4e] text-white' : ''}
                      ${btn.style === 'danger' ? 'bg-[#ed4245] hover:bg-[#d63b3e] text-white' : ''}
                    `}
                  >
                    {btn.emoji && <span>{btn.emoji}</span>}
                    <span>{btn.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Footer with timestamp */}
          {container.footer && (
            <div className="px-4 pb-4">
              <div 
                className="text-xs text-[#949ba4]"
                dangerouslySetInnerHTML={{ __html: parseMarkdown(container.footer) }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ComponentsV2Preview
