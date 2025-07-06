export type ClothingItem = {
  id: string;
  categoryId: string;
  imageUri: string;
  name: string;
  tags?: string[];
  createdAt: number;
};

export type Outfit = {
  id: string;
  items: Record<string, ClothingItem | null>;
  createdAt: number;
};