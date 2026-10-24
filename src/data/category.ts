// 지출 항목(카테고리) 목업 데이터.
// TODO: 지금은 키워드 사전으로 분류하지만, 나중에 AI 분류로 대체할 예정이다.
//       화면에서는 suggestCategory()만 호출하므로, 아래 함수 안쪽만 AI 호출로 바꾸면 된다.

export type CategoryId =
  | 'food'
  | 'cafe'
  | 'transport'
  | 'shopping'
  | 'clothing'
  | 'living'
  | 'telecom'
  | 'health'
  | 'leisure'
  | 'etc';

export type Category = {
  id: CategoryId;
  label: string;
  emoji: string;
};

export const CATEGORIES: Category[] = [
  { id: 'food', label: '식비', emoji: '🍚' },
  { id: 'cafe', label: '카페', emoji: '☕' },
  { id: 'transport', label: '교통', emoji: '🚌' },
  { id: 'shopping', label: '쇼핑', emoji: '🛍️' },
  { id: 'clothing', label: '의류', emoji: '👕' },
  { id: 'living', label: '생활', emoji: '🏠' },
  { id: 'telecom', label: '통신', emoji: '📱' },
  { id: 'health', label: '의료', emoji: '💊' },
  { id: 'leisure', label: '문화/여가', emoji: '🎬' },
  { id: 'etc', label: '기타', emoji: '📦' },
];

// 이름에 이 키워드가 들어 있으면 해당 카테고리로 추천한다. (공백/대소문자 무시)
const KEYWORDS: Record<CategoryId, string[]> = {
  food: [
    '배달의민족', '배민', '요기요', '쿠팡이츠', '치킨', '피자', '햄버거', '맥도날드', '버거킹',
    '롯데리아', '김밥', '떡볶이', '국밥', '라면', '마라탕', '족발', '삼겹살', '곱창', '초밥',
    '식당', '점심', '저녁', '회식', '편의점', 'gs25', '세븐일레븐',
  ],
  cafe: ['스타벅스', '투썸', '이디야', '메가커피', '컴포즈', '빽다방', '카페', '커피', '아메리카노', '베이커리'],
  transport: ['택시', '카카오택시', '버스', '지하철', '교통카드', '티머니', '주유', '주차', '기차', 'ktx', '하이패스'],
  shopping: ['쿠팡', '올리브영', '11번가', '지마켓', '옥션', '네이버쇼핑', '당근'],
  clothing: ['아디다스', '나이키', '유니클로', '자라', '무신사', '뉴발란스', '탑텐', '신발', '옷'],
  living: ['이마트', '홈플러스', '마트', '다이소', '세탁', '미용실', '헤어', '월세', '관리비', '전기', '가스', '수도'],
  telecom: ['통신비', 'skt', '유플러스', '알뜰폰', '인터넷'],
  health: ['병원', '약국', '치과', '한의원', '안과', '의원'],
  leisure: ['넷플릭스', '유튜브프리미엄', '왓챠', '티빙', '영화', 'cgv', '메가박스', '롯데시네마', '노래방', '헬스', '여행', '숙박', '게임', '스팀', '교보문고'],
  etc: [],
};

const normalize = (s: string) => s.replace(/\s+/g, '').toLowerCase();

// 긴 키워드부터 비교해서 "카카오택시"가 "택시"보다 먼저 잡히게 한다.
const FLAT = (Object.entries(KEYWORDS) as [CategoryId, string[]][])
  .flatMap(([id, words]) => words.map((w) => ({ id, word: normalize(w) })))
  .sort((a, b) => b.word.length - a.word.length);

/**
 * 지출 이름으로 카테고리를 추천한다. 맞는 게 없으면 null.
 * 비동기로 만들어 둔 이유: 나중에 AI API 호출로 바꿔도 화면 코드는 그대로 두기 위해서.
 */
export async function suggestCategory(name: string): Promise<CategoryId | null> {
  const text = normalize(name);
  if (!text) return null;
  return FLAT.find((k) => text.includes(k.word))?.id ?? null;
}