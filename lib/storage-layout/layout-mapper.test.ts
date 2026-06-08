import { describe, expect, it } from "vitest";

import type { StorageBoxDto } from "@/lib/api/types";
import {
  buildStorageOccupancyMap,
  filterBoxesForStorageLayoutSearch,
  mergeStorageLayout,
} from "@/lib/storage-layout/layout-mapper";
import type { StorageLayoutData } from "@/lib/storage-layout/types";

const boxes: StorageBoxDto[] = [
  {
    id: "box-1",
    code: "BOX-001",
    warehouse: "Kho A",
    line: "Dãy 1",
    shelf: "Kệ 1",
    slot: "Ngăn 1",
    boxNumber: "001",
    agency: { id: "agency-1", name: "Phông A", startDate: "2026-01-01" },
    caseType: "Hình sự",
    fromFileCode: "1",
    toFileCode: "50",
  },
  {
    id: "box-2",
    code: "BOX-002",
    warehouse: "Kho A",
    line: "Dãy 1",
    shelf: "Kệ 1",
    slot: "Ngăn 2",
    boxNumber: "002",
    agency: { id: "agency-1", name: "Phông A", startDate: "2026-01-01" },
    caseType: "Dân sự",
    fromFileCode: "51",
    toFileCode: "100",
  },
  {
    id: "box-3",
    code: "BOX-003",
    warehouse: "Kho B",
    line: "Dãy 2",
    shelf: "Kệ 4",
    slot: "Ngăn 1",
    boxNumber: "003",
    agency: { id: "agency-2", name: "Phông B", startDate: "2026-01-01" },
    caseType: "Hành chính",
    fromFileCode: "10",
    toFileCode: "20",
  },
];

describe("storage layout mapper", () => {
  it("creates deterministic warehouse and shelf geometry from boxes", () => {
    const layout = mergeStorageLayout(boxes, null);

    expect(layout.version).toBe(1);
    expect(layout.warehouses.map((warehouse) => warehouse.id)).toEqual(["Kho A", "Kho B"]);
    expect(layout.warehouses[0].shelves).toMatchObject([
      { id: "Dãy 1::Kệ 1", row: "Dãy 1", name: "Kệ 1" },
    ]);
    expect(layout.warehouses[1].shelves).toMatchObject([
      { id: "Dãy 2::Kệ 4", row: "Dãy 2", name: "Kệ 4" },
    ]);
  });

  it("preserves saved geometry and adds newly discovered physical shelves", () => {
    const savedLayout: StorageLayoutData = {
      version: 1,
      warehouses: [
        {
          id: "Kho A",
          name: "Kho A tùy chỉnh",
          x: 123,
          y: 234,
          w: 345,
          h: 210,
          widthInMeters: null,
          heightInMeters: null,
          shelves: [
            { id: "Dãy 1::Kệ 1", name: "Kệ 1", row: "Dãy 1", x: 140, y: 260, w: 130, h: 50 },
          ],
        },
      ],
    };

    const layout = mergeStorageLayout(boxes, savedLayout);

    expect(layout.warehouses[0]).toMatchObject({
      id: "Kho A",
      name: "Kho A tùy chỉnh",
      x: 123,
      y: 234,
      w: 345,
      h: 210,
    });
    expect(layout.warehouses.find((warehouse) => warehouse.id === "Kho B")?.shelves[0]).toMatchObject({
      id: "Dãy 2::Kệ 4",
    });
  });

  it("builds shelf occupancy counts and highlights from filtered boxes", () => {
    const occupancy = buildStorageOccupancyMap(boxes, [boxes[2]]);

    expect(occupancy.get("Kho A::Dãy 1::Kệ 1")).toMatchObject({ count: 2, isHighlighted: false });
    expect(occupancy.get("Kho B::Dãy 2::Kệ 4")).toMatchObject({ count: 1, isHighlighted: true });
  });

  it("filters boxes for the in-canvas search controls", () => {
    expect(filterBoxesForStorageLayoutSearch(boxes, {
      code: "003",
      fond: "",
      caseType: "",
      documentNumber: "",
    }).boxes.map((box) => box.id)).toEqual(["box-3"]);

    expect(filterBoxesForStorageLayoutSearch(boxes, {
      code: "",
      fond: "phông a",
      caseType: "Dân sự",
      documentNumber: "75",
    }).boxes.map((box) => box.id)).toEqual(["box-2"]);

    expect(filterBoxesForStorageLayoutSearch(boxes, {
      code: "",
      fond: "",
      caseType: "",
      documentNumber: "not-a-number",
    })).toMatchObject({ isActive: true, boxes: [] });
  });
});
