import type { ThemeId, Tour } from '../types/travel'

type TourImage = Pick<Tour, 'image' | 'imageAlt'>
type KeywordImage = { keywords: string[] } & TourImage

const commons = (fileName: string) =>
  `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(fileName)}?width=1200`

const golfImagesByKeyword: KeywordImage[] = [
  { keywords: ['남해'], image: commons('Pacific_Ocean_View_Golf_Course_(8467657288).jpg'), imageAlt: '바다를 내려다보는 해안 골프 코스' },
  { keywords: ['여수'], image: commons('The_Coast_Golf_Course_Little_Bay.JPG'), imageAlt: '바닷가를 따라 이어진 골프 코스' },
  { keywords: ['평창', '대관령'], image: commons('Bethpage_Golf_Course.jpg'), imageAlt: '숲으로 둘러싸인 골프 코스 그린' },
  { keywords: ['기장', '부산'], image: commons('Kiawah_Island_South_Carolina_-_The_Ocean_Course.jpg'), imageAlt: '해안선을 따라 펼쳐진 골프 코스 전경' },
]

const imagesByKeyword: KeywordImage[] = [
  { keywords: ['올레'], image: commons('Jeju_Ollegil_4.JPG'), imageAlt: '제주 올레길 7코스 외돌개 해안' },
  { keywords: ['한옥', '전주'], image: commons('Jeonju_Hanok_Village_20220701_012.jpg'), imageAlt: '전주 한옥마을의 기와지붕 골목' },
  { keywords: ['담양'], image: commons('Juknokwon.jpg'), imageAlt: '담양 죽녹원 대나무숲' },
  { keywords: ['설악'], image: commons('Seoraksan_National_Park_panorama_3.jpg'), imageAlt: '설악산 울산바위' },
  { keywords: ['백두대간', '지리산'], image: commons('Korea-Mountain-Jirisan-17.jpg'), imageAlt: '지리산 능선 풍경' },
  { keywords: ['울릉'], image: commons('NE_coast_of_Ulleung_seen_from_Jukdo.jpg'), imageAlt: '죽도에서 바라본 울릉도 해안' },
  { keywords: ['거제'], image: commons('Hill_of_Wind_in_Geoje-si,_S.Korea_overlooking_South_Sea..jpg'), imageAlt: '남해 바다를 내려다보는 거제 바람의 언덕' },
  { keywords: ['속초'], image: commons('Sokcho_Beach_20221209_001.jpg'), imageAlt: '속초해수욕장 바다' },
  { keywords: ['기장', '부산'], image: commons('Haedong_Yonggungsa_Temple_near_Busan.jpg'), imageAlt: '바닷가 바위 위의 부산 기장 해동용궁사' },
  { keywords: ['제주'], image: commons('Seongsan_Ilchulbong,_Jeju_Island.jpg'), imageAlt: '제주 성산일출봉' },
]

const imagesByTheme: Record<Exclude<ThemeId, 'all'>, TourImage> = {
  romance: { image: commons('Seongsan_Ilchulbong,_Jeju_Island.jpg'), imageAlt: '제주 성산일출봉' },
  healing: { image: commons('Juknokwon.jpg'), imageAlt: '담양 죽녹원 대나무숲' },
  golf: {
    image: 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?auto=format&fit=crop&w=900&q=85',
    imageAlt: '나무로 둘러싸인 넓고 푸른 골프 코스',
  },
  outdoor: { image: commons('Seoraksan_National_Park_panorama_3.jpg'), imageAlt: '설악산 울산바위' },
}

export function getTourImage(tourName: string, theme: Exclude<ThemeId, 'all'>): TourImage {
  const candidates = theme === 'golf' ? golfImagesByKeyword : imagesByKeyword
  const matched = candidates.find(entry => entry.keywords.some(keyword => tourName.includes(keyword)))
  return matched ? { image: matched.image, imageAlt: matched.imageAlt } : imagesByTheme[theme]
}
