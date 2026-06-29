/* 원격 이미지 URL 사용 — 로컬 public/images 불필요 */

export type ShelterImage = {
  src: string;
  alt: string;
};

export function getShelterImages(): ShelterImage[] {
  return [];
}
