export type ClothingCategory = {
  id: string;
  name: string;
  position: number;
  optional: boolean;
  closetGroup?: string;
};

export const CLOTHING_CATEGORIES: ClothingCategory[] = [
  { id: "all", name: "All", position: -1, optional: false },
  { id: "hats", name: "Hats", position: 1, optional: true },
  { id: "shirts", name: "Shirts", position: 4, optional: false },
  { id: "jackets", name: "Jackets & Hoodies", position: 5, optional: true },
  { id: "accessory1", name: "Accessory 1", position: 3, optional: true, closetGroup: "accessories" },
  { id: "pants", name: "Pants", position: 7, optional: false },
  { id: "belts", name: "Belts", position: 8, optional: false },
  { id: "accessory2", name: "Accessory 2", position: 6, optional: true, closetGroup: "accessories" },
  { id: "shoes", name: "Shoes", position: 10, optional: false },
];

export const CLOSET_CATEGORIES = [
  { id: "all", name: "All" },
  { id: "hats", name: "Hats" },
  { id: "shirts", name: "Shirts" },
  { id: "jackets", name: "Jackets & Hoodies" },
  { id: "pants", name: "Pants" },
  { id: "belts", name: "Belts" },
  { id: "shoes", name: "Shoes" },
  { id: "accessories", name: "Accessories" },
];