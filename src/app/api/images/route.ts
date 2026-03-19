import { NextRequest, NextResponse } from "next/server";
import { UnsplashImage } from "@/lib/types";

const UNSPLASH_BASE = "https://api.unsplash.com";
const PEXELS_BASE = "https://api.pexels.com/v1";

async function fetchUnsplash(
  term: string,
  accessKey: string
): Promise<UnsplashImage[]> {
  try {
    const params = new URLSearchParams({
      query: term,
      per_page: "3",
      orientation: "landscape",
    });
    const res = await fetch(`${UNSPLASH_BASE}/search/photos?${params}`, {
      headers: { Authorization: `Client-ID ${accessKey}` },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.results ?? []).slice(0, 3).map(
      (photo: {
        id: string;
        urls: { regular: string; small: string };
        alt_description: string | null;
        description: string | null;
        user: { name: string; links: { html: string } };
        width: number;
        height: number;
      }): UnsplashImage => ({
        id: `unsplash-${photo.id}`,
        url: photo.urls.regular,
        thumbnailUrl: photo.urls.small,
        alt: photo.alt_description || photo.description || term,
        photographer: photo.user.name,
        photographerUrl: photo.user.links.html,
        width: photo.width,
        height: photo.height,
      })
    );
  } catch {
    return [];
  }
}

async function fetchPexels(
  term: string,
  apiKey: string
): Promise<UnsplashImage[]> {
  try {
    const params = new URLSearchParams({
      query: term,
      per_page: "3",
      orientation: "landscape",
    });
    const res = await fetch(`${PEXELS_BASE}/search?${params}`, {
      headers: { Authorization: apiKey },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.photos ?? []).slice(0, 3).map(
      (photo: {
        id: number;
        src: { large: string; medium: string };
        alt: string | null;
        photographer: string;
        photographer_url: string;
        width: number;
        height: number;
      }): UnsplashImage => ({
        id: `pexels-${photo.id}`,
        url: photo.src.large,
        thumbnailUrl: photo.src.medium,
        alt: photo.alt || term,
        photographer: photo.photographer,
        photographerUrl: photo.photographer_url,
        width: photo.width,
        height: photo.height,
      })
    );
  } catch {
    return [];
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchTerms } = await request.json();

    if (!searchTerms || !Array.isArray(searchTerms) || searchTerms.length === 0) {
      return NextResponse.json({ error: "Search terms are required." }, { status: 400 });
    }

    const unsplashKey = process.env.UNSPLASH_ACCESS_KEY;
    const pexelsKey = process.env.PEXELS_API_KEY;

    if (!unsplashKey && !pexelsKey) {
      return NextResponse.json({ error: "No image API keys configured." }, { status: 500 });
    }

    // Fetch from both sources in parallel for all terms
    const terms = searchTerms.slice(0, 5);
    const allResults = await Promise.all(
      terms.map(async (term: string) => {
        const [unsplash, pexels] = await Promise.all([
          unsplashKey ? fetchUnsplash(term, unsplashKey) : Promise.resolve([]),
          pexelsKey ? fetchPexels(term, pexelsKey) : Promise.resolve([]),
        ]);
        return [...unsplash, ...pexels];
      })
    );

    // Flatten and deduplicate by id
    const seen = new Set<string>();
    const images = allResults.flat().filter((img) => {
      if (seen.has(img.id)) return false;
      seen.add(img.id);
      return true;
    });

    return NextResponse.json({ images });
  } catch (error) {
    console.error("Images API error:", error);
    return NextResponse.json({ error: "Failed to fetch images." }, { status: 500 });
  }
}
