import HeroMaison from "@/components/home-maison/HeroMaison";
import BreedMaison from "@/components/home-maison/BreedMaison";
import HistoryMaison from "@/components/home-maison/HistoryMaison";
import TraitsMaison from "@/components/home-maison/TraitsMaison";
import CareMaison from "@/components/home-maison/CareMaison";
import AboutMaison from "@/components/home-maison/AboutMaison";
import GalleryMaison from "@/components/home-maison/GalleryMaison";
import ReviewsMaison from "@/components/home-maison/ReviewsMaison";

/** M 디자인 — 폼스키 메종드폼스키 럭셔리 소개 홈 */
export default function HomePageMaison() {
  return (
    <>
      <HeroMaison />
      <BreedMaison />
      <HistoryMaison />
      <TraitsMaison />
      <CareMaison />
      <AboutMaison />
      <GalleryMaison />
      <ReviewsMaison />
    </>
  );
}
