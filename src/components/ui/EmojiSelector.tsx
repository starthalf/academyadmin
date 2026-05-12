interface EmojiOption {
  emoji: string;
  label: string;
  value: string;
}

interface EmojiSelectorProps {
  options: EmojiOption[];
  selected: string | null;
  onSelect: (value: string) => void;
}

export default function EmojiSelector({ options, selected, onSelect }: EmojiSelectorProps) {
  return (
    <div className="flex justify-center gap-3">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onSelect(option.value)}
          className={`flex flex-col items-center gap-1.5 py-2.5 px-3 rounded-xl transition-all duration-200 min-w-[60px] ${
            selected === option.value
              ? 'bg-blue-50 border-2 border-blue-500 scale-105'
              : 'bg-white border-2 border-gray-200 hover:bg-gray-50'
          }`}
        >
          <span className="text-3xl">{option.emoji}</span>
          <span className={`text-xs whitespace-nowrap ${selected === option.value ? 'text-blue-600 font-semibold' : 'text-gray-500'}`}>
            {option.label}
          </span>
        </button>
      ))}
    </div>
  );
}
