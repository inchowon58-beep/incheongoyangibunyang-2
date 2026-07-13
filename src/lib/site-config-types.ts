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
  brandName: "메종드폼스키",
  companyName: "폼스키 메종드폼스키",
  tagline: "Maison de Pomsky · Premium Pomsky",
  description:
    "메종드폼스키는 포메라니안과 시베리안 허스키의 교배로 태어난 하이브리드견 폼스키의 기원·성격·크기·케어까지 소개하며, 품격 있는 분양을 안내하는 프리미엄 전문관입니다.",
  url: "https://incheongoyangibunyang-2.vercel.app",
  phone: "0505-464-1004",
  email: "",
  address: "",
  businessNumber: "",
  registrationNumber: "",
  placeUrl: "",
  kakaoUrl: "",
  representative: "",
  imageCdn: "https://image.cattery.co.kr/pomsky",
  imageCount: 50,
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
