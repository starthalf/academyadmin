import type { Child } from '../../data/types';

interface ChildAvatarProps {
  child: Child;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'w-10 h-10',
  md: 'w-14 h-14',
  lg: 'w-20 h-20',
};

export default function ChildAvatar({ child, size = 'md' }: ChildAvatarProps) {
  return (
    // [수정] flex-row로 변경하여 사진 우측에 정보 배치, gap 확장
    <div className="flex flex-row items-center gap-4">
      <div
        className={`${sizeClasses[size]} rounded-full overflow-hidden ring-2 ring-primary-100 ring-offset-2 flex-shrink-0`}
      >
        <img
          src={child.avatar}
          alt={child.name}
          className="w-full h-full object-cover"
        />
      </div>
      {/* [수정] 텍스트를 왼쪽 정렬하고 세로로 쌓음 */}
      <div className="flex flex-col">
        <span className="font-bold text-lg text-gray-800 leading-tight">{child.name}</span>
        <span className="text-sm text-gray-500">{child.grade}</span>
      </div>
    </div>
  );
}