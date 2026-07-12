import type { ExposureMode } from "./exposure-mode";
export type { ExposureMode } from "./exposure-mode";

export interface SiteConfig {
  brandName: string;
  companyName: string;
  tagline: string;
  description: string;
  url: string;
  phone: string;
  email: string;
  address: string;
  businessNumber: string;
  /** 중개사무소 등록번호 등 */
  registrationNumber: string;
  /** 네이버 플레이스 URL */
  placeUrl: string;
  /** 카카오톡 상담 링크 (오픈채팅·채널 등) */
  kakaoUrl: string;
  representative: string;
  imageCdn: string;
  imageCount: number;
  supportBase: string;
  supportExtra: string;
  supportMax: string;
  geminiApiKey: string;
  naverClientId: string;
  naverClientSecret: string;
  dailySeoLimit: number;
  naverExposureId: string;
  naverExposurePassword: string;
  serviceAvailableDays: number;
  serviceExpiresAt: string;
  /** cpa: 견적폼만·업체정보 미노출 / company: 업체정보+견적문의 동시 */
  exposureMode: ExposureMode;
}

export const DEFAULT_SITE_CONFIG: SiteConfig = {
  brandName: "메종드꼬똥",
  companyName: "꼬똥드툴레아 메종드꼬똥",
  tagline: "Maison de Coton · Premium Coton de Tuléar",
  description:
    "꼬똥드툴레아 메종드꼬똥은 왕실의 반려견으로 사랑받아 온 꼬똥드툴레아의 역사·성격·크기·털관리까지 소개하며, 품격 있는 분양을 안내하는 프리미엄 전문관입니다.",
  url: "https://maisondecoton.vercel.app",
  phone: "0505-464-1004",
  email: "",
  address: "",
  businessNumber: "",
  registrationNumber: "",
  placeUrl: "",
  kakaoUrl: "",
  representative: "",
  imageCdn: "https://image.cattery.co.kr/coton",
  imageCount: 30,
  supportBase: "",
  supportExtra: "",
  supportMax: "",
  geminiApiKey: "",
  naverClientId: "",
  naverClientSecret: "",
  dailySeoLimit: 10,
  naverExposureId: "",
  naverExposurePassword: "",
  serviceAvailableDays: 30,
  serviceExpiresAt: "",
  exposureMode: "company",
};

export function phoneToTel(phone: string): string {
  return phone.replace(/\D/g, "");
}

export type PublicSiteConfig = Omit<SiteConfig, "geminiApiKey"> & {
  phoneTel: string;
};

export function toPublicConfig(config: SiteConfig): PublicSiteConfig {
  const { geminiApiKey: _, ...rest } = config;
  return { ...rest, phoneTel: phoneToTel(rest.phone) };
}
