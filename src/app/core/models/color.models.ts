export interface ColorItem {
  id: string;
  hex: string;
  locked: boolean;
}

export interface SavedPalette {
  id: string;
  name: string;
  description: string;
  tags: string[];
  colors: string[];
  timestamp: number;
}
