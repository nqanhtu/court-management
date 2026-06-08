import type { StorageBoxDto } from "@/lib/api/types";
import type {
  StorageLayoutData,
  StorageLayoutSearch,
  StorageLayoutShelf,
  StorageLayoutWarehouse,
  StorageOccupancyMap,
} from "@/lib/storage-layout/types";

const LOGICAL_WIDTH = 1000;
const DEFAULT_WAREHOUSE_WIDTH = 420;
const DEFAULT_WAREHOUSE_HEIGHT = 220;
const DEFAULT_SHELF_WIDTH = 108;
const DEFAULT_SHELF_HEIGHT = 42;

function normalizeLabel(value: string, fallback: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallback;
}

export function getStorageShelfId(box: Pick<StorageBoxDto, "line" | "shelf">) {
  return `${normalizeLabel(box.line, "Chưa rõ dãy")}::${normalizeLabel(box.shelf, "Chưa rõ kệ")}`;
}

function getOccupancyKey(warehouseId: string, shelfId: string) {
  return `${warehouseId}::${shelfId}`;
}

function sortByVietnameseName<T>(items: T[], getName: (item: T) => string) {
  return [...items].sort((a, b) => getName(a).localeCompare(getName(b), "vi"));
}

function isStorageLayoutShelf(value: StorageLayoutShelf | undefined): value is StorageLayoutShelf {
  return value !== undefined;
}

function createDefaultWarehouse(warehouseId: string, index: number, shelfIds: string[]): StorageLayoutWarehouse {
  const column = index % 2;
  const row = Math.floor(index / 2);
  const x = 40 + column * 480;
  const y = 40 + row * 270;
  const shelfRows = Math.max(1, Math.ceil(shelfIds.length / 3));
  const h = Math.max(DEFAULT_WAREHOUSE_HEIGHT, 86 + shelfRows * 60);

  return {
    id: warehouseId,
    name: warehouseId,
    x: Math.min(x, LOGICAL_WIDTH - DEFAULT_WAREHOUSE_WIDTH - 24),
    y,
    w: DEFAULT_WAREHOUSE_WIDTH,
    h,
    widthInMeters: null,
    heightInMeters: null,
    shelves: shelfIds.map((shelfId, shelfIndex) => {
      const [rowName, shelfName] = shelfId.split("::");
      return {
        id: shelfId,
        name: shelfName || shelfId,
        row: rowName || "Dãy",
        x: 64 + column * 480 + (shelfIndex % 3) * 126,
        y: y + 56 + Math.floor(shelfIndex / 3) * 60,
        w: DEFAULT_SHELF_WIDTH,
        h: DEFAULT_SHELF_HEIGHT,
      };
    }),
  };
}

export function buildStorageOccupancyMap(boxes: StorageBoxDto[], highlightedBoxes: StorageBoxDto[] = boxes): StorageOccupancyMap {
  const highlightedKeys = new Set(
    highlightedBoxes.map((box) => getOccupancyKey(normalizeLabel(box.warehouse, "Chưa rõ kho"), getStorageShelfId(box)))
  );
  const map: StorageOccupancyMap = new Map();

  for (const box of boxes) {
    const warehouseId = normalizeLabel(box.warehouse, "Chưa rõ kho");
    const shelfId = getStorageShelfId(box);
    const key = getOccupancyKey(warehouseId, shelfId);
    const current = map.get(key) || { count: 0, boxes: [], isHighlighted: false };
    current.count += 1;
    current.boxes.push(box);
    current.isHighlighted = highlightedKeys.has(key);
    map.set(key, current);
  }

  return map;
}

export function mergeStorageLayout(boxes: StorageBoxDto[], savedLayout: StorageLayoutData | null | undefined): StorageLayoutData {
  const physicalWarehouseShelves = new Map<string, Set<string>>();
  for (const box of boxes) {
    const warehouseId = normalizeLabel(box.warehouse, "Chưa rõ kho");
    const shelfId = getStorageShelfId(box);
    if (!physicalWarehouseShelves.has(warehouseId)) physicalWarehouseShelves.set(warehouseId, new Set());
    physicalWarehouseShelves.get(warehouseId)?.add(shelfId);
  }

  const savedWarehouses = new Map((savedLayout?.warehouses || []).map((warehouse) => [warehouse.id, warehouse]));
  const mergedWarehouses: StorageLayoutWarehouse[] = [];
  const warehouseIds = sortByVietnameseName(
    Array.from(new Set([...savedWarehouses.keys(), ...physicalWarehouseShelves.keys()])),
    (id) => id
  );

  warehouseIds.forEach((warehouseId, warehouseIndex) => {
    const requiredShelfIds = sortByVietnameseName(Array.from(physicalWarehouseShelves.get(warehouseId) || []), (id) => id);
    const savedWarehouse = savedWarehouses.get(warehouseId);
    if (!savedWarehouse) {
      mergedWarehouses.push(createDefaultWarehouse(warehouseId, warehouseIndex, requiredShelfIds));
      return;
    }

    const savedShelves = new Map(savedWarehouse.shelves.map((shelf) => [shelf.id, shelf]));
    const allShelfIds = sortByVietnameseName(
      Array.from(new Set([...savedShelves.keys(), ...requiredShelfIds])),
      (id) => id
    );
    const missingShelfDefaults = createDefaultWarehouse(warehouseId, warehouseIndex, requiredShelfIds).shelves;
    const missingShelves = new Map(missingShelfDefaults.map((shelf) => [shelf.id, shelf]));

    mergedWarehouses.push({
      ...savedWarehouse,
      shelves: allShelfIds.map((shelfId) => savedShelves.get(shelfId) || missingShelves.get(shelfId)).filter(isStorageLayoutShelf),
    });
  });

  return { version: 1, warehouses: mergedWarehouses };
}

export function getStorageLayoutSignature(layout: StorageLayoutData) {
  return JSON.stringify(layout);
}

export function filterBoxesForStorageLayoutSearch(boxes: StorageBoxDto[], search: StorageLayoutSearch) {
  const code = search.code.trim().toLowerCase();
  const fond = search.fond.trim().toLowerCase();
  const caseType = search.caseType.trim();
  const documentNumber = search.documentNumber.trim();
  const docNumber = Number(documentNumber);

  const isActive = Boolean(code || fond || caseType || documentNumber);
  if (!isActive) return { boxes, isActive: false };

  return {
    isActive: true,
    boxes: boxes.filter((box) => {
      if (code && !box.code.toLowerCase().includes(code)) return false;
      if (fond && !(box.agency?.name || "").toLowerCase().includes(fond)) return false;
      if (caseType && box.caseType !== caseType) return false;
      if (documentNumber) {
        if (!Number.isFinite(docNumber)) return false;
        const from = Number(box.fromFileCode);
        const to = Number(box.toFileCode);
        if (!Number.isFinite(from) || !Number.isFinite(to) || docNumber < from || docNumber > to) return false;
      }
      return true;
    }),
  };
}
