import type { ThemeId, Tour } from '../types/travel'

export const themes: {
  id: ThemeId
  label: string
  english: string
  description: string
  icon: 'sparkles' | 'heart' | 'leaf' | 'flag' | 'mountain'
}[] = [
  {
    id: 'all',
    label: '모든 여행',
    english: 'All journeys',
    description: '새로운 취향을 발견하는 순간',
    icon: 'sparkles',
  },
  {
    id: 'romance',
    label: '둘만의 로맨스',
    english: 'Honeymoon Romance',
    description: '우리의 가장 빛나는 시작',
    icon: 'heart',
  },
  {
    id: 'healing',
    label: '부모님과 쉼',
    english: 'Parents Healing',
    description: '고마운 마음을 담은 느린 여행',
    icon: 'leaf',
  },
  {
    id: 'golf',
    label: '그린 위의 여유',
    english: 'Golf Challenge',
    description: '좋아하는 일로 채우는 하루',
    icon: 'flag',
  },
  {
    id: 'outdoor',
    label: '자연 속 모험',
    english: 'Outdoor Trekking',
    description: '일상 밖으로 내딛는 한 걸음',
    icon: 'mountain',
  },
]

export const heroImage =
  'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=2400&q=85'

export const tours: Tour[] = [
  {
    id: 'bali',
    theme: 'romance',
    title: '둘만의 속도로, 발리',
    location: '인도네시아 · 발리',
    description: '초록빛 우붓부터 고요한 해변까지, 우리에게 집중하는 시간.',
    duration: '5박 7일',
    price: 1890000,
    image:
      'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=900&q=85',
    imageAlt: '발리의 초록빛 풍경과 전통 건축',
    tag: 'HONEYMOON',
  },
  {
    id: 'kyoto',
    theme: 'healing',
    title: '마음을 쉬어가는, 교토',
    location: '일본 · 교토',
    description: '작은 정원과 따뜻한 차 한 잔. 부모님과 천천히 걷는 여행.',
    duration: '3박 4일',
    price: 1290000,
    image:
      'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=900&q=85',
    imageAlt: '교토의 전통 거리와 일본식 건축',
    tag: 'SLOW & HEALING',
  },
  {
    id: 'swiss',
    theme: 'outdoor',
    title: '초록의 끝에서, 스위스',
    location: '스위스 · 인터라켄',
    description: '알프스의 산길과 에메랄드빛 호수 사이, 자연을 가까이.',
    duration: '6박 8일',
    price: 3490000,
    image:
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=900&q=85',
    imageAlt: '구름 위로 솟은 알프스의 산봉우리',
    tag: 'INTO THE WILD',
  },
  {
    id: 'golf',
    theme: 'golf',
    title: '라운드 너머의 풍경, 제주',
    location: '대한민국 · 제주',
    description: '탁 트인 그린과 제주의 바람. 라운드가 끝나도 이어지는 여유.',
    duration: '2박 3일',
    price: 890000,
    image:
      'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?auto=format&fit=crop&w=900&q=85',
    imageAlt: '나무로 둘러싸인 넓고 푸른 골프 코스',
    tag: 'ON THE GREEN',
  },
]

export const formatPrice = (price: number) =>
  new Intl.NumberFormat('ko-KR').format(price)
