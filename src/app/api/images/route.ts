import { NextRequest, NextResponse } from "next/server";
import { UnsplashImage } from "@/lib/types";

const UNSPLASH_BASE = "https://api.unsplash.com";

export async function POST(request: NextRequest) {
  try {
    const { searchTerms } = await request.json();

    if (!searchTerms || !Array.isArray(searchTerms) || searchTerms.length === 0) {
      return NextResponse.json(
        { error: "Search terms are required." },
        { status: 400 }
      );
    }

    const accessKey = process.env.UNSPLASH_ACCESS_KEY;
    if (!accessKey) {
      return NextResponse.json(
        { error: "Unsplash API key is not configured." },
        { status: 500 }
      );
    }

    const imagePromises = searchTerms.slice(0, 6).map(async (term: string) => {
      const params = new URLSearchParams({
        query: term,
        per_page: "2",
        orientation: "landscape",
      });

      const response = await fetch(
        `${UNSPLASH_BASE}/search/photos?${params.toString()}`,
        {
          headers: {
            Authorization: `Client-ID ${accessKey}`,
          },
        }
      );

      if (!response.ok) {
        console.error(`Unsplash search failed for "${term}":`, response.status);
        return [];
      }

      const data = await response.json();

      return data.results.slice(0, 2).map(
        (photo: {
          id: string;
          urls: { regular: string; small: string };
          alt_description: string | null;
          description: string | null;
          user: { name: string; links: { html: string } };
          width: number;
          height: number;
        }): UnsplashImage => ({
          id: photo.id,
          url: photo.urls.regular,
          thumbnailUrl: photo.urls.small,
          alt: photo.alt_description || photo.description || term,
          photographer: photo.user.name,
          photographerUrl: photo.user.links.html,
          width: photo.width,
          height: photo.height,
        })
      );
    });

    const results = await Promise.all(imagePromises);
    const images = results.flat();

    return NextResponse.json({ images });
  } catch (error) {
    console.error("Images API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch images." },
      { status: 500 }
    );
  }
}
