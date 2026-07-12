import type { Metadata } from "next";
import { pickSeoSuffixKeywords, buildTitleWithSeoSuffix } from "@/lib/seo-title-keywords";
import HomeSections, { HomeLeadBlocks } from "@/components/HomeSections";
import HomePageB from "@/components/home-b/HomePageB";
import HomePageC from "@/components/home-c/HomePageC";
import HomePageD from "@/components/home-d/HomePageD";
import HomePageRe from "@/components/home-re/HomePageRe";
import HomePageMaison from "@/components/home-maison/HomePageMaison";
import { parseSiteDesignId } from "@/lib/site-designs";
import { getSiteConfig } from "@/lib/site-config";
import { buildPageMetadata } from "@/lib/metadata";
import { getResolvedSiteConfig } from "@/utils/siteConfig";

export async function generateMetadata(): Promise<Metadata> {
  const config = await getSiteConfig();
  const pageTitle = `${config.companyName || config.brandName} | Maison de Coton`;
  const browserTitle = buildTitleWithSeoSuffix(pageTitle, config.brandName);
  const suffixKeywords = pickSeoSuffixKeywords(config.brandName, 3);

  return {
    ...buildPageMetadata(config, {
      title: pageTitle,
      description: config.description,
      path: "/",
      ogPath: "/opengraph-image",
      keywords: [
        config.brandName,
        "꼬똥드툴레아",
        "메종드꼬똥",
        "꼬똥드툴레아 분양",
        "Coton de Tulear",
        "Maison de Coton",
        ...suffixKeywords,
      ],
    }),
    title: { absolute: browserTitle },
  };
}

export default async function HomePage() {
  const { tenantUi } = await getResolvedSiteConfig();
  const siteDesign = parseSiteDesignId(tenantUi?.siteDesign);

  if (siteDesign === "m") {
    return <HomePageMaison />;
  }
  if (siteDesign === "e") {
    return <HomePageRe />;
  }
  if (siteDesign === "d") {
    return <HomePageD />;
  }
  if (siteDesign === "c") {
    return <HomePageC />;
  }
  if (siteDesign === "b") {
    return <HomePageB />;
  }

  return (
    <>
      <HomeLeadBlocks />
      <HomeSections />
    </>
  );
}
