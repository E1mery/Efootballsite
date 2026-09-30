import { prisma } from "@/lib/prisma";
import { ensureNewsTable } from "@/lib/ensureNewsTable";
import type { CarouselSlide } from "@/components/NewsTrendingCarousel";

/**
 * Retrieves only real, eligible news articles from the database for the homepage carousel.
 * Zero demo/sample/placeholder slides are returned.
 *
 * Eligibility requirements:
 * 1. Status = PUBLISHED
 * 2. Show on Carousel = ON (true)
 * 3. Publish Date <= Current Date/Time
 * 4. Expiration Date > Current Date/Time
 */
export async function getCarouselSlides(): Promise<CarouselSlide[]> {
  try {
    await ensureNewsTable();
    const now = new Date();

    const eligibleNews = await prisma.news.findMany({
      where: {
        status: "PUBLISHED",
        showOnCarousel: true,
        publishDate: { lte: now },
        expirationDate: { gt: now },
      },
      orderBy: { publishDate: "desc" },
    });

    if (!eligibleNews || eligibleNews.length === 0) {
      return [];
    }

    return eligibleNews.map((item) => ({
      id: item.id,
      type: "NEWS",
      badge: item.category.toUpperCase(),
      category: item.category,
      tabLabel: item.title,
      title: item.title,
      subtitle: item.description,
      description: item.description,
      featuredImage: item.featuredImage,
      buttonText: item.buttonText,
      buttonUrl: item.buttonUrl,
      publishDate: item.publishDate,
      expirationDate: item.expirationDate,
      data: item,
    }));
  } catch (error) {
    console.error("[getCarouselSlides] Error assembling carousel data:", error);
    return [];
  }
}
