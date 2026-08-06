"use client";

import { useEffect, useRef, useState } from "react";
import type { TableWithStatus } from "@/types";
import { TableNode } from "./TableNode";
import { COORD_MAX } from "@/lib/constants";

interface FloorMapProps {
  tables: TableWithStatus[];
  onTableClick?: (table: TableWithStatus) => void;
}

export function FloorMap({ tables, onTableClick }: FloorMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(400);

  useEffect(() => {
    function measure() {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth);
      }
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const pixelScale = containerWidth / COORD_MAX;

  return (
    <div
      ref={containerRef}
      className="card relative w-full overflow-hidden bg-[#f5f3ee]"
      style={{ paddingBottom: "100%" }}
    >
      <div className="absolute inset-0">
        {tables.map((table) => (
          <TableNode
            key={table.id}
            table={table}
            onClick={onTableClick}
            scale={pixelScale}
          />
        ))}
      </div>
    </div>
  );
}
