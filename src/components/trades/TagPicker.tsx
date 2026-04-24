'use client'

const TAGS = [
  'confident',
  'planned',
  'good_setup',
  'rushed',
  'scared',
  'chasing',
  'revenge_trade',
]

interface TagPickerProps {
  selected: string[]
  onChange: (tags: string[]) => void
}

export default function TagPicker({ selected, onChange }: TagPickerProps) {
  function toggle(tag: string) {
    onChange(
      selected.includes(tag) ? selected.filter((t) => t !== tag) : [...selected, tag]
    )
  }

  return (
    <div className="flex flex-wrap gap-2">
      {TAGS.map((tag) => (
        <button
          key={tag}
          type="button"
          onClick={() => toggle(tag)}
          className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
            selected.includes(tag)
              ? 'bg-blue-600 border-blue-600 text-white'
              : 'border-gray-600 text-gray-400 hover:border-gray-400'
          }`}
        >
          {tag.replace(/_/g, ' ')}
        </button>
      ))}
    </div>
  )
}
