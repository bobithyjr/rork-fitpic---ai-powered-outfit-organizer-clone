export type ClothingCategory = {
  id: string;
  name: string;
  position: number;
  optional: boolean;
  closetGroup?: string;
};

export const CLOTHING_CATEGORIES: ClothingCategory[] = [
  { id: "all", name: "ALL", position: -1, optional: false },
  { id: "hats", name: "HATS", position: 1, optional: true },
  { id: "shirts", name: "SHIRTS", position: 4, optional: false },
  { id: "jackets", name: "COATS", position: 5, optional: true },
  { id: "accessories", name: "ACCESSORIES", position: 3, optional: true, closetGroup: "accessories" },
  { id: "pants", name: "PANTS", position: 7, optional: false },
  { id: "belts", name: "BELTS", position: 8, optional: false },
  { id: "shoes", name: "SHOES", position: 10, optional: false },
];

export const CLOSET_CATEGORIES = [
  { id: "all", name: "ALL" },
  { id: "hats", name: "HATS" },
  { id: "shirts", name: "SHIRTS" },
  { id: "jackets", name: "COATS" },
  { id: "pants", name: "PANTS" },
  { id: "belts", name: "BELTS" },
  { id: "shoes", name: "SHOES" },
  { id: "accessories", name: "ACCESSORIES" },
];