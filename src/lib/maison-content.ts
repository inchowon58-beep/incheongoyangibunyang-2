/** 메종드꼬똥 · 꼬똥드툴레아 소개·후기 콘텐츠 */

export const MAISON_NAV = [
  { href: "/#breed", label: "Breed" },
  { href: "/#history", label: "History" },
  { href: "/#traits", label: "Traits" },
  { href: "/#care", label: "Care" },
  { href: "/#maison", label: "Maison" },
  { href: "/#gallery", label: "Gallery" },
  { href: "/#reviews", label: "Reviews" },
  { href: "/#contact", label: "Contact" },
] as const;

export const BREED_TRAITS = [
  {
    en: "Royal Heritage",
    ko: "왕실의 유산",
    text: "마다가스카르 귀족과 유럽 왕실이 사랑한 품종으로, 섬세한 외모와 온화한 기품이 세대를 이어 왔습니다.",
  },
  {
    en: "Cotton Coat",
    ko: "코튼 코트의 감촉",
    text: "이름처럼 솜처럼 부드러운 단모·장모 코트가 특징입니다. 알레르기 민감 가정에서도 비교적 부담이 적은 편입니다.",
  },
  {
    en: "Companion Spirit",
    ko: "사람과 함께하는 성격",
    text: "사람을 따르고 가족 중심적인 성향이 강해, 실내 반려와 정서적 유대에 특히 잘 맞는 품종입니다.",
  },
  {
    en: "Compact Elegance",
    ko: "작은 몸, 큰 존재감",
    text: "소형견이지만 당당한 자태와 표현력 있는 눈매로, 공간의 분위기까지 부드럽게 바꾸어 줍니다.",
  },
] as const;

export const SIZE_FACTS = [
  { label: "체고 Height", value: "약 22–30cm", note: "성견 기준" },
  { label: "체중 Weight", value: "약 3.5–6kg", note: "개체별 차이" },
  { label: "수명 Lifespan", value: "14–16년+", note: "건강한 관리 시" },
  { label: "에너지 Energy", value: "중간 Moderate", note: "실내 활동 적합" },
] as const;

export const CARE_POINTS = [
  {
    en: "Coat & Shedding",
    ko: "털빠짐과 미용",
    text: "일반적인 단모견보다 털이 덜 떨어지는 편입니다. 대신 엉김 방지를 위해 정기적인 빗질과 전문 미용 케어가 품격을 유지합니다.",
  },
  {
    en: "Gentle Exercise",
    ko: "부드러운 운동",
    text: "짧은 산책과 실내 놀이로도 충분히 만족합니다. 격한 운동보다 함께하는 시간이 더 중요합니다.",
  },
  {
    en: "Social Nature",
    ko: "사회성과 훈련",
    text: "영리하고 협조적이라 기초 예절 훈련에 잘 반응합니다. 이른 사회화가 안정된 성격을 만듭니다.",
  },
  {
    en: "Quiet Home",
    ko: "조용한 가정에 적합",
    text: "과도한 짖음이 적은 편이며, 아파트·타운하우스 등 도심 주거 환경과도 잘 어울립니다.",
  },
] as const;

export const MAISON_PROMISES = [
  {
    num: "01",
    en: "Curated Bloodline",
    ko: "선별된 개체",
    text: "건강과 기질을 우선으로 엄선한 꼬똥드툴레아만을 소개합니다.",
  },
  {
    num: "02",
    en: "Transparent Guidance",
    ko: "투명한 상담",
    text: "품종의 장단점부터 케어 방법까지, 분양 전 충분한 안내를 드립니다.",
  },
  {
    num: "03",
    en: "Aftercare Bond",
    ko: "분양 이후의 동행",
    text: "입양 후에도 적응·미용·건강 관리에 대한 조언을 이어 갑니다.",
  },
] as const;

export const MAISON_REVIEWS = [
  {
    name: "김서연",
    location: "서울 · Gangnam",
    text: "처음 본 순간부터 솜사탕 같았어요. 메종드꼬똥에서 성격과 케어까지 차근히 설명해 주셔서 안심하고 모셨습니다. 우리 집 분위기가 한층 포근해졌어요.",
    imageIndex: 3,
    rating: 5,
  },
  {
    name: "이준호",
    location: "부산 · Haeundae",
    text: "고가의 품종이라 고민이 많았는데, 상담이 정말 섬세했습니다. 털빠짐이 적어 알레르기 걱정이 줄었고, 아이와 잘 놀아 줍니다.",
    imageIndex: 7,
    rating: 5,
  },
  {
    name: "박민지",
    location: "경기 · Bundang",
    text: "왕실견이라는 말이 과장이 아니더라고요. 작고 우아한데 애교가 넘칩니다. 미용 주기도 미리 알려주셔서 관리가 수월해요.",
    imageIndex: 11,
    rating: 5,
  },
  {
    name: "최현우",
    location: "대구 · Suseong",
    text: "실내견으로 완벽합니다. 짖음이 적고 사람을 잘 따라요. 메종드꼬똥 추천으로 만난 인연이라 더 특별합니다.",
    imageIndex: 14,
    rating: 5,
  },
  {
    name: "정유진",
    location: "인천 · Songdo",
    text: "화이트 코트가 사진보다 더 아름답습니다. 분양 후에도 카톡으로 궁금한 점을 여쭤볼 수 있어 든든했어요.",
    imageIndex: 18,
    rating: 5,
  },
  {
    name: "한도윤",
    location: "대전 · Yuseong",
    text: "크기는 작지만 존재감이 커요. 손님들이 올 때마다 감탄합니다. 품종 지식을 자세히 알려주신 점이 신뢰가 갔어요.",
    imageIndex: 21,
    rating: 5,
  },
  {
    name: "오수빈",
    location: "광주 · Bonchon",
    text: "혼자 있는 시간에도 비교적 안정적이에요. 산책보다 스킨십을 더 좋아하는 성격이 저희 라이프스타일과 딱 맞았습니다.",
    imageIndex: 24,
    rating: 5,
  },
  {
    name: "윤재혁",
    location: "제주 · Jeju",
    text: "고급스러운 외모와 부드러운 성격, 둘 다 만족합니다. 메종드꼬똥의 안내 덕분에 첫 반려견인데도 부담이 적었어요.",
    imageIndex: 27,
    rating: 5,
  },
  {
    name: "신예린",
    location: "서울 · Seongsu",
    text: "꼬똥드툴레아의 역사부터 털 관리까지 사이트에 정리된 내용이 실제로 도움이 됐습니다. 지금 저희 집의 가장 소중한 가족입니다.",
    imageIndex: 30,
    rating: 5,
  },
] as const;

export const GALLERY_INDICES = [1, 5, 9, 12, 16, 20, 23, 26, 28, 4, 8, 15] as const;
