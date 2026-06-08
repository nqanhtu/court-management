"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type Konva from "konva";
import { select } from "d3-selection";
import { zoom, zoomIdentity, type D3ZoomEvent, type ZoomBehavior } from "d3-zoom";
import {
  Box,
  Download,
  Flame,
  Layers3,
  Loader2,
  MapPinned,
  Move,
  MousePointer2,
  Plus,
  QrCode,
  RotateCcw,
  Route,
  Save,
  Search,
  Trash2,
  Upload,
  Warehouse,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import { Circle, Group, Layer, Line, Rect, Stage, Text, Transformer } from "react-konva";
import { toast } from "sonner";

import type { StorageBoxDto } from "@/lib/api/types";
import { useSaveStorageLayout } from "@/lib/hooks/use-storage-layout";
import {
  buildStorageOccupancyMap,
  filterBoxesForStorageLayoutSearch,
  getStorageLayoutSignature,
  getStorageShelfId,
  mergeStorageLayout,
} from "@/lib/storage-layout/layout-mapper";
import type {
  StorageLayoutData,
  StorageLayoutSearch,
  StorageLayoutSelection,
  StorageLayoutShelf,
  StorageLayoutTransform,
  StorageLayoutWarehouse,
  StorageOccupancyMap,
  StorageShelfOccupancy,
} from "@/lib/storage-layout/types";
import { printStorageBoxLabels, type StorageBoxLabelPrintItem } from "@/lib/storage-box/print-labels";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

const LOGICAL_WIDTH = 1000;
const LOGICAL_HEIGHT = 640;
const MIN_WAREHOUSE_SIZE = { w: 180, h: 130 };
const MIN_SHELF_SIZE = { w: 56, h: 28 };
const ENTRANCE_GATE = { x: 500, y: 610 };

type StorageLayoutCanvasProps = {
  boxes: StorageBoxDto[];
  highlightedBoxes: StorageBoxDto[];
  savedLayout: StorageLayoutData | null;
  isLoadingLayout: boolean;
  isHighlightActive: boolean;
};

type HoveredShelf = {
  warehouse: StorageLayoutWarehouse;
  shelf: StorageLayoutShelf;
  occupancy: StorageShelfOccupancy | undefined;
  x: number;
  y: number;
};

type CanvasBoardProps = {
  layout: StorageLayoutData;
  occupancyMap: StorageOccupancyMap;
  isEditMode: boolean;
  isPanMode: boolean;
  isHeatmapMode: boolean;
  isHighlightActive: boolean;
  is25DMode: boolean;
  isPathfindingActive: boolean;
  pulseScale: number;
  lineDashOffset: number;
  selectedElement: StorageLayoutSelection | null;
  transform: StorageLayoutTransform;
  onTransformChange: (transform: StorageLayoutTransform) => void;
  onSelectElement: (selection: StorageLayoutSelection | null) => void;
  onChangeLayout: (layout: StorageLayoutData) => void;
  onHoverShelf: (hoveredShelf: HoveredShelf | null) => void;
};

function getShelfMapKey(warehouseId: string, shelfId: string) {
  return `${warehouseId}::${shelfId}`;
}

function projectIso(point: { x: number; y: number; z?: number }, is25DMode: boolean) {
  const { x, y, z = 0 } = point;
  if (!is25DMode) return { x, y: y - z };

  const originX = 500;
  const originY = 210;
  const dx = x - originX;
  const dy = y - originY;

  return {
    x: originX + (dx - dy) * Math.cos(Math.PI / 12) * 0.85,
    y: originY + (dx + dy) * Math.sin(Math.PI / 12) * 0.65 - z,
  };
}

function flattenPoints(points: { x: number; y: number }[]) {
  return points.flatMap((point) => [point.x, point.y]);
}

function getWarehousePolygon(warehouse: StorageLayoutWarehouse, is25DMode: boolean, z = 0) {
  return [
    projectIso({ x: warehouse.x, y: warehouse.y, z }, is25DMode),
    projectIso({ x: warehouse.x + warehouse.w, y: warehouse.y, z }, is25DMode),
    projectIso({ x: warehouse.x + warehouse.w, y: warehouse.y + warehouse.h, z }, is25DMode),
    projectIso({ x: warehouse.x, y: warehouse.y + warehouse.h, z }, is25DMode),
  ];
}

function getShelfPolygon(shelf: StorageLayoutShelf, is25DMode: boolean, z = 0) {
  return [
    projectIso({ x: shelf.x, y: shelf.y, z }, is25DMode),
    projectIso({ x: shelf.x + shelf.w, y: shelf.y, z }, is25DMode),
    projectIso({ x: shelf.x + shelf.w, y: shelf.y + shelf.h, z }, is25DMode),
    projectIso({ x: shelf.x, y: shelf.y + shelf.h, z }, is25DMode),
  ];
}

function PrismFaces({
  basePoints,
  height,
  fill,
  stroke,
}: {
  basePoints: { x: number; y: number }[];
  height: number;
  fill: string;
  stroke: string;
}) {
  return (
    <>
      {basePoints.map((point, index) => {
        const next = basePoints[(index + 1) % basePoints.length];
        const face = [
          point,
          next,
          { x: next.x, y: next.y - height },
          { x: point.x, y: point.y - height },
        ];
        return (
          <Line
            key={`${point.x}-${point.y}-${index}`}
            points={flattenPoints(face)}
            closed
            fill={fill}
            stroke={stroke}
            strokeWidth={1}
            listening={false}
            perfectDrawEnabled={false}
          />
        );
      })}
    </>
  );
}

function getRoutePoints(shelf: StorageLayoutShelf, is25DMode: boolean) {
  const centerX = shelf.x + shelf.w / 2;
  const centerY = shelf.y + shelf.h / 2;
  const hallwayY = 320;
  return [
    projectIso({ ...ENTRANCE_GATE }, is25DMode),
    projectIso({ x: ENTRANCE_GATE.x, y: hallwayY }, is25DMode),
    projectIso({ x: centerX, y: hallwayY }, is25DMode),
    projectIso({ x: centerX, y: centerY, z: is25DMode ? 45 : 0 }, is25DMode),
  ];
}

function updateWarehouse(layout: StorageLayoutData, warehouseId: string, nextWarehouse: StorageLayoutWarehouse) {
  return {
    ...layout,
    warehouses: layout.warehouses.map((warehouse) => (warehouse.id === warehouseId ? nextWarehouse : warehouse)),
  };
}

function getShelfColor(count: number, isHeatmapMode: boolean, isSelected: boolean, isHighlighted: boolean, isHovered: boolean) {
  if (isSelected) return { fill: "#dbeafe", stroke: "#2563eb", text: "#1e3a8a" };
  if (isHighlighted) return { fill: "#ffedd5", stroke: "#f97316", text: "#9a3412" };
  if (isHovered) return { fill: "#ecfdf5", stroke: "#10b981", text: "#047857" };
  if (!isHeatmapMode) return { fill: "#ffffff", stroke: "#64748b", text: "#334155" };
  if (count === 0) return { fill: "#f8fafc", stroke: "#cbd5e1", text: "#64748b" };
  if (count <= 2) return { fill: "#dcfce7", stroke: "#16a34a", text: "#166534" };
  if (count <= 4) return { fill: "#fef3c7", stroke: "#d97706", text: "#92400e" };
  return { fill: "#fee2e2", stroke: "#dc2626", text: "#991b1b" };
}

function createShelf(warehouse: StorageLayoutWarehouse): StorageLayoutShelf {
  const nextNumber = warehouse.shelves.length + 1;
  const id = `Dãy mới::Kệ ${nextNumber}`;
  return {
    id,
    name: `Kệ ${nextNumber}`,
    row: "Dãy mới",
    x: warehouse.x + 24 + ((nextNumber - 1) % 3) * 126,
    y: warehouse.y + 64 + Math.floor((nextNumber - 1) / 3) * 60,
    w: 108,
    h: 42,
  };
}

function createWarehouse(layout: StorageLayoutData): StorageLayoutWarehouse {
  const index = layout.warehouses.length;
  const id = `Kho tự tạo ${index + 1}`;
  return {
    id,
    name: id,
    x: 60 + (index % 2) * 460,
    y: 60 + Math.floor(index / 2) * 260,
    w: 380,
    h: 220,
    widthInMeters: null,
    heightInMeters: null,
    shelves: [],
  };
}

function isStorageLayoutData(value: unknown): value is StorageLayoutData {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  if (record.version !== 1 || !Array.isArray(record.warehouses)) return false;
  return record.warehouses.every((warehouse) => {
    if (!warehouse || typeof warehouse !== "object" || Array.isArray(warehouse)) return false;
    const wh = warehouse as Record<string, unknown>;
    return (
      typeof wh.id === "string" &&
      typeof wh.name === "string" &&
      typeof wh.x === "number" &&
      typeof wh.y === "number" &&
      typeof wh.w === "number" &&
      typeof wh.h === "number" &&
      Array.isArray(wh.shelves)
    );
  });
}

function getBoxQrUrl(box: StorageBoxDto) {
  if (typeof window === "undefined") return `/qr/boxes/${box.id}`;
  return `${window.location.origin}/qr/boxes/${box.id}`;
}

function CanvasBoard({
  layout,
  occupancyMap,
  isEditMode,
  isPanMode,
  isHeatmapMode,
  isHighlightActive,
  is25DMode,
  isPathfindingActive,
  pulseScale,
  lineDashOffset,
  selectedElement,
  transform,
  onTransformChange,
  onSelectElement,
  onChangeLayout,
  onHoverShelf,
}: CanvasBoardProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<Konva.Stage | null>(null);
  const transformerRef = useRef<Konva.Transformer | null>(null);
  const shapeRefs = useRef<Map<string, Konva.Node>>(new Map());
  const zoomBehaviorRef = useRef<ZoomBehavior<HTMLDivElement, unknown> | null>(null);
  const transformRef = useRef(transform);
  const [size, setSize] = useState({ width: 1, height: 1 });
  const [hoveredWarehouseId, setHoveredWarehouseId] = useState<string | null>(null);
  const [hoveredShelfKey, setHoveredShelfKey] = useState<string | null>(null);

  const fitScale = Math.min(size.width / LOGICAL_WIDTH, size.height / LOGICAL_HEIGHT);
  const worldScale = fitScale * transform.k;
  const worldX = Math.round((size.width - LOGICAL_WIDTH * fitScale) / 2 + transform.x * fitScale);
  const worldY = Math.round((size.height - LOGICAL_HEIGHT * fitScale) / 2 + transform.y * fitScale);
  const selectedKey = selectedElement
    ? selectedElement.type === "warehouse"
      ? `warehouse:${selectedElement.id}`
      : `shelf:${selectedElement.warehouseId}:${selectedElement.id}`
    : null;

  const targetShelf = useMemo(() => {
    if (isHighlightActive) {
      for (const warehouse of layout.warehouses) {
        const shelf = warehouse.shelves.find((item) => occupancyMap.get(getShelfMapKey(warehouse.id, item.id))?.isHighlighted);
        if (shelf) return shelf;
      }
    }
    if (selectedElement?.type === "shelf") {
      return layout.warehouses
        .find((warehouse) => warehouse.id === selectedElement.warehouseId)
        ?.shelves.find((shelf) => shelf.id === selectedElement.id) || null;
    }
    return null;
  }, [isHighlightActive, layout.warehouses, occupancyMap, selectedElement]);

  const routePoints = targetShelf && isPathfindingActive ? getRoutePoints(targetShelf, is25DMode) : [];

  useEffect(() => {
    transformRef.current = transform;
  }, [transform]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateSize = () => {
      const rect = container.getBoundingClientRect();
      setSize({
        width: Math.max(1, Math.round(rect.width)),
        height: Math.max(1, Math.round(rect.height)),
      });
    };

    updateSize();
    const resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    const container = stageRef.current?.container();
    if (!container) return;

    const behavior = zoom<HTMLDivElement, unknown>()
      .scaleExtent([0.55, 4])
      .filter((event: WheelEvent | MouseEvent | TouchEvent) => {
        if (event.type === "wheel") return true;
        if (event.type === "touchstart" || event.type === "touchmove") return true;
        return isPanMode || (event instanceof MouseEvent && (event.button === 1 || event.button === 2));
      })
      .on("zoom", (event: D3ZoomEvent<HTMLDivElement, unknown>) => {
        event.sourceEvent?.preventDefault();
        const next = { x: event.transform.x, y: event.transform.y, k: event.transform.k };
        transformRef.current = next;
        onTransformChange(next);
      });

    zoomBehaviorRef.current = behavior;
    select(container).call(behavior).on("dblclick.zoom", null);
    select(container).call(
      behavior.transform,
      zoomIdentity.translate(transformRef.current.x, transformRef.current.y).scale(transformRef.current.k)
    );

    return () => {
      select(container).on(".zoom", null);
    };
  }, [isPanMode, onTransformChange]);

  useEffect(() => {
    const container = stageRef.current?.container();
    if (!container || !zoomBehaviorRef.current) return;

    const current = transformRef.current;
    const isSame =
      Math.abs(current.x - transform.x) < 0.01 &&
      Math.abs(current.y - transform.y) < 0.01 &&
      Math.abs(current.k - transform.k) < 0.001;
    if (!isSame) {
      transformRef.current = transform;
      select(container).call(zoomBehaviorRef.current.transform, zoomIdentity.translate(transform.x, transform.y).scale(transform.k));
    }
  }, [transform]);

  useEffect(() => {
    const transformer = transformerRef.current;
    if (!transformer) return;
    const selectedNode = selectedKey ? shapeRefs.current.get(selectedKey) : null;
    transformer.nodes(selectedNode && isEditMode && !is25DMode ? [selectedNode] : []);
    transformer.getLayer()?.batchDraw();
  }, [is25DMode, isEditMode, layout, selectedKey]);

  const handleWarehouseDragEnd = (warehouse: StorageLayoutWarehouse, event: Konva.KonvaEventObject<DragEvent>) => {
    const nextX = Math.round(Math.max(0, Math.min(event.target.x(), LOGICAL_WIDTH - warehouse.w)));
    const nextY = Math.round(Math.max(0, event.target.y()));
    const deltaX = nextX - warehouse.x;
    const deltaY = nextY - warehouse.y;
    onChangeLayout(updateWarehouse(layout, warehouse.id, {
      ...warehouse,
      x: nextX,
      y: nextY,
      shelves: warehouse.shelves.map((shelf) => ({
        ...shelf,
        x: Math.round(shelf.x + deltaX),
        y: Math.round(shelf.y + deltaY),
      })),
    }));
  };

  const handleWarehouseTransformEnd = (warehouse: StorageLayoutWarehouse, event: Konva.KonvaEventObject<Event>) => {
    const node = event.target;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    node.scaleX(1);
    node.scaleY(1);
    onChangeLayout(updateWarehouse(layout, warehouse.id, {
      ...warehouse,
      x: Math.round(node.x()),
      y: Math.round(node.y()),
      w: Math.max(MIN_WAREHOUSE_SIZE.w, Math.round(warehouse.w * scaleX)),
      h: Math.max(MIN_WAREHOUSE_SIZE.h, Math.round(warehouse.h * scaleY)),
    }));
  };

  const handleShelfDragEnd = (warehouse: StorageLayoutWarehouse, shelfId: string, event: Konva.KonvaEventObject<DragEvent>) => {
    onChangeLayout(updateWarehouse(layout, warehouse.id, {
      ...warehouse,
      shelves: warehouse.shelves.map((shelf) => {
        if (shelf.id !== shelfId) return shelf;
        return {
          ...shelf,
          x: Math.round(Math.max(warehouse.x + 12, Math.min(event.target.x(), warehouse.x + warehouse.w - shelf.w - 12))),
          y: Math.round(Math.max(warehouse.y + 38, Math.min(event.target.y(), warehouse.y + warehouse.h - shelf.h - 12))),
        };
      }),
    }));
  };

  const handleShelfTransformEnd = (warehouse: StorageLayoutWarehouse, shelfId: string, event: Konva.KonvaEventObject<Event>) => {
    const node = event.target;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    node.scaleX(1);
    node.scaleY(1);
    onChangeLayout(updateWarehouse(layout, warehouse.id, {
      ...warehouse,
      shelves: warehouse.shelves.map((shelf) => {
        if (shelf.id !== shelfId) return shelf;
        const nextX = Math.max(warehouse.x + 12, Math.min(node.x(), warehouse.x + warehouse.w - MIN_SHELF_SIZE.w - 12));
        const nextY = Math.max(warehouse.y + 38, Math.min(node.y(), warehouse.y + warehouse.h - MIN_SHELF_SIZE.h - 12));
        return {
          ...shelf,
          x: Math.round(nextX),
          y: Math.round(nextY),
          w: Math.max(MIN_SHELF_SIZE.w, Math.min(Math.round(shelf.w * scaleX), warehouse.x + warehouse.w - nextX - 12)),
          h: Math.max(MIN_SHELF_SIZE.h, Math.min(Math.round(shelf.h * scaleY), warehouse.y + warehouse.h - nextY - 12)),
        };
      }),
    }));
  };

  return (
    <div ref={containerRef} className="absolute inset-0 touch-none bg-slate-50">
      <Stage
        ref={stageRef}
        width={size.width}
        height={size.height}
        onMouseDown={(event) => {
          if (event.target === event.target.getStage()) onSelectElement(null);
        }}
        onTouchStart={(event) => {
          if (event.target === event.target.getStage()) onSelectElement(null);
        }}
        onContextMenu={(event) => event.evt.preventDefault()}
        style={{ cursor: isPanMode ? "grab" : isEditMode && !is25DMode ? "crosshair" : "default" }}
      >
        <Layer listening={false}>
          <Rect width={size.width} height={size.height} fill="#f8fafc" />
        </Layer>
        <Layer listening={false} x={worldX} y={worldY} scaleX={worldScale} scaleY={worldScale}>
          {Array.from({ length: 48 }, (_, index) => -400 + index * 40).map((value) => (
            <Group key={value}>
              <Line points={[value, -400, value, 1800]} stroke="rgba(15, 23, 42, 0.06)" strokeWidth={1} />
              <Line points={[-400, value, 1800, value]} stroke="rgba(15, 23, 42, 0.06)" strokeWidth={1} />
            </Group>
          ))}
        </Layer>
        <Layer x={worldX} y={worldY} scaleX={worldScale} scaleY={worldScale}>
          {layout.warehouses.map((warehouse) => {
            const isWarehouseSelected = selectedElement?.type === "warehouse" && selectedElement.id === warehouse.id;
            const isWarehouseHovered = hoveredWarehouseId === warehouse.id;
            const wallHeight = is25DMode ? 45 : 0;
            const warehouseKey = `warehouse:${warehouse.id}`;
            const warehousePoints = getWarehousePolygon(warehouse, is25DMode, wallHeight);
            const warehouseBasePoints = getWarehousePolygon(warehouse, is25DMode, 0);
            const warehouseCenter = projectIso({ x: warehouse.x + warehouse.w / 2, y: warehouse.y + warehouse.h / 2, z: wallHeight }, is25DMode);

            return (
              <Group key={warehouse.id}>
                {is25DMode && (
                  <>
                    <Line points={flattenPoints(warehouseBasePoints)} closed fill="rgba(203, 213, 225, 0.35)" stroke="#94a3b8" strokeWidth={1} listening={false} />
                    <PrismFaces basePoints={warehouseBasePoints} height={wallHeight} fill="rgba(226, 232, 240, 0.82)" stroke="#475569" />
                  </>
                )}
                {is25DMode ? (
                  <Line
                    points={flattenPoints(warehousePoints)}
                    closed
                    fill={isWarehouseSelected ? "rgba(14, 165, 233, 0.12)" : isWarehouseHovered ? "rgba(224, 242, 254, 0.82)" : "rgba(241, 245, 249, 0.82)"}
                    stroke={isWarehouseSelected ? "#0284c7" : "#475569"}
                    strokeWidth={isWarehouseSelected ? 3 : 2}
                    dash={isEditMode ? [4, 4] : []}
                    shadowColor="#0f172a"
                    shadowBlur={isWarehouseHovered || isWarehouseSelected ? 12 : 0}
                    shadowOpacity={isWarehouseHovered || isWarehouseSelected ? 0.12 : 0}
                    shadowOffsetY={isWarehouseHovered || isWarehouseSelected ? 3 : 0}
                    onClick={(event) => {
                      event.cancelBubble = true;
                      onSelectElement({ type: "warehouse", id: warehouse.id });
                    }}
                    onTap={(event) => {
                      event.cancelBubble = true;
                      onSelectElement({ type: "warehouse", id: warehouse.id });
                    }}
                    onMouseEnter={() => setHoveredWarehouseId(warehouse.id)}
                    onMouseLeave={() => setHoveredWarehouseId(null)}
                  />
                ) : (
                  <Rect
                    ref={(node) => {
                      if (node) shapeRefs.current.set(warehouseKey, node);
                      else shapeRefs.current.delete(warehouseKey);
                    }}
                    x={warehouse.x}
                    y={warehouse.y}
                    width={warehouse.w}
                    height={warehouse.h}
                    fill={isWarehouseSelected ? "rgba(14, 165, 233, 0.12)" : isWarehouseHovered ? "rgba(224, 242, 254, 0.82)" : "rgba(241, 245, 249, 0.82)"}
                    stroke={isWarehouseSelected ? "#0284c7" : "#475569"}
                    strokeWidth={isWarehouseSelected ? 3 : 2}
                    dash={isEditMode ? [4, 4] : []}
                    cornerRadius={4}
                    draggable={isEditMode}
                    shadowColor="#0f172a"
                    shadowBlur={isWarehouseHovered || isWarehouseSelected ? 12 : 0}
                    shadowOpacity={isWarehouseHovered || isWarehouseSelected ? 0.12 : 0}
                    shadowOffsetY={isWarehouseHovered || isWarehouseSelected ? 3 : 0}
                    onClick={(event) => {
                      event.cancelBubble = true;
                      onSelectElement({ type: "warehouse", id: warehouse.id });
                    }}
                    onTap={(event) => {
                      event.cancelBubble = true;
                      onSelectElement({ type: "warehouse", id: warehouse.id });
                    }}
                    onMouseEnter={() => setHoveredWarehouseId(warehouse.id)}
                    onMouseLeave={() => setHoveredWarehouseId(null)}
                    onDragEnd={(event) => handleWarehouseDragEnd(warehouse, event)}
                    onTransformEnd={(event) => handleWarehouseTransformEnd(warehouse, event)}
                  />
                )}
                <Text
                  x={warehouseCenter.x - Math.min(160, warehouse.w / 2)}
                  y={warehouseCenter.y - 15}
                  width={Math.min(320, warehouse.w)}
                  align="center"
                  text={warehouse.name}
                  fontFamily="Inter, sans-serif"
                  fontSize={14}
                  fontStyle="bold"
                  fill="#0f172a"
                  listening={false}
                />
                <Text
                  x={warehouseCenter.x - Math.min(160, warehouse.w / 2)}
                  y={warehouseCenter.y + 4}
                  width={Math.min(320, warehouse.w)}
                  align="center"
                  text={`${warehouse.shelves.length} kệ`}
                  fontFamily="Inter, sans-serif"
                  fontSize={10}
                  fill="#64748b"
                  listening={false}
                />
                {warehouse.shelves.map((shelf) => {
                  const occupancy = occupancyMap.get(getShelfMapKey(warehouse.id, shelf.id));
                  const count = occupancy?.count || 0;
                  const isShelfSelected =
                    selectedElement?.type === "shelf" &&
                    selectedElement.warehouseId === warehouse.id &&
                    selectedElement.id === shelf.id;
                  const isHighlighted = Boolean(isHighlightActive && occupancy?.isHighlighted);
                  const shelfHeight = is25DMode ? 25 : 0;
                  const shelfPoints = getShelfPolygon(shelf, is25DMode, wallHeight + shelfHeight);
                  const shelfBasePoints = getShelfPolygon(shelf, is25DMode, wallHeight);
                  const shelfCenter = projectIso({ x: shelf.x + shelf.w / 2, y: shelf.y + shelf.h / 2, z: wallHeight + shelfHeight }, is25DMode);
                  const shelfKey = `shelf:${warehouse.id}:${shelf.id}`;
                  const isShelfHovered = hoveredShelfKey === shelfKey;
                  const color = getShelfColor(count, isHeatmapMode, isShelfSelected, isHighlighted, isShelfHovered);
                  return (
                    <Group key={shelf.id}>
                      {is25DMode && <PrismFaces basePoints={shelfBasePoints} height={shelfHeight} fill="rgba(100, 116, 139, 0.38)" stroke="#475569" />}
                      {is25DMode ? (
                        <Line
                          points={flattenPoints(shelfPoints)}
                          closed
                          fill={color.fill}
                          stroke={color.stroke}
                          strokeWidth={isShelfSelected || isHighlighted ? 2.5 : 1.5}
                          shadowColor="#0f172a"
                          shadowBlur={isShelfHovered || isShelfSelected || isHighlighted ? 10 : 0}
                          shadowOpacity={isShelfHovered || isShelfSelected || isHighlighted ? 0.14 : 0}
                          shadowOffsetY={isShelfHovered || isShelfSelected || isHighlighted ? 3 : 0}
                          onClick={(event) => {
                            event.cancelBubble = true;
                            onSelectElement({ type: "shelf", warehouseId: warehouse.id, id: shelf.id });
                          }}
                          onTap={(event) => {
                            event.cancelBubble = true;
                            onSelectElement({ type: "shelf", warehouseId: warehouse.id, id: shelf.id });
                          }}
                          onMouseEnter={() => setHoveredShelfKey(shelfKey)}
                          onMouseMove={(event) => {
                            onHoverShelf({ warehouse, shelf, occupancy, x: event.evt.offsetX, y: event.evt.offsetY });
                          }}
                          onMouseLeave={() => {
                            setHoveredShelfKey(null);
                            onHoverShelf(null);
                          }}
                        />
                      ) : (
                        <Rect
                          ref={(node) => {
                            if (node) shapeRefs.current.set(shelfKey, node);
                            else shapeRefs.current.delete(shelfKey);
                          }}
                          x={shelf.x}
                          y={shelf.y}
                          width={shelf.w}
                          height={shelf.h}
                          fill={color.fill}
                          stroke={color.stroke}
                          strokeWidth={isShelfSelected || isHighlighted ? 2.5 : 1.5}
                          cornerRadius={3}
                          draggable={isEditMode}
                          shadowColor="#0f172a"
                          shadowBlur={isShelfHovered || isShelfSelected || isHighlighted ? 10 : 0}
                          shadowOpacity={isShelfHovered || isShelfSelected || isHighlighted ? 0.14 : 0}
                          shadowOffsetY={isShelfHovered || isShelfSelected || isHighlighted ? 3 : 0}
                          onClick={(event) => {
                            event.cancelBubble = true;
                            onSelectElement({ type: "shelf", warehouseId: warehouse.id, id: shelf.id });
                          }}
                          onTap={(event) => {
                            event.cancelBubble = true;
                            onSelectElement({ type: "shelf", warehouseId: warehouse.id, id: shelf.id });
                          }}
                          onMouseEnter={() => setHoveredShelfKey(shelfKey)}
                          onMouseMove={(event) => {
                            onHoverShelf({ warehouse, shelf, occupancy, x: event.evt.offsetX, y: event.evt.offsetY });
                          }}
                          onMouseLeave={() => {
                            setHoveredShelfKey(null);
                            onHoverShelf(null);
                          }}
                          onDragEnd={(event) => handleShelfDragEnd(warehouse, shelf.id, event)}
                          onTransformEnd={(event) => handleShelfTransformEnd(warehouse, shelf.id, event)}
                        />
                      )}
                      {[1, 2, 3].map((partition) => {
                        const x = shelf.x + (shelf.w / 4) * partition;
                        const top = projectIso({ x, y: shelf.y, z: wallHeight + shelfHeight }, is25DMode);
                        const bottom = projectIso({ x, y: shelf.y + shelf.h, z: wallHeight + shelfHeight }, is25DMode);
                        return (
                          <Line
                            key={partition}
                            points={is25DMode ? [top.x, top.y, bottom.x, bottom.y] : [x, shelf.y, x, shelf.y + shelf.h]}
                            stroke="rgba(15, 23, 42, 0.08)"
                            strokeWidth={1}
                            listening={false}
                            perfectDrawEnabled={false}
                          />
                        );
                      })}
                      {isHighlighted && (
                        <Rect
                          x={shelfCenter.x - shelf.w / 2 - (pulseScale - 1) * 10}
                          y={shelfCenter.y - shelf.h / 2 - (pulseScale - 1) * 10}
                          width={shelf.w + (pulseScale - 1) * 20}
                          height={shelf.h + (pulseScale - 1) * 20}
                          stroke="#f97316"
                          strokeWidth={1.5}
                          opacity={1 - (pulseScale - 1)}
                          listening={false}
                        />
                      )}
                      <Text
                        x={shelfCenter.x - Math.min(60, shelf.w / 2)}
                        y={shelfCenter.y - 10}
                        width={Math.min(120, shelf.w)}
                        align="center"
                        text={`${shelf.row} - ${shelf.name}`}
                        fontFamily="Inter, sans-serif"
                        fontSize={9}
                        fontStyle="bold"
                        fill={color.text}
                        ellipsis
                        listening={false}
                      />
                      <Text
                        x={shelfCenter.x - Math.min(60, shelf.w / 2)}
                        y={shelfCenter.y + 5}
                        width={Math.min(120, shelf.w)}
                        align="center"
                        text={`${count} hộp`}
                        fontFamily="Inter, sans-serif"
                        fontSize={9}
                        fill={color.text}
                        listening={false}
                      />
                    </Group>
                  );
                })}
              </Group>
            );
          })}
        </Layer>
        <Layer listening={false} x={worldX} y={worldY} scaleX={worldScale} scaleY={worldScale}>
          {routePoints.length > 0 && (
            <>
              <Line
                points={flattenPoints(routePoints)}
                stroke="#6366f1"
                strokeWidth={4}
                lineCap="round"
                lineJoin="round"
                dash={[6, 6]}
                dashOffset={lineDashOffset}
                shadowColor="#6366f1"
                shadowBlur={8}
                shadowOpacity={0.25}
              />
              <Circle x={routePoints[routePoints.length - 1].x} y={routePoints[routePoints.length - 1].y} radius={4} fill="#6366f1" />
              <Circle
                x={routePoints[routePoints.length - 1].x}
                y={routePoints[routePoints.length - 1].y}
                radius={10 * pulseScale}
                stroke="rgba(99, 102, 241, 0.4)"
                strokeWidth={2}
                opacity={1 - (pulseScale - 1) / 1.4}
              />
            </>
          )}
          {(() => {
            const entrance = projectIso({ ...ENTRANCE_GATE }, is25DMode);
            return (
              <Group>
                <Circle x={entrance.x} y={entrance.y} radius={6} fill="#334155" stroke="#ffffff" strokeWidth={1} />
                <Circle x={entrance.x} y={entrance.y} radius={9 * pulseScale} stroke="rgba(51, 65, 85, 0.22)" strokeWidth={2} opacity={1 - (pulseScale - 1) / 1.4} />
                <Text x={entrance.x - 45} y={entrance.y - 22} width={90} align="center" text="LỐI VÀO KHO" fontSize={8} fontStyle="bold" fill="#475569" />
              </Group>
            );
          })()}
        </Layer>
        <Layer x={worldX} y={worldY} scaleX={worldScale} scaleY={worldScale}>
          <Transformer
            ref={transformerRef}
            rotateEnabled={false}
            flipEnabled={false}
            enabledAnchors={["bottom-right", "middle-right", "bottom-center"]}
            boundBoxFunc={(oldBox, newBox) => {
              if (newBox.width < MIN_SHELF_SIZE.w || newBox.height < MIN_SHELF_SIZE.h) return oldBox;
              return newBox;
            }}
          />
        </Layer>
      </Stage>
    </div>
  );
}

function findSelectedObject(layout: StorageLayoutData, selectedElement: StorageLayoutSelection | null) {
  if (!selectedElement) return null;
  if (selectedElement.type === "warehouse") {
    return layout.warehouses.find((warehouse) => warehouse.id === selectedElement.id) || null;
  }
  return layout.warehouses
    .find((warehouse) => warehouse.id === selectedElement.warehouseId)
    ?.shelves.find((shelf) => shelf.id === selectedElement.id) || null;
}

export function StorageLayoutCanvas({
  boxes,
  highlightedBoxes,
  savedLayout,
  isLoadingLayout,
  isHighlightActive,
}: StorageLayoutCanvasProps) {
  const saveLayout = useSaveStorageLayout();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [layout, setLayout] = useState<StorageLayoutData>({ version: 1, warehouses: [] });
  const [selectedElement, setSelectedElement] = useState<StorageLayoutSelection | null>(null);
  const [hoveredShelf, setHoveredShelf] = useState<HoveredShelf | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isPanMode, setIsPanMode] = useState(false);
  const [isHeatmapMode, setIsHeatmapMode] = useState(true);
  const [is25DMode, setIs25DMode] = useState(false);
  const [isPathfindingActive, setIsPathfindingActive] = useState(true);
  const [isDirty, setIsDirty] = useState(false);
  const [pulseScale, setPulseScale] = useState(1);
  const [lineDashOffset, setLineDashOffset] = useState(0);
  const [transform, setTransform] = useState<StorageLayoutTransform>({ x: 0, y: 0, k: 1 });
  const [canvasSearch, setCanvasSearch] = useState<StorageLayoutSearch>({
    code: "",
    fond: "",
    caseType: "",
    documentNumber: "",
  });
  const [labelPreviewBoxes, setLabelPreviewBoxes] = useState<StorageBoxDto[]>([]);

  const mergedLayout = useMemo(() => mergeStorageLayout(boxes, savedLayout), [boxes, savedLayout]);
  const canvasSearchResults = useMemo(() => filterBoxesForStorageLayoutSearch(boxes, canvasSearch), [boxes, canvasSearch]);
  const effectiveHighlightedBoxes = canvasSearchResults.isActive ? canvasSearchResults.boxes : highlightedBoxes;
  const effectiveHighlightActive = canvasSearchResults.isActive || isHighlightActive;
  const occupancyMap = useMemo(
    () => buildStorageOccupancyMap(boxes, effectiveHighlightedBoxes),
    [boxes, effectiveHighlightedBoxes]
  );
  const selectedObject = useMemo(() => findSelectedObject(layout, selectedElement), [layout, selectedElement]);
  const selectedWarehouse = selectedElement?.type === "warehouse"
    ? layout.warehouses.find((warehouse) => warehouse.id === selectedElement.id) || null
    : selectedElement?.type === "shelf"
      ? layout.warehouses.find((warehouse) => warehouse.id === selectedElement.warehouseId) || null
      : null;
  const caseTypes = useMemo(() => {
    const values = new Set(boxes.map((box) => box.caseType).filter((value): value is string => Boolean(value)));
    return Array.from(values).sort((a, b) => a.localeCompare(b, "vi"));
  }, [boxes]);
  const boxCount = boxes.length;
  const shelfCount = layout.warehouses.reduce((sum, warehouse) => sum + warehouse.shelves.length, 0);
  const selectedShelfBoxes =
    selectedElement?.type === "shelf"
      ? occupancyMap.get(getShelfMapKey(selectedElement.warehouseId, selectedElement.id))?.boxes || []
      : [];

  useEffect(() => {
    setLayout(mergedLayout);
    setSelectedElement(null);
    setIsDirty(false);
  }, [mergedLayout]);

  useEffect(() => {
    let animationFrame = 0;
    const animate = () => {
      setPulseScale((current) => {
        const next = current + 0.04;
        return next > 2 ? 1 : next;
      });
      setLineDashOffset((current) => (current - 0.75) % 24);
      animationFrame = window.requestAnimationFrame(animate);
    };
    animationFrame = window.requestAnimationFrame(animate);
    return () => window.cancelAnimationFrame(animationFrame);
  }, []);

  const handleChangeLayout = useCallback((nextLayout: StorageLayoutData) => {
    setLayout(nextLayout);
    setIsDirty(getStorageLayoutSignature(nextLayout) !== getStorageLayoutSignature(mergedLayout));
  }, [mergedLayout]);

  const handleSave = async () => {
    try {
      const saved = await saveLayout.mutateAsync(layout);
      setLayout(saved);
      setIsDirty(false);
      toast.success("Đã lưu sơ đồ kho");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không lưu được sơ đồ kho");
    }
  };

  const handleAddWarehouse = () => {
    const warehouse = createWarehouse(layout);
    handleChangeLayout({ ...layout, warehouses: [...layout.warehouses, warehouse] });
    setSelectedElement({ type: "warehouse", id: warehouse.id });
    setIsEditMode(true);
  };

  const handleAddShelf = () => {
    const targetWarehouse = selectedWarehouse || layout.warehouses[0];
    if (!targetWarehouse) {
      toast.warning("Chưa có kho để thêm kệ");
      return;
    }
    const shelf = createShelf(targetWarehouse);
    handleChangeLayout(updateWarehouse(layout, targetWarehouse.id, {
      ...targetWarehouse,
      shelves: [...targetWarehouse.shelves, shelf],
    }));
    setSelectedElement({ type: "shelf", warehouseId: targetWarehouse.id, id: shelf.id });
    setIsEditMode(true);
  };

  const handleDeleteSelected = () => {
    if (!selectedElement) return;
    if (selectedElement.type === "warehouse") {
      handleChangeLayout({ ...layout, warehouses: layout.warehouses.filter((warehouse) => warehouse.id !== selectedElement.id) });
    } else {
      handleChangeLayout({
        ...layout,
        warehouses: layout.warehouses.map((warehouse) => (
          warehouse.id === selectedElement.warehouseId
            ? { ...warehouse, shelves: warehouse.shelves.filter((shelf) => shelf.id !== selectedElement.id) }
            : warehouse
        )),
      });
    }
    setSelectedElement(null);
  };

  const handleUpdateSelected = (field: string, value: string | number | null) => {
    if (!selectedElement) return;
    if (selectedElement.type === "warehouse") {
      const warehouse = layout.warehouses.find((item) => item.id === selectedElement.id);
      if (!warehouse) return;
      handleChangeLayout(updateWarehouse(layout, warehouse.id, { ...warehouse, [field]: value }));
      return;
    }
    const warehouse = layout.warehouses.find((item) => item.id === selectedElement.warehouseId);
    if (!warehouse) return;
    handleChangeLayout(updateWarehouse(layout, warehouse.id, {
      ...warehouse,
      shelves: warehouse.shelves.map((shelf) => (
        shelf.id === selectedElement.id ? { ...shelf, [field]: value } : shelf
      )),
    }));
  };

  const handleExportJSON = () => {
    const dataUrl = `data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(layout, null, 2))}`;
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = "storage-layout.json";
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handleImportJSON = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed: unknown = JSON.parse(String(reader.result || ""));
        if (!isStorageLayoutData(parsed)) {
          toast.error("Tệp sơ đồ không đúng định dạng");
          return;
        }
        handleChangeLayout(mergeStorageLayout(boxes, parsed));
        toast.success("Đã nhập sơ đồ kho");
      } catch {
        toast.error("Không đọc được tệp JSON");
      }
    };
    reader.readAsText(file);
  };

  const handlePrintSelectedShelf = () => {
    if (selectedShelfBoxes.length === 0) {
      toast.warning("Kệ đang chọn chưa có hộp để in nhãn");
      return;
    }
    setLabelPreviewBoxes(selectedShelfBoxes);
  };

  const getBoxQrDataUrl = (box: StorageBoxDto) => {
    const canvas = document.getElementById(`storage-layout-qr-${box.id}`) as HTMLCanvasElement | null;
    return canvas?.toDataURL("image/png") || null;
  };

  const handlePrintLabels = () => {
    const items: StorageBoxLabelPrintItem[] = labelPreviewBoxes.flatMap((box) => {
      const qrDataUrl = getBoxQrDataUrl(box);
      if (!qrDataUrl) return [];
      return [{ box, qrDataUrl, qrUrl: getBoxQrUrl(box) }];
    });
    if (items.length === 0) {
      toast.error("Chưa tạo được ảnh QR");
      return;
    }
    if (!printStorageBoxLabels(items, items.length === 1 ? "single" : "grid")) {
      toast.error("Không mở được cửa sổ in");
    }
  };

  if (isLoadingLayout) {
    return <Skeleton className="h-[640px] w-full rounded-xl" />;
  }

  return (
    <div className="storage-animate-fade-in overflow-hidden rounded-xl border bg-slate-50 text-slate-800 shadow-sm dark:bg-slate-950 dark:text-slate-100">
      <div className="border-b bg-white px-4 py-3 dark:bg-slate-900">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-600 text-white shadow-sm">
              <Warehouse className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="truncate text-base font-semibold">Storage Canvas</h2>
                <span className="rounded-full border bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">Konva Layout</span>
                {isDirty && <span className="animate-pulse rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">Chưa lưu</span>}
              </div>
              <p className="text-xs text-slate-500">
                {layout.warehouses.length} kho · {shelfCount} kệ · {boxCount} hộp · {Math.round(transform.k * 100)}%
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant={isEditMode ? "default" : "outline"} size="sm" onClick={() => setIsEditMode((current) => !current)}>
              <MousePointer2 className="h-4 w-4" />
              {isEditMode ? "Đang sửa" : "Sửa"}
            </Button>
            <Button type="button" variant={isPanMode ? "default" : "outline"} size="sm" onClick={() => setIsPanMode((current) => !current)}>
              <Move className="h-4 w-4" />
              Pan
            </Button>
            <Button type="button" size="sm" onClick={handleSave} disabled={!isDirty || saveLayout.isPending} className={cn(!isDirty && "opacity-70")}>
              {saveLayout.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Lưu sơ đồ
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 p-4 xl:grid-cols-12">
        <aside className="space-y-4 xl:col-span-4">
          <section className="storage-animate-fade-in rounded-xl border bg-white p-4 shadow-sm dark:bg-slate-900">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold">Tra cứu hồ sơ</div>
                <div className="text-xs text-slate-500">
                  {canvasSearchResults.isActive ? `${canvasSearchResults.boxes.length} hộp phù hợp` : "Tìm theo dữ liệu hộp hiện có"}
                </div>
              </div>
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input className="h-9 pl-9" placeholder="Mã hộp / QR" value={canvasSearch.code} onChange={(event) => setCanvasSearch((current) => ({ ...current, code: event.target.value }))} />
              </div>
              <Input className="h-9" placeholder="Phông lưu trữ" value={canvasSearch.fond} onChange={(event) => setCanvasSearch((current) => ({ ...current, fond: event.target.value }))} />
              <select
                className="h-9 rounded-xl border border-input bg-background px-3 text-sm"
                value={canvasSearch.caseType}
                onChange={(event) => setCanvasSearch((current) => ({ ...current, caseType: event.target.value }))}
              >
                <option value="">Tất cả loại hồ sơ</option>
                {caseTypes.map((caseType) => (
                  <option key={caseType} value={caseType}>{caseType}</option>
                ))}
              </select>
              <Input className="h-9" placeholder="Số hồ sơ lẻ" value={canvasSearch.documentNumber} onChange={(event) => setCanvasSearch((current) => ({ ...current, documentNumber: event.target.value }))} />
            </div>
            {canvasSearchResults.isActive && (
              <div className="storage-animate-fade-in mt-3 space-y-3">
                <div className="relative flex h-24 items-center justify-center overflow-hidden rounded-xl border border-violet-200 bg-slate-950">
                  <div className="absolute inset-4 rounded border-2 border-dashed border-violet-400/40" />
                  <div className="storage-animate-scan-laser absolute left-0 h-0.5 w-full bg-violet-400 shadow-[0_0_12px_#8b5cf6]" />
                  <span className="font-mono text-xs font-semibold tracking-wider text-violet-300 animate-pulse">SCANNING...</span>
                </div>
                <div className="max-h-44 space-y-2 overflow-auto">
                  {canvasSearchResults.boxes.slice(0, 8).map((box) => (
                    <button
                      key={box.id}
                      type="button"
                      className="flex w-full items-center justify-between gap-3 rounded-lg border bg-slate-50 px-3 py-2 text-left text-xs transition-all hover:-translate-y-0.5 hover:border-sky-300 hover:bg-sky-50 hover:shadow-sm dark:bg-slate-950 dark:hover:bg-slate-900"
                      onClick={() => {
                        const warehouse = layout.warehouses.find((item) => item.id === box.warehouse);
                        const shelf = warehouse?.shelves.find((item) => item.id === getStorageShelfId(box));
                        if (warehouse && shelf) setSelectedElement({ type: "shelf", warehouseId: warehouse.id, id: shelf.id });
                      }}
                    >
                      <span className="min-w-0">
                        <span className="block truncate font-mono font-semibold text-sky-700">{box.code}</span>
                        <span className="block truncate text-slate-500">{[box.warehouse, box.line, box.shelf].filter(Boolean).join(" / ")}</span>
                      </span>
                      <span className="shrink-0 text-slate-400">{box.year || "-"}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </section>

          <section className="storage-animate-fade-in rounded-xl border bg-white p-4 shadow-sm dark:bg-slate-900">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold">Thiết kế mặt bằng</div>
                <div className="text-xs text-slate-500">Kho, kệ và tệp layout JSON</div>
              </div>
              <MapPinned className="h-4 w-4 text-slate-400" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button type="button" variant="outline" size="sm" onClick={handleAddWarehouse}>
                <Plus className="h-4 w-4" />
                Thêm kho
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={handleAddShelf} disabled={layout.warehouses.length === 0}>
                <Box className="h-4 w-4" />
                Thêm kệ
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={handleExportJSON}>
                <Download className="h-4 w-4" />
                Xuất JSON
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                <Upload className="h-4 w-4" />
                Nhập JSON
              </Button>
            </div>
            <input ref={fileInputRef} type="file" accept="application/json,.json" className="hidden" onChange={handleImportJSON} />
          </section>

          <section className="storage-animate-fade-in rounded-xl border bg-white p-4 shadow-sm dark:bg-slate-900">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div>
                <div className="text-sm font-semibold">Thuộc tính đối tượng</div>
                <div className="text-xs text-slate-500">{selectedElement ? "Đang chọn trên canvas" : "Chưa chọn đối tượng"}</div>
              </div>
              <Button type="button" variant="ghost" size="icon-xs" onClick={handleDeleteSelected} disabled={!selectedElement} title="Xóa đối tượng">
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>

            {selectedElement && selectedObject ? (
              <div className="storage-animate-fade-in space-y-3">
                <Input value={selectedObject.id} disabled className="h-8 font-mono text-xs" />
                <Input value={selectedObject.name} className="h-8" onChange={(event) => handleUpdateSelected("name", event.target.value)} />
                {selectedElement.type === "shelf" && "row" in selectedObject && (
                  <Input value={selectedObject.row} className="h-8" onChange={(event) => handleUpdateSelected("row", event.target.value)} />
                )}
                <div className="grid grid-cols-4 gap-2">
                  <Input aria-label="X" type="number" value={selectedObject.x} className="h-8" onChange={(event) => handleUpdateSelected("x", Number(event.target.value) || 0)} />
                  <Input aria-label="Y" type="number" value={selectedObject.y} className="h-8" onChange={(event) => handleUpdateSelected("y", Number(event.target.value) || 0)} />
                  <Input aria-label="W" type="number" value={selectedObject.w} className="h-8" onChange={(event) => handleUpdateSelected("w", Math.max(1, Number(event.target.value) || 1))} />
                  <Input aria-label="H" type="number" value={selectedObject.h} className="h-8" onChange={(event) => handleUpdateSelected("h", Math.max(1, Number(event.target.value) || 1))} />
                </div>
                {selectedElement.type === "shelf" && (
                  <Button type="button" variant="outline" size="sm" onClick={handlePrintSelectedShelf} disabled={selectedShelfBoxes.length === 0}>
                    <QrCode className="h-4 w-4" />
                    In nhãn kệ ({selectedShelfBoxes.length})
                  </Button>
                )}
              </div>
            ) : (
              <div className="rounded-lg bg-slate-50 p-4 text-center text-xs text-slate-500 dark:bg-slate-950">Chọn kho hoặc kệ để chỉnh kích thước</div>
            )}
          </section>
        </aside>

        <main className="space-y-4 xl:col-span-8">
          <div className="storage-animate-fade-in relative min-h-[660px] overflow-hidden rounded-2xl border bg-white shadow-sm dark:bg-slate-900">
            <div className="pointer-events-none absolute left-4 top-4 z-10 rounded-xl border bg-white/90 px-3 py-2 text-xs shadow-sm backdrop-blur dark:bg-slate-900/90">
              <div className="flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-100">
                <span className={cn("h-2.5 w-2.5 rounded-full", isEditMode ? "animate-pulse bg-emerald-500" : "bg-sky-500")} />
                {is25DMode ? "Mặt bằng 2.5D" : "Mặt bằng 2D"}
              </div>
              <div className="text-slate-500">{isEditMode ? "Sửa layout" : "Xem layout"} · {isHeatmapMode ? "Heatmap" : "Màu trạng thái"}</div>
            </div>

            <div className="absolute right-4 top-4 z-10 flex flex-wrap justify-end gap-2">
              <Button type="button" variant={isHeatmapMode ? "default" : "outline"} size="icon-sm" onClick={() => setIsHeatmapMode((current) => !current)} title="Mật độ">
                <Flame className="h-4 w-4" />
              </Button>
              <Button type="button" variant={is25DMode ? "default" : "outline"} size="icon-sm" onClick={() => setIs25DMode((current) => !current)} title="2.5D">
                <Layers3 className="h-4 w-4" />
              </Button>
              <Button type="button" variant={isPathfindingActive ? "default" : "outline"} size="icon-sm" onClick={() => setIsPathfindingActive((current) => !current)} title="Chỉ đường">
                <Route className="h-4 w-4" />
              </Button>
              <Button type="button" variant="outline" size="icon-sm" onClick={() => setTransform((current) => ({ ...current, k: Math.min(current.k + 0.12, 4) }))} title="Phóng to">
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button type="button" variant="outline" size="icon-sm" onClick={() => setTransform((current) => ({ ...current, k: Math.max(current.k - 0.12, 0.55) }))} title="Thu nhỏ">
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button type="button" variant="outline" size="icon-sm" onClick={() => setTransform({ x: 0, y: 0, k: 1 })} title="Căn lại">
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>

          <CanvasBoard
            layout={layout}
            occupancyMap={occupancyMap}
            isEditMode={isEditMode}
            isPanMode={isPanMode}
            isHeatmapMode={isHeatmapMode}
            isHighlightActive={effectiveHighlightActive}
            is25DMode={is25DMode}
            isPathfindingActive={isPathfindingActive}
            pulseScale={pulseScale}
            lineDashOffset={lineDashOffset}
            selectedElement={selectedElement}
            transform={transform}
            onTransformChange={setTransform}
            onSelectElement={setSelectedElement}
            onChangeLayout={handleChangeLayout}
            onHoverShelf={setHoveredShelf}
          />

          {isHeatmapMode && (
            <div className="storage-animate-fade-in pointer-events-none absolute bottom-4 right-4 w-48 rounded-lg border bg-white/95 p-3 text-[10px] shadow-sm backdrop-blur dark:bg-slate-900/95">
              <div className="mb-2 font-semibold text-foreground">Thang đo dung lượng</div>
              {[
                ["#f8fafc", "0 hộp"],
                ["#dcfce7", "1-2 hộp"],
                ["#fef3c7", "3-4 hộp"],
                ["#fee2e2", "Trên 4 hộp"],
              ].map(([color, label]) => (
                <div key={label} className="flex items-center gap-2 py-0.5 text-muted-foreground">
                  <span className="h-3 w-3 rounded border" style={{ backgroundColor: color }} />
                  <span>{label}</span>
                </div>
              ))}
            </div>
          )}

          {hoveredShelf && !isEditMode && (
            <div
              className="storage-animate-scale-in pointer-events-none absolute z-20 w-80 rounded-2xl border bg-white/95 p-3 text-xs shadow-xl backdrop-blur"
              style={{
                left: Math.min(hoveredShelf.x + 16, 640),
                top: Math.max(12, hoveredShelf.y + 16),
              }}
            >
              <div className="mb-2 flex items-center justify-between border-b pb-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 truncate font-semibold">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                    {hoveredShelf.shelf.name}
                  </div>
                  <div className="truncate text-[10px] text-muted-foreground">
                    {hoveredShelf.warehouse.name} · {hoveredShelf.shelf.row}
                  </div>
                </div>
                <span className="rounded bg-muted px-2 py-0.5 text-[10px]">{hoveredShelf.occupancy?.count || 0} hộp</span>
              </div>
              <div className="max-h-44 space-y-2 overflow-auto">
                {(hoveredShelf.occupancy?.boxes || []).length > 0 ? (
                  hoveredShelf.occupancy?.boxes.map((box) => (
                    <div key={box.id} className="rounded border bg-slate-50 p-2">
                      <div className="font-mono font-semibold text-sky-700">{box.code}</div>
                      <div className="truncate text-muted-foreground">{box.agency?.name || "Chưa phân phối"}</div>
                      <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
                        <span>{box.caseType || "-"}</span>
                        <span>{box.year || "-"}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-3 text-center text-muted-foreground">Kệ trống</div>
                )}
              </div>
            </div>
          )}
          </div>

          <section className="storage-animate-fade-in rounded-xl border bg-white p-4 shadow-sm dark:bg-slate-900">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold">Phân bổ hộp theo kệ</div>
                <div className="text-xs text-slate-500">Dữ liệu đọc từ danh sách hộp, layout chỉ lưu hình học</div>
              </div>
              <Box className="h-4 w-4 text-slate-400" />
            </div>
            <div className="grid max-h-80 gap-3 overflow-auto md:grid-cols-2">
              {layout.warehouses.flatMap((warehouse) =>
                warehouse.shelves.map((shelf) => {
                  const shelfOccupancy = occupancyMap.get(getShelfMapKey(warehouse.id, shelf.id));
                  const shelfBoxes = shelfOccupancy?.boxes || [];
                  return (
                    <button
                      key={`${warehouse.id}-${shelf.id}`}
                      type="button"
                      className={cn(
                        "rounded-xl border bg-slate-50 p-3 text-left transition-all hover:-translate-y-0.5 hover:border-sky-300 hover:bg-sky-50 hover:shadow-sm dark:bg-slate-950 dark:hover:bg-slate-900",
                        selectedElement?.type === "shelf" && selectedElement.warehouseId === warehouse.id && selectedElement.id === shelf.id && "border-sky-400 bg-sky-50 dark:bg-slate-900",
                      )}
                      onClick={() => setSelectedElement({ type: "shelf", warehouseId: warehouse.id, id: shelf.id })}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold">{shelf.name}</div>
                          <div className="truncate text-xs text-slate-500">{warehouse.name} · {shelf.row}</div>
                        </div>
                        <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-600 shadow-sm dark:bg-slate-800 dark:text-slate-200">{shelfBoxes.length}</span>
                      </div>
                      <div className="mt-3 space-y-1">
                        {shelfBoxes.slice(0, 3).map((box) => (
                          <div key={box.id} className="flex items-center justify-between gap-2 rounded bg-white px-2 py-1 text-[11px] dark:bg-slate-900">
                            <span className="truncate font-mono text-sky-700">{box.code}</span>
                            <span className="shrink-0 text-slate-400">{box.year || "-"}</span>
                          </div>
                        ))}
                        {shelfBoxes.length > 3 && <div className="text-[11px] text-slate-500">+{shelfBoxes.length - 3} hộp khác</div>}
                        {shelfBoxes.length === 0 && <div className="text-[11px] text-slate-400">Kệ trống</div>}
                      </div>
                    </button>
                  );
                }),
              )}
            </div>
          </section>
        </main>
      </div>

      <div className="hidden">
        {labelPreviewBoxes.map((box) => (
          <QRCodeCanvas key={box.id} id={`storage-layout-qr-${box.id}`} value={getBoxQrUrl(box)} size={112} level="M" includeMargin />
        ))}
      </div>

      {labelPreviewBoxes.length > 0 && (
        <div className="storage-animate-fade-in fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
          <div className="storage-animate-scale-in w-full max-w-md rounded-xl border bg-background p-5 shadow-xl">
            <div className="mb-4">
              <div className="text-base font-semibold">In nhãn từ sơ đồ kho</div>
              <div className="text-sm text-muted-foreground">{labelPreviewBoxes.length} hộp trong kệ đang chọn</div>
            </div>
            <div className="max-h-56 space-y-2 overflow-auto">
              {labelPreviewBoxes.map((box) => (
                <div key={box.id} className="rounded border p-2 text-sm">
                  <div className="font-mono font-semibold">{box.code}</div>
                  <div className="text-xs text-muted-foreground">{[box.warehouse, box.line, box.shelf, box.slot, box.boxNumber].filter(Boolean).join(" - ")}</div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setLabelPreviewBoxes([])}>Đóng</Button>
              <Button type="button" onClick={handlePrintLabels}>In nhãn</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
