import { TicketIcon, MessageIcon, CheckIcon, CodeIcon } from './Icons'

const CATEGORY_ICONS = {
  ticket: TicketIcon,
  message: MessageIcon,
  example: CodeIcon,
  server: MessageIcon,
}

const CATEGORY_COLORS = {
  ticket: 'from-[#5865f2] to-[#7289da]',
  example: 'from-[#23a55a] to-[#57f287]',
  server: 'from-[#fee75c] to-[#faa61a]',
}

function EmbedList({ templates, selectedTemplate, onSelect }) {
  const groupedTemplates = templates.reduce((acc, template) => {
    const category = template.category || 'other'
    if (!acc[category]) acc[category] = []
    acc[category].push(template)
    return acc
  }, {})

  return (
    <div className="flex-1 overflow-y-auto">
      {Object.entries(groupedTemplates).map(([category, categoryTemplates]) => {
        const IconComponent = CATEGORY_ICONS[category] || MessageIcon
        const gradientColor = CATEGORY_COLORS[category] || 'from-[#5865f2] to-[#7289da]'
        
        return (
          <div key={category} className="mb-2">
            <div className="px-4 py-2 flex items-center gap-2">
              <div className={`w-6 h-6 rounded bg-gradient-to-br ${gradientColor} flex items-center justify-center`}>
                <IconComponent className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-xs font-bold text-[#949ba4] uppercase tracking-wider">
                {category}
              </span>
              <span className="text-xs text-[#949ba4] ml-auto">
                {categoryTemplates.length}
              </span>
            </div>
            
            <div className="px-2 space-y-1">
              {categoryTemplates.map((template) => {
                const isSelected = selectedTemplate?.id === template.id
                
                return (
                  <button
                    key={template.id}
                    onClick={() => onSelect(template)}
                    className={`
                      w-full text-left px-3 py-2.5 rounded-lg transition-all duration-150
                      ${isSelected 
                        ? 'bg-[#5865f2]/20 border border-[#5865f2]/50' 
                        : 'hover:bg-[#35373c] border border-transparent'
                      }
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`
                        w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0
                        ${isSelected ? 'bg-[#5865f2]' : 'bg-[#1e1f22]'}
                      `}>
                        {isSelected ? (
                          <CheckIcon className="w-4 h-4 text-white" />
                        ) : (
                          <span className="text-xs font-bold text-[#949ba4]">
                            {template.name.charAt(0)}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${isSelected ? 'text-[#f2f3f5]' : 'text-[#dbdee1]'}`}>
                          {template.name}
                        </p>
                        <p className="text-xs text-[#949ba4] truncate">
                          {template.sourceFiles?.length > 0 
                            ? `${template.sourceFiles.length} file(s) • ${Object.keys(template.keys).length} keys`
                            : template.description
                          }
                        </p>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
      
      {templates.length === 0 && (
        <div className="flex flex-col items-center justify-center py-10 text-center px-4">
          <div className="w-12 h-12 bg-[#1e1f22] rounded-xl flex items-center justify-center mb-3">
            <MessageIcon className="w-6 h-6 text-[#949ba4]" />
          </div>
          <p className="text-sm text-[#949ba4]">Không tìm thấy embed nào</p>
          <p className="text-xs text-[#72767d] mt-1">Hãy đảm bảo bot sử dụng EmbedComponentsV2</p>
        </div>
      )}
    </div>
  )
}

export default EmbedList
