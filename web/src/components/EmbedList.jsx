import { CheckIcon, TicketIcon } from './Icons'

function EmbedList({ templates, selectedTemplate, onSelect }) {
  // Group templates by category
  const groupedTemplates = templates.reduce((acc, template) => {
    const category = template.category || 'other'
    if (!acc[category]) acc[category] = []
    acc[category].push(template)
    return acc
  }, {})

  const categoryLabels = {
    ticket: { label: 'Ticket System', icon: TicketIcon },
    other: { label: 'Khác', icon: null }
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex justify-between items-center px-4 py-3 text-xs font-bold text-text-header-secondary uppercase tracking-wide">
        <span>Components V2</span>
        <span className="bg-discord-blurple text-white px-2 py-0.5 rounded-full text-xs font-semibold">
          {templates.length}
        </span>
      </div>
      
      <div className="flex-1 overflow-y-auto px-2 pb-2">
        {Object.entries(groupedTemplates).map(([category, categoryTemplates]) => {
          const categoryInfo = categoryLabels[category] || { label: category }
          const CategoryIcon = categoryInfo.icon
          
          return (
            <div key={category} className="mb-3">
              <div className="flex items-center gap-2 px-2 py-2 text-xs font-bold text-text-muted uppercase tracking-wide">
                {CategoryIcon && <CategoryIcon className="w-3.5 h-3.5" />}
                <span>{categoryInfo.label}</span>
                <span className="text-[10px] bg-dark-tertiary px-1.5 py-0.5 rounded">
                  {categoryTemplates.length}
                </span>
              </div>
              
              <div className="space-y-0.5">
                {categoryTemplates.map((template) => (
                  <button
                    key={template.id}
                    className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-all duration-200 relative group
                      ${selectedTemplate?.id === template.id 
                        ? 'bg-dark-active border border-white/5' 
                        : 'bg-transparent hover:bg-dark-hover border border-transparent'
                      }`}
                    onClick={() => onSelect(template)}
                  >
                    <div 
                      className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 bg-discord-blurple rounded-full transition-all duration-200
                        ${selectedTemplate?.id === template.id ? 'h-[70%]' : 'h-0 group-hover:h-1/2'}`}
                    />
                    
                    <div className="flex flex-col gap-0.5 min-w-0 flex-1 pl-1">
                      <span className={`text-sm font-medium truncate transition-colors
                        ${selectedTemplate?.id === template.id ? 'text-text-header' : 'text-text-normal group-hover:text-text-header'}`}>
                        {template.name}
                      </span>
                      <span className="text-xs text-text-muted truncate">
                        {template.description}
                      </span>
                    </div>
                    
                    <div className={`text-discord-blurple ml-2 transition-all duration-200
                      ${selectedTemplate?.id === template.id ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}>
                      <CheckIcon className="w-4 h-4" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default EmbedList
