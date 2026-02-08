export interface TechEvent {
  id: string;
  title: string;
  date: string;
  location: string;
  description: string;
  sourceUrl?: string;
  tags: string[];
  cost?: string; // "Free" | "Paid" | "Unknown"
  hasCertificate?: boolean;
}

export interface GroundingMetadata {
  groundingChunks?: Array<{
    web?: {
      uri: string;
      title: string;
    };
    maps?: {
      uri: string;
      title: string;
      placeAnswerSources?: Array<{
        reviewSnippets?: Array<{
          snippet: string;
        }>;
      }>;
    };
  }>;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface ThemeConfig {
  id: string;
  name: string;
  backgroundImage: string; // URL for the wallpaper
  colors: {
    primary: string;    // Main button/highlight color
    secondary: string;  // Accent color
    text: string;
  };
}