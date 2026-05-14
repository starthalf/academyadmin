import type { Child, WeeklyReport, ParentAction } from './types';

export const children: Child[] = [
  {
    id: '1',
    name: '민준',
    grade: '초등학교 3학년',
    age: 9,
    avatar: 'https://images.pexels.com/photos/1620760/pexels-photo-1620760.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
  },
  {
    id: '2',
    name: '서연',
    grade: '초등학교 5학년',
    age: 11,
    avatar: 'https://images.pexels.com/photos/1557843/pexels-photo-1557843.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
  },
];

export const weeklyReports: WeeklyReport[] = [
  {
    weekId: '2026-w05',
    startDate: '2026-01-26',
    endDate: '2026-02-01',
    stats: {
      focus: 85,
      growthMind: 78,
      comprehension: 92,
      logic: 88,
      energy: 75,
    },
    trends: [
      { subject: '수학', trend: 'up', changePercent: 12 },
      { subject: '영어', trend: 'stable', changePercent: 0 },
      { subject: '과학', trend: 'up', changePercent: 8 },
      { subject: '국어', trend: 'down', changePercent: -5 },
      { subject: '사회', trend: 'up', changePercent: 15 },
    ],
    insights: {
      hashtags: ['집중력최상', '끈기있는태도', '논리력성장중', '자기조절잘해요'],
      parentActions: ['praise', 'encourage', 'listen'],
      seasonInsight: '이번 주는 어려운 문제를 만났을 때 포기하지 않고 끝까지 붙잡는 모습이 인상적이었어요. 집중력도 평소보다 높게 유지되었고, 결과가 기대에 못 미쳐도 크게 흔들리지 않는 안정된 태도를 보였습니다. 이런 마음의 힘이 실력 성장의 토대가 됩니다.',
    },
  },
  {
    weekId: '2026-w04',
    startDate: '2026-01-19',
    endDate: '2026-01-25',
    stats: {
      focus: 80,
      growthMind: 75,
      comprehension: 88,
      logic: 82,
      energy: 70,
    },
    trends: [
      { subject: '수학', trend: 'up', changePercent: 8 },
      { subject: '영어', trend: 'up', changePercent: 5 },
      { subject: '과학', trend: 'stable', changePercent: 0 },
      { subject: '국어', trend: 'stable', changePercent: 2 },
      { subject: '사회', trend: 'down', changePercent: -3 },
    ],
    insights: {
      hashtags: ['꾸준한흐름', '이해력탄탄', '호기심주도형'],
      parentActions: ['trust', 'encourage', 'snack'],
      seasonInsight: '전반적으로 안정적인 한 주였어요. 새로운 개념을 접했을 때 바로 묻고 확인하려는 습관이 생기고 있어서 좋습니다. 모르는 걸 모른다고 말할 수 있는 용기, 그 자체가 이미 성장이에요.',
    },
  },
  {
    weekId: '2026-w03',
    startDate: '2026-01-12',
    endDate: '2026-01-18',
    stats: {
      focus: 72,
      growthMind: 70,
      comprehension: 85,
      logic: 78,
      energy: 65,
    },
    trends: [
      { subject: '수학', trend: 'stable', changePercent: 2 },
      { subject: '영어', trend: 'down', changePercent: -4 },
      { subject: '과학', trend: 'up', changePercent: 10 },
      { subject: '국어', trend: 'up', changePercent: 7 },
      { subject: '사회', trend: 'stable', changePercent: 0 },
    ],
    insights: {
      hashtags: ['에너지회복중', '집중력기복있음', '창의적시도눈에띄어'],
      parentActions: ['rest', 'praise', 'encourage'],
      seasonInsight: '이번 주는 컨디션 기복이 좀 있었지만, 그 와중에도 자기만의 방식으로 문제를 풀어보려는 시도가 있었어요. 지금은 무리하게 밀어붙이기보다 충분히 쉬어가는 타이밍이에요. 회복 후에 집중력이 다시 돌아올 거예요.',
    },
  },
];

export const parentActions: ParentAction[] = [
  {
    id: 'praise',
    label: '칭찬하기',
    icon: 'star',
    description: '잘한 점을 구체적으로 짚어 칭찬해주세요. "열심히 했네"보다 "그 부분을 스스로 해냈구나"가 더 힘이 됩니다.',
  },
  {
    id: 'trust',
    label: '믿어주기',
    icon: 'heart',
    description: '아이가 스스로 방법을 찾을 수 있도록 기다려주세요. 먼저 답을 주기보다 믿고 지켜보는 것이 사고력을 키웁니다.',
  },
  {
    id: 'snack',
    label: '간식주기',
    icon: 'cookie',
    description: '집중이 끝난 뒤 가벼운 간식 타임을 만들어주세요. 작은 보상이 다음 도전의 동기가 됩니다.',
  },
  {
    id: 'rest',
    label: '쉬게하기',
    icon: 'moon',
    description: '충분한 수면과 멍때리는 시간을 확보해주세요. 뇌는 쉴 때 정보를 정리하고 아이디어를 만들어냅니다.',
  },
  {
    id: 'encourage',
    label: '격려하기',
    icon: 'thumbs-up',
    description: '잘 안 풀리는 날에도 "시도한 것 자체가 의미 있어"라고 말해주세요. 포기하지 않는 힘이 길러집니다.',
  },
  {
    id: 'play',
    label: '놀아주기',
    icon: 'gamepad-2',
    description: '목적 없는 자유로운 놀이를 충분히 허용해주세요. 놀이는 아이의 사고 유연성과 집중력을 회복시킵니다.',
  },
  {
    id: 'listen',
    label: '들어주기',
    icon: 'ear',
    description: '오늘 어땠는지 먼저 물어봐주세요. 평가 없이 끝까지 들어주는 것만으로도 아이는 생각을 정리하게 됩니다.',
  },
  {
    id: 'hug',
    label: '안아주기',
    icon: 'hand-heart',
    description: '말보다 먼저 안아주세요. 신체적 안정감이 채워져야 사고와 집중도 제대로 작동합니다.',
  },
];
