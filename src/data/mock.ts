// 홈 화면 디자인 확인용 임시 데이터. DB(SQLite) 연결 시 교체.
export type CategoryKey = 'food' | 'transport' | 'clothes' | 'culture' | 'shopping';

export type CategoryStat = {
  key: CategoryKey;
  name: string;
  budget: number; // 월 예산(원)
  spent: number; // 이번 달 지출(원)
};

export const categories: CategoryStat[] = [
  { key: 'food', name: '식비', budget: 450000, spent: 312400 },
  { key: 'transport', name: '교통', budget: 120000, spent: 68500 },
  { key: 'clothes', name: '의류', budget: 150000, spent: 129000 },
  { key: 'culture', name: '문화생활', budget: 100000, spent: 41000 },
  { key: 'shopping', name: '쇼핑', budget: 200000, spent: 87300 },
];

export const unpaidFixedCost = 63700; // 아직 나가지 않은 고정비
export const fixedCostTotal = 98200; // 월 고정비 합계
export const unclassifiedCount = 3;
