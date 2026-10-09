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
    label: '전체 여행',
    english: 'All journeys',
    description: '전체 테마 상품',
    icon: 'sparkles',
  },
  {
    id: 'romance',
    label: '허니문',
    english: 'Honeymoon Romance',
    description: '2인 전용 여행',
    icon: 'heart',
  },
  {
    id: 'healing',
    label: '효도여행',
    english: 'Parents Healing',
    description: '부모님 동반 여행',
    icon: 'leaf',
  },
  {
    id: 'golf',
    label: '골프여행',
    english: 'Golf Challenge',
    description: '골프 리조트 여행',
    icon: 'flag',
  },
  {
    id: 'outdoor',
    label: '트레킹',
    english: 'Outdoor Trekking',
    description: '트레킹·산악 여행',
    icon: 'mountain',
  },
]

export const heroImage =
  'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=2400&q=85'

export const tours: Tour[] = [
  {
    id: 'bali',
    theme: 'romance',
    title: '발리 허니문 5박 7일',
    location: '인도네시아 · 발리',
    description: '2인 전용 차량과 로맨틱 룸 장식이 포함된 허니문 상품입니다.',
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
    title: '교토 효도여행 3박 4일',
    location: '일본 · 교토',
    description: '안마·지압 서비스와 인삼 기념품이 포함된 부모님 동반 여행입니다.',
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
    title: '스위스 인터라켄 트레킹 6박 8일',
    location: '스위스 · 인터라켄',
    description: '트레킹·산악 테마로 구성한 인터라켄 여행 상품입니다.',
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
    title: '제주 골프 리조트 2박 3일',
    location: '대한민국 · 제주',
    description: '골프 리조트 테마와 골프 액세서리·골프공이 포함된 여행입니다.',
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
