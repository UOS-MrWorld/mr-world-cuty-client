import type { LandingMood } from '../types/landing'

// Scene names describe the artwork. Product filters retain their own domain values.
export const landingMoods: LandingMood[] = [
  {
    id: 'honeymoon', label: '허니문', title: '둘이 떠나는\n작은 낙원',
    description: '바다가 보이는 리조트 둘만의 저녁.\n오래 기억할 여행을 함께 골라보세요', theme: 'romance',
    scene: '코랄빛 지붕의 해변 리조트와 야자수, 꽃으로 장식한 아치, 두 사람의 저녁 식탁, 전용 차량이 있는 섬 위로 비행기가 천천히 선회합니다',
    details: ['해변 리조트와 둘만의 식탁', '꽃 아치·커플 라운저', '2인 전용 차량·비행기'],
  },
  {
    id: 'family', label: '가족·효도', title: '함께라서\n더 좋은 여행',
    description: '정원을 걷고 따뜻한 차 한 잔.\n부모님과 편안히 쉬어 갈 곳을 찾아보세요', theme: 'healing',
    scene: '호수와 산책 데크, 휴식용 정자, 온천과 차를 마시는 부모님, 작은 10인승 차량이 있는 정원 위로 열기구가 떠 있습니다.',
    details: ['온천·안마 휴식 공간', '산책 데크·정자·부모님의 티타임', '10인승 차량·열기구'],
  },
  {
    id: 'golf', label: '골프', title: '그린 위에서\n조금 더 여유롭게.',
    description: '잘 가꾼 코스와 라운딩 뒤의 휴식\n골프가 있는 여행을 준비해 보세요', theme: 'golf',
    scene: '물결처럼 이어지는 페어웨이와 모래 벙커, 핀이 꽂힌 퍼팅 그린, 골퍼와 골프 카트, 골프공과 클럽, 리조트가 있는 골프 섬입니다.',
    details: ['페어웨이·벙커·퍼팅 그린', '골퍼·골프 카트·골프공', '골프 리조트·10인승 차량'],
  },
  {
    id: 'trekking', label: '트레킹', title: '산길을 따라\n새로운 풍경으로.',
    description: '숲을 지나 능선까지 나의 속도로.\n자연을 가까이 만나는 여행을 떠나보세요', theme: 'outdoor',
    scene: '눈이 남은 산 능선과 침엽수 숲, 굽이치는 등산로와 출렁다리, 스카프를 두른 등산객, 이정표가 있는 산 위로 패러글라이더가 흐릅니다.',
    details: ['겹겹의 산 능선·침엽수 숲', '등산객·스카프·출렁다리', '산책 이정표·패러글라이더'],
  },
]
