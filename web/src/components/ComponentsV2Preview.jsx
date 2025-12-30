import { useState } from 'react'

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
    text = text.replace(/^## (.*?)$/gm, '<div class="text-lg font-semibold text-text-header mb-2">$1</div>')
    text = text.replace(/^### (.*?)$/gm, '<div class="text-base font-semibold text-text-header mb-1">$1</div>')
    
    // Bold, italic, underline, strikethrough
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    text = text.replace(/\*(.*?)\*/g, '<em>$1</em>')
    text = text.replace(/__(.*?)__/g, '<u>$1</u>')
    text = text.replace(/~~(.*?)~~/g, '<del>$1</del>')
    
    // Code blocks
    text = text.replace(/```([\s\S]*?)```/g, '<pre class="bg-dark-tertiary p-2 rounded my-2 overflow-x-auto"><code>$1</code></pre>')
    text = text.replace(/`(.*?)`/g, '<code class="bg-dark-tertiary px-1 py-0.5 rounded text-sm font-mono">$1</code>')
    
    // Links
    text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-discord-link hover:underline">$1</a>')
    
    // Discord mentions
    text = text.replace(/<#(\d+)>/g, '<span class="bg-discord-blurple/30 text-[#c9cdfb] px-0.5 rounded font-medium cursor-pointer hover:bg-discord-blurple hover:text-white">#channel</span>')
    text = text.replace(/<@!?(\d+)>/g, '<span class="bg-discord-blurple/30 text-[#c9cdfb] px-0.5 rounded font-medium cursor-pointer hover:bg-discord-blurple hover:text-white">@user</span>')
    text = text.replace(/<@&(\d+)>/g, '<span class="bg-discord-blurple/30 text-[#c9cdfb] px-0.5 rounded font-medium cursor-pointer hover:bg-discord-blurple hover:text-white">@role</span>')
    
    // Timestamps
    text = text.replace(/<t:(\d+):([a-zA-Z])>/g, '<span class="bg-dark-tertiary px-1 rounded text-text-normal">' + formatTimestamp() + '</span>')
    
    // Subtext (Discord's -# syntax)
    text = text.replace(/^-# (.*?)$/gm, '<span class="text-xs text-text-muted">$1</span>')
    
    // Placeholders
    text = text.replace(/\{(\w+)\}/g, '<span class="bg-discord-yellow/20 text-discord-yellow px-1 rounded font-mono text-sm">{$1}</span>')
    
    // Line breaks
    text = text.replace(/\n/g, '<br/>')
    
    return text
  }

  const hasContent = container.title || container.description || container.buttons?.length > 0 || container.image

  // Debug log
  console.log('Container data:', container)
  console.log('Container image:', container.image)

  if (!hasContent) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-text-muted text-center">
        <div className="text-5xl mb-3 opacity-50">
          <svg className="w-12 h-12" viewBox="0 0 24 24" fill="currentColor">
            <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
          </svg>
        </div>
        <p className="text-base text-text-normal mb-1">Container trống</p>
        <span className="text-sm">Thêm nội dung để xem preview</span>
      </div>
    )
  }

  return (
    <div className="flex gap-4 py-1">
      {/* Bot Avatar */}
      <div className="flex-shrink-0">
        <img 
          src="https://cdn.discordapp.com/embed/avatars/0.png" 
          alt="Bot" 
          className="w-10 h-10 rounded-full"
        />
      </div>
      
      <div className="flex-1 min-w-0">
        {/* Bot Name & Badge */}
        <div className="flex items-center gap-2 mb-1">
          <span className="text-base font-medium text-text-header">J & D Store Bot</span>
          <span className="bg-discord-blurple text-white text-[10px] font-semibold px-1.5 py-0.5 rounded uppercase">BOT</span>
          <span className="text-xs text-text-muted">
            Today at {new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        
        {/* Components V2 Container */}
        <div 
          className="rounded-lg overflow-hidden max-w-[520px] mt-1"
          style={{ 
            backgroundColor: '#2b2d31',
            borderLeft: `4px solid ${container.accentColor || '#5865F2'}` 
          }}
        >
          {/* Title Section */}
          {container.title && (
            <div className="px-4 pt-3">
              <div 
                className="text-base font-semibold text-text-header"
                dangerouslySetInnerHTML={{ __html: parseMarkdown(container.title) }}
              />
            </div>
          )}

          {/* Separator */}
          {container.title && container.description && (
            <div className="px-4 py-2">
              <div className="h-px bg-white/10"></div>
            </div>
          )}

          {/* Description Section */}
          {container.description && (
            <div className="px-4 pb-2">
              <div 
                className="text-sm text-text-normal leading-relaxed whitespace-pre-wrap break-words"
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
                style={{ display: 'block' }}
                onError={(e) => {
                  console.log('Image load error:', container.image)
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
            <div className="px-4 pb-3">
              <div className="flex flex-wrap gap-2">
                {container.buttons.map((btn, index) => (
                  <button
                    key={index}
                    className={`
                      inline-flex items-center gap-2 px-4 py-2 rounded text-sm font-medium transition-all
                      ${btn.style === 'primary' ? 'bg-discord-blurple hover:bg-discord-blurple/80 text-white' : ''}
                      ${btn.style === 'secondary' ? 'bg-[#4e5058] hover:bg-[#6d6f78] text-white' : ''}
                      ${btn.style === 'success' ? 'bg-discord-green hover:bg-discord-green/80 text-white' : ''}
                      ${btn.style === 'danger' ? 'bg-discord-red hover:bg-discord-red/80 text-white' : ''}
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
            <div className="px-4 pb-3">
              <div 
                className="text-xs text-text-muted"
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
