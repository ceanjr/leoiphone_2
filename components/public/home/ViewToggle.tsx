import { memo } from 'react'
import { Button } from '@/components/ui/button'
import { LayoutGrid, List } from 'lucide-react'

interface ViewToggleProps {
  viewMode: 'grid' | 'list'
  onViewModeChange: (mode: 'grid' | 'list') => void
}

export const ViewToggle = memo(function ViewToggle({ viewMode, onViewModeChange }: ViewToggleProps) {
  return (
    <div className="flex gap-1 rounded-lg border border-zinc-800 bg-zinc-900 p-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onViewModeChange('list')}
        className={`h-8 gap-1.5 px-3 ${
          viewMode === 'list'
            ? 'bg-yellow-500 text-black hover:bg-yellow-600 hover:text-black'
            : 'text-zinc-400 hover:text-white'
        }`}
        aria-label="Visualização em lista"
      >
        <List className="h-4 w-4" />
        <span className="text-xs">Lista</span>
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onViewModeChange('grid')}
        className={`h-8 gap-1.5 px-3 ${
          viewMode === 'grid'
            ? 'bg-yellow-500 text-black hover:bg-yellow-600 hover:text-black'
            : 'text-zinc-400 hover:text-white'
        }`}
        aria-label="Visualização em grade"
      >
        <LayoutGrid className="h-4 w-4" />
        <span className="text-xs">Grade</span>
      </Button>
    </div>
  )
})
