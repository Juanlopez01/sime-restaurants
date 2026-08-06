"use client";

import type { TableWithStatus } from "@/types";
import { TABLE_STATUS_COLORS } from "@/lib/constants";

interface TableNodeProps {
  table: TableWithStatus;
  onClick?: (table: TableWithStatus) => void;
  scale: number;
}

export function TableNode({ table, onClick, scale }: TableNodeProps) {
  const statusColor = table.has_open_bill
    ? TABLE_STATUS_COLORS.open_bill
    : table.current_order
      ? TABLE_STATUS_COLORS.has_order
      : TABLE_STATUS_COLORS.free;

  const isRound = table.shape === "round";
  const w = table.width * scale;
  const h = table.height * scale;

  return (
    <button
      onClick={() => onClick?.(table)}
      className="absolute flex flex-col items-center justify-center text-white font-bold shadow-lg transition-transform active:scale-95 touch-target"
      style={{
        left: table.x * scale,
        top: table.y * scale,
        width: w,
        height: h,
        backgroundColor: statusColor,
        borderRadius: isRound ? "50%" : "12px",
        minWidth: 44,
        minHeight: 44,
        boxShadow: `0 2px 8px ${statusColor}40`,
      }}
    >
      <span className="text-lg leading-none font-bold">{table.table_number}</span>
      <span className="text-[10px] opacity-70 mt-0.5">{table.capacity}p</span>
    </button>
  );
}
