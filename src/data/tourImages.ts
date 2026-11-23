import type { ThemeId, Tour } from '../types/travel'

type TourTheme = Exclude<ThemeId, 'all'>
type TourImage = Pick<Tour, 'image' | 'imageAlt'>
type KeywordImage = { keywords: string[] } & TourImage

const commons = (fileName: string) =>
  `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(fileName)}?width=1200`

const imagesByThemeKeyword: Record<TourTheme, KeywordImage[]> = {
  golf: [
    { keywords: ['남해'], image: commons('Pacific_Ocean_View_Golf_Course_(8467657288).jpg'), imageAlt: '바다를 내려다보는 해안 골프 코스' },
    { keywords: ['여수'], image: commons('The_Coast_Golf_Course_Little_Bay.JPG'), imageAlt: '바닷가를 따라 이어진 골프 코스' },
    { keywords: ['평창', '대관령'], image: commons('Bethpage_Golf_Course.jpg'), imageAlt: '숲으로 둘러싸인 골프 코스 그린' },
    { keywords: ['기장', '부산'], image: commons('Kiawah_Island_South_Carolina_-_The_Ocean_Course.jpg'), imageAlt: '해안선을 따라 펼쳐진 골프 코스 전경' },
  ],
  outdoor: [
    { keywords: ['올레', '제주'], image: commons('Jeju_olle_road.JPG'), imageAlt: '바다를 따라 이어진 제주 올레길' },
    { keywords: ['설악'], image: commons('Seoraksan_National_Park,_Daecheongbong_3.jpg'), imageAlt: '설악산 대청봉 산행길' },
    { keywords: ['백두대간', '지리산'], image: commons('Hiking_Trail_on_Jirisan.jpg'), imageAlt: '지리산 등산로' },
  ],
  healing: [
    { keywords: ['담양'], image: commons('Damyang_Metasequoia_Road_6.JPG'), imageAlt: '담양 메타세쿼이아 가로수길' },
    { keywords: ['속초'], image: commons('Sea_Cruise_Hotel,_Sokcho.jpg'), imageAlt: '바닷가에 자리한 속초 리조트' },
    { keywords: ['한옥', '전주'], image: commons('Jeonju_Hanok_Maeul_02.jpg'), imageAlt: '전주 한옥마을의 기와지붕' },
  ],
  romance: [
    { keywords: ['제주'], image: commons('Hyeopjae_Beach_Scenery.jpg'), imageAlt: '에메랄드빛 제주 협재해수욕장' },
    { keywords: ['거제', '외도'], image: commons('Geoje_Oedo.JPG'), imageAlt: '거제 외도 해상 정원' },
    { keywords: ['울릉'], image: commons('Ulleungdo_Coastal_Path_-_panoramio.jpg'), imageAlt: '울릉도 해안 산책로' },
  ],
}

const imagesByTheme: Record<TourTheme, TourImage> = {
  romance: { image: commons('Hyeopjae_Beach_Scenery.jpg'), imageAlt: '에메랄드빛 제주 협재해수욕장' },
  healing: { image: commons('Damyang_Metasequoia_Road_6.JPG'), imageAlt: '담양 메타세쿼이아 가로수길' },
  golf: {
    image: 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?auto=format&fit=crop&w=900&q=85',
    imageAlt: '나무로 둘러싸인 넓고 푸른 골프 코스',
  },
  outdoor: { image: commons('Hiking_Trail_on_Jirisan.jpg'), imageAlt: '지리산 등산로' },
}

export function getTourImage(tourName: string, theme: TourTheme): TourImage {
  const matched = imagesByThemeKeyword[theme].find(entry => entry.keywords.some(keyword => tourName.includes(keyword)))
  return matched ? { image: matched.image, imageAlt: matched.imageAlt } : imagesByTheme[theme]
}
