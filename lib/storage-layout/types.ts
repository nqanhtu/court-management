import type { StorageBoxDto } from "@/lib/api/types";

export type StorageLayoutShelf = {
  id: string;
  name: string;
  row: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type StorageLayoutWarehouse = {
  id: string;
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
  widthInMeters?: number | null;
  heightInMeters?: number | null;
  shelves: StorageLayoutShelf[];
};

export type StorageLayoutData = {
  version: 1;
  warehouses: StorageLayoutWarehouse[];
};

export type StorageLayoutSelection =
  | { type: "warehouse"; id: string }
  | { type: "shelf"; warehouseId: string; id: string };

export type StorageLayoutTransform = {
  x: number;
  y: number;
  k: number;
};

export type StorageShelfOccupancy = {
  count: number;
  boxes: StorageBoxDto[];
  isHighlighted: boolean;
};

export type StorageOccupancyMap = Map<string, StorageShelfOccupancy>;

export type StorageLayoutSearch = {
  code: string;
  fond: string;
  caseType: string;
  documentNumber: string;
};
