export interface Color {
  hex: string;
  name: string;
}

export interface MoodBoardData {
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

export interface MoodBoard {
  brief: string;
  data: MoodBoardData;
  images: UnsplashImage[];
}
