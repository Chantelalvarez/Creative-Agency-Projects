export interface Color {
  hex: string;
  name: string;
}

export interface StructuredBrief {
  projectName: string;
  clientBackground: string;
  projectScope: string;
  brandName: string;
  brandImage: string;
  targetAudience: string;
  competitorBrands: string;
  lookAndFeel: string;
  colourDirection: string;
  deliverables: string;
  timeline: string;
  otherNotes: string;
}

export interface MoodBoardRoute {
  name: string;
  direction: string;
  colorPalette: Color[];
  moodKeywords: string[];
  typographyDirection: {
    headingStyle: string;
    bodyStyle: string;
    notes: string;
  };
  visualSearchTerms: string[];
  creativeDirections: string[];
}

export interface UnsplashImage {
  id: string;
  url: string;
  thumbnailUrl: string;
  alt: string;
  photographer: string;
  photographerUrl: string;
  width: number;
  height: number;
}

export interface CompetitorBrand {
  name: string;
  overview: string;
  visualStyle: string;
  targetAudience: string;
  pricePositioning: string;
  strengths: string;
  weaknesses: string;
}

export interface CompetitorAnalysis {
  competitors: CompetitorBrand[];
  marketOpportunity: string;
}

export interface CreativeDocument {
  brief: StructuredBrief;
  competitorAnalysis: CompetitorAnalysis | null;
  routes: MoodBoardRoute[];
  routeImages: (UnsplashImage[] | null)[];
  generatedAt: string;
}
