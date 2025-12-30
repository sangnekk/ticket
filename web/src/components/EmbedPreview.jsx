function EmbedPreview({ embed }) {
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
    
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    text = text.replace(/\*(.*?)\*/g, '<em>$1</em>')
    text = text.replace(/__(.*?)__/g, '<u>$1</u>')
    text = text.replace(/~~(.*?)~~/g, '<del>$1</del>')
    text = text.replace(/```([\s\S]*?)```/g, '<pre class="bg-dark-tertiary p-2 rounded my-2 overflow-x-auto"><code>$1</code></pre>')
    text = text.replace(/`(.*?)`/g, '<code class="bg-dark-tertiary px-1 py-0.5 rounded text-sm font-mono">$1</code>')
    text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-discord-link hover:underline">$1</a>')
    text = text.replace(/<#(\d+)>/g, '<span class="bg-discord-blurple/30 text-[#c9cdfb] px-0.5 rounded font-medium cursor-pointer hover:bg-discord-blurple hover:text-white">#channel</span>')
    text = text.replace(/<@!?(\d+)>/g, '<span class="bg-discord-blurple/30 text-[#c9cdfb] px-0.5 rounded font-medium cursor-pointer hover:bg-discord-blurple hover:text-white">@user</span>')
    text = text.replace(/<@&(\d+)>/g, '<span class="bg-discord-blurple/30 text-[#c9cdfb] px-0.5 rounded font-medium cursor-pointer hover:bg-discord-blurple hover:text-white">@role</span>')
    text = text.replace(/\{(\w+)\}/g, '<span class="bg-discord-yellow/20 text-discord-yellow px-1 rounded font-mono text-sm">{$1}</span>')
    text = text.replace(/\n/g, '<br/>')
    
    return text
  }

  const hasContent = embed.title || embed.description || embed.author?.name || 
                     embed.fields?.length > 0 || embed.footer?.text || 
                     embed.image?.url || embed.thumbnail?.url

  if (!hasContent) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-text-muted text-center">
        <div className="text-5xl mb-3 opacity-50">
          <svg className="w-12 h-12" viewBox="0 0 24 24" fill="currentColor">
            <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
          </svg>
        </div>
        <p className="text-base text-text-normal mb-1">Embed trống</p>
        <span className="text-sm">Thêm nội dung để xem preview</span>
      </div>
    )
  }

  return (
    <div className="flex gap-4 py-1">
      <div className="flex-shrink-0">
        <img 
          src="https://cdn.discordapp.com/embed/avatars/0.png" 
          alt="Bot" 
          className="w-10 h-10 rounded-full"
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-base font-medium text-text-header">J & D Store Bot</span>
          <span className="bg-discord-blurple text-white text-[10px] font-semibold px-1.5 py-0.5 rounded uppercase">BOT</span>
          <span className="text-xs text-text-muted">
            Today at {new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        
        <div 
          className="bg-dark-secondary rounded p-3 max-w-[520px] mt-1 shadow-sm"
          style={{ borderLeft: `4px solid ${embed.color || '#5865F2'}` }}
        >
          {embed.author?.name && (
            <div className="flex items-center gap-2 mb-2">
              {embed.author.icon_url && (
                <img src={embed.author.icon_url} alt="" className="w-6 h-6 rounded-full object-cover" />
              )}
              {embed.author.url ? (
                <a href={embed.author.url} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-text-header hover:underline">
                  {embed.author.name}
                </a>
              ) : (
                <span className="text-sm font-semibold text-text-header">{embed.author.name}</span>
              )}
            </div>
          )}

          <div className="flex gap-4">
            <div className="flex-1 min-w-0">
              {embed.title && (
                <div className="text-base font-semibold text-text-header mb-2">
                  {embed.url ? (
                    <a href={embed.url} target="_blank" rel="noopener noreferrer" className="text-discord-link hover:underline">{embed.title}</a>
                  ) : embed.title}
                </div>
              )}

              {embed.description && (
                <div 
                  className="text-sm text-text-normal leading-relaxed whitespace-pre-wrap break-words"
                  dangerouslySetInnerHTML={{ __html: parseMarkdown(embed.description) }}
                />
              )}

              {embed.fields?.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mt-3">
                  {embed.fields.map((field, index) => (
                    <div key={index} className={field.inline ? 'col-span-1' : 'col-span-3'}>
                      {field.name && (
                        <div 
                          className="text-sm font-semibold text-text-header mb-1"
                          dangerouslySetInnerHTML={{ __html: parseMarkdown(field.name) }}
                        />
                      )}
                      {field.value && (
                        <div 
                          className="text-sm text-text-normal leading-relaxed whitespace-pre-wrap break-words"
                          dangerouslySetInnerHTML={{ __html: parseMarkdown(field.value) }}
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {embed.thumbnail?.url && (
              <div className="flex-shrink-0">
                <img src={embed.thumbnail.url} alt="" className="max-w-[80px] max-h-[80px] rounded object-cover" />
              </div>
            )}
          </div>

          {embed.image?.url && (
            <div className="mt-4">
              <img src={embed.image.url} alt="" className="max-w-full max-h-[300px] rounded object-contain" />
            </div>
          )}

          {(embed.footer?.text || embed.timestamp) && (
            <div className="flex items-center gap-2 mt-3 text-xs text-text-muted">
              {embed.footer?.icon_url && (
                <img src={embed.footer.icon_url} alt="" className="w-5 h-5 rounded-full object-cover" />
              )}
              <span>
                {embed.footer?.text}
                {embed.footer?.text && embed.timestamp && ' • '}
                {embed.timestamp && formatTimestamp()}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default EmbedPreview
