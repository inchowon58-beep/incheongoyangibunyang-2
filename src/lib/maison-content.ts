/** 메종드폼스키 · 폼스키 소개·후기 콘텐츠 */

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
    en: "Hybrid Heritage",
    ko: "하이브리드의 매력",
    text: "포메라니안과 시베리안 허스키의 교배로 태어난 폼스키는, 작은 체구에 허스키의 눈매와 마스크를 담은 독특한 외모로 사랑받습니다.",
  },
  {
    en: "Wolfish Charm",
    ko: "늑대 같은 눈매",
    text: "허스키 특유의 마스크·눈매와 포메라니안의 풍성한 코트가 어우러져, 작지만 존재감 있는 분위기를 자아냅니다.",
  },
  {
    en: "Companion Spirit",
    ko: "사람과 함께하는 성격",
    text: "사람을 따르고 가족 중심적인 성향이 강해, 실내 반려와 정서적 유대에 잘 맞는 하이브리드견입니다.",
  },
  {
    en: "Compact Presence",
    ko: "작은 몸, 큰 존재감",
    text: "소형~중형에 가까운 체구지만 당당한 자태와 표현력 있는 눈매로, 공간의 분위기까지 특별하게 바꾸어 줍니다.",
  },
] as const;

export const SIZE_FACTS = [
  { label: "체고 Height", value: "약 25–38cm", note: "세대·개체별 차이" },
  { label: "체중 Weight", value: "약 3–12kg", note: "F1~F3 등 차이" },
  { label: "수명 Lifespan", value: "12–15년+", note: "건강한 관리 시" },
  { label: "에너지 Energy", value: "중상 Active", note: "산책·놀이 필요" },
] as const;

export const CARE_POINTS = [
  {
    en: "Coat & Shedding",
    ko: "털빠짐과 미용",
    text: "이중모 성향이 있어 계절에 따라 털빠짐이 있을 수 있습니다. 정기적인 빗질과 적절한 미용으로 코트 컨디션을 유지합니다.",
  },
  {
    en: "Daily Exercise",
    ko: "활동량과 산책",
    text: "허스키의 활동성을 일부 물려받아 산책과 실내 놀이가 중요합니다. 짧은 산책만으로는 부족할 수 있으니 함께하는 시간을 충분히 가져 주세요.",
  },
  {
    en: "Social Nature",
    ko: "사회성과 훈련",
    text: "영리하고 호기심이 많아 기초 예절 훈련에 잘 반응합니다. 이른 사회화가 안정된 성격을 만듭니다.",
  },
  {
    en: "Home Fit",
    ko: "가정 환경 적합성",
    text: "애착이 강하고 표현력이 풍부합니다. 혼자 있는 시간이 길면 분리불안 대비가 필요하며, 가족과의 유대가 핵심입니다.",
  },
] as const;

export const MAISON_PROMISES = [
  {
    num: "01",
    en: "Curated Bloodline",
    ko: "선별된 개체",
    text: "건강과 기질을 우선으로 엄선한 폼스키만을 소개합니다.",
  },
  {
    num: "02",
    en: "Transparent Guidance",
    ko: "투명한 상담",
    text: "하이브리드 특성의 장단점부터 케어 방법까지, 분양 전 충분한 안내를 드립니다.",
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
    text: "처음 본 순간부터 미니 허스키 같았어요. 메종드폼스키에서 성격과 케어까지 차근히 설명해 주셔서 안심하고 모셨습니다. 우리 집 분위기가 한층 특별해졌어요.",
    imageIndex: 3,
    rating: 5,
  },
  {
    name: "이준호",
    location: "부산 · Haeundae",
    text: "하이브리드견이라 고민이 많았는데, 상담이 정말 섬세했습니다. 포메라니안의 애교와 허스키의 눈매가 함께 있어 매일 감탄합니다.",
    imageIndex: 7,
    rating: 5,
  },
  {
    name: "박민지",
    location: "경기 · Bundang",
    text: "사진보다 실물이 더 인상적이에요. 작고 귀여운데 존재감이 큽니다. 산책·빗질 주기도 미리 알려주셔서 관리가 수월해요.",
    imageIndex: 11,
    rating: 5,
  },
  {
    name: "최현우",
    location: "대구 · Suseong",
    text: "활동량이 있어 함께 걷는 재미가 있어요. 사람을 잘 따르고, 메종드폼스키 추천으로 만난 인연이라 더 특별합니다.",
    imageIndex: 14,
    rating: 5,
  },
  {
    name: "정유진",
    location: "인천 · Songdo",
    text: "마스크와 눈매가 정말 매력적입니다. 분양 후에도 카톡으로 궁금한 점을 여쭤볼 수 있어 든든했어요.",
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
    text: "놀이와 스킨십을 모두 좋아하는 성격이 저희 라이프스타일과 딱 맞았습니다. 첫 하이브리드견인데도 적응이 빨랐어요.",
    imageIndex: 24,
    rating: 5,
  },
  {
    name: "윤재혁",
    location: "제주 · Jeju",
    text: "고급스러운 외모와 활기찬 성격, 둘 다 만족합니다. 메종드폼스키의 안내 덕분에 첫 반려견인데도 부담이 적었어요.",
    imageIndex: 27,
    rating: 5,
  },
  {
    name: "신예린",
    location: "서울 · Seongsu",
    text: "폼스키의 기원부터 털 관리까지 사이트에 정리된 내용이 실제로 도움이 됐습니다. 지금 저희 집의 가장 소중한 가족입니다.",
    imageIndex: 30,
    rating: 5,
  },
] as const;

export const GALLERY_INDICES = [1, 5, 9, 12, 16, 20, 23, 26, 28, 4, 8, 15] as const;
