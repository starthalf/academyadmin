// HashtagList.tsx 내부 예시
export default function HashtagList({ hashtags }: { hashtags: string[] }) {
  return (
    <div className="flex flex-nowrap gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {hashtags.map((tag) => (
        <span 
          key={tag} 
          className="whitespace-nowrap px-2 py-1 bg-gray-50 text-gray-600 text-[10px] sm:text-xs rounded-full border border-gray-100"
        >
          #{tag}
        </span>
      ))}
    </div>
  );
}