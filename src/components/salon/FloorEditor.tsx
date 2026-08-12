"use client";

import { useCallback, useRef, useState } from "react";
import { Rnd } from "react-rnd";
import type { Table, TableShape } from "@/types";
import { COORD_MAX } from "@/lib/constants";

interface FloorEditorProps {
  tables: Table[];
  slug: string;
  onTablesChange: (tables: Table[]) => void;
}

export function FloorEditor({ tables, slug, onTablesChange }: FloorEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingTable, setEditingTable] = useState<Table | null>(null);

  const getContainerSize = useCallback(() => {
    if (!containerRef.current) return 600;
    return containerRef.current.clientWidth;
  }, []);

  const toPixels = useCallback((coord: number) => {
    return (coord / COORD_MAX) * getContainerSize();
  }, [getContainerSize]);

  const toCoord = useCallback((px: number) => {
    return Math.round((px / getContainerSize()) * COORD_MAX);
  }, [getContainerSize]);

  function updateTable(id: string, updates: Partial<Table>) {
    const updated = tables.map((t) =>
      t.id === id ? { ...t, ...updates } : t
    );
    onTablesChange(updated);
  }

  async function saveTable(table: Table) {
    try {
      await fetch(`/api/${slug}/tables`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(table),
      });
    } catch {
      // silently fail in demo mode
    }
  }

  async function addTable() {
    const newNumber = String(tables.length + 1);
    const newTable: Table = {
      id: `new-${Date.now()}`,
      restaurant_id: "",
      table_number: newNumber,
      x: 450,
      y: 450,
      width: 80,
      height: 80,
      shape: "square",
      capacity: 4,
      assigned_waiter_id: null,
      is_active: true,
      created_at: "",
      updated_at: "",
    };

    try {
      const res = await fetch(`/api/${slug}/tables`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTable),
      });
      if (res.ok) {
        const { table } = await res.json();
        onTablesChange([...tables, table]);
        return;
      }
    } catch {
      // demo mode fallback
    }
    onTablesChange([...tables, newTable]);
  }

  async function removeTable(id: string) {
    try {
      await fetch(`/api/${slug}/tables?id=${id}`, { method: "DELETE" });
    } catch {
      // demo mode
    }
    onTablesChange(tables.filter((t) => t.id !== id));
    setSelectedId(null);
    setEditingTable(null);
  }

  const selectedTable = tables.find((t) => t.id === selectedId);

  return (
    <div className="flex flex-col gap-4 lg:flex-row">
      {/* Canvas */}
      <div className="flex-1">
        <div
          ref={containerRef}
          className="relative bg-[#f5f3ee] border border-[#e8e6e1] rounded-xl overflow-hidden"
          style={{ aspectRatio: "1" }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedId(null);
          }}
        >
          {tables.map((table) => (
            <Rnd
              key={table.id}
              position={{
                x: toPixels(table.x),
                y: toPixels(table.y),
              }}
              size={{
                width: toPixels(table.width),
                height: toPixels(table.height),
              }}
              onDragStop={(_e, d) => {
                const updated = {
                  ...table,
                  x: toCoord(d.x),
                  y: toCoord(d.y),
                };
                updateTable(table.id, updated);
                saveTable(updated);
              }}
              onResizeStop={(_e, _dir, ref, _delta, pos) => {
                const updated = {
                  ...table,
                  x: toCoord(pos.x),
                  y: toCoord(pos.y),
                  width: toCoord(parseInt(ref.style.width)),
                  height: toCoord(parseInt(ref.style.height)),
                };
                updateTable(table.id, updated);
                saveTable(updated);
              }}
              bounds="parent"
              minWidth={40}
              minHeight={40}
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                setSelectedId(table.id);
                setEditingTable(table);
              }}
            >
              <div
                className={`flex flex-col items-center justify-center w-full h-full border-2 text-white font-bold cursor-move select-none ${
                  selectedId === table.id
                    ? "border-[#b49a5a] ring-2 ring-[#b49a5a]/30"
                    : "border-[#999]"
                }`}
                style={{
                  backgroundColor: selectedId === table.id ? "#b49a5a" : "#57534e",
                  borderRadius: table.shape === "round" ? "50%" : "6px",
                }}
              >
                <span className="text-sm leading-none">{table.table_number}</span>
                <span className="text-[9px] opacity-70">{table.capacity}p</span>
              </div>
            </Rnd>
          ))}
        </div>
      </div>

      {/* Panel lateral */}
      <div className="w-full lg:w-64 space-y-3">
        <button
          onClick={addTable}
          className="w-full rounded-xl bg-[#141414] px-4 py-3 text-sm font-semibold text-white touch-target active:bg-[#222]"
        >
          + Agregar mesa
        </button>

        {selectedTable && editingTable && (
          <div className="rounded-xl border border-[#e8e6e1] bg-white p-4 space-y-3">
            <h3 className="text-sm font-bold text-[#1a1a1a]">
              Mesa {selectedTable.table_number}
            </h3>

            <label className="block">
              <span className="text-xs text-[#999]">Número</span>
              <input
                type="text"
                value={editingTable.table_number}
                onChange={(e) =>
                  setEditingTable({ ...editingTable, table_number: e.target.value })
                }
                className="mt-1 block w-full rounded-lg border border-[#e8e6e1] px-3 py-2 text-sm"
              />
            </label>

            <label className="block">
              <span className="text-xs text-[#999]">Forma</span>
              <select
                value={editingTable.shape}
                onChange={(e) =>
                  setEditingTable({
                    ...editingTable,
                    shape: e.target.value as TableShape,
                  })
                }
                className="mt-1 block w-full rounded-lg border border-[#e8e6e1] px-3 py-2 text-sm"
              >
                <option value="square">Cuadrada</option>
                <option value="round">Redonda</option>
                <option value="rect">Rectangular</option>
              </select>
            </label>

            <label className="block">
              <span className="text-xs text-[#999]">Capacidad</span>
              <input
                type="number"
                min={1}
                max={20}
                value={editingTable.capacity}
                onChange={(e) =>
                  setEditingTable({
                    ...editingTable,
                    capacity: parseInt(e.target.value) || 1,
                  })
                }
                className="mt-1 block w-full rounded-lg border border-[#e8e6e1] px-3 py-2 text-sm"
              />
            </label>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  updateTable(editingTable.id, editingTable);
                  saveTable(editingTable);
                  setSelectedId(null);
                  setEditingTable(null);
                }}
                className="flex-1 rounded-lg bg-[#141414] px-3 py-2 text-sm font-semibold text-white touch-target"
              >
                Guardar
              </button>
              <button
                onClick={() => removeTable(selectedTable.id)}
                className="rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white touch-target"
              >
                Eliminar
              </button>
            </div>
          </div>
        )}

        {!selectedTable && (
          <p className="text-xs text-[#999] px-1">
            Arrastrá las mesas para ubicarlas. Hacé click en una para editar.
          </p>
        )}
      </div>
    </div>
  );
}
