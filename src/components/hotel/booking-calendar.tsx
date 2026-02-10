import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@heroui/button";
// native table used for colspan control

import type { BookingApi, RoomApi } from "@/lib/hotel-api";

type Props = {
  rooms: RoomApi[];
  bookings: BookingApi[];
  initialMonth?: string;
  days?: number;
  rowHeight?: number;
  onRangeSelect?: (roomNumber: string, startDate: string, endDate: string) => void;
  onBack?: () => void;
  onBookingSelect?: (booking: BookingApi) => void;
  onBookingMove?: (booking: BookingApi, targetRoomNumber: string) => void;
  onBookingContextMenu?: (booking: BookingApi, x: number, y: number) => void;
};

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function toYMD(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function parseYMD(ymd: string) {
  const [y, m, d] = ymd.split("-").map((x) => Number(x));
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

function addMonths(d: Date, delta: number) {
  return new Date(d.getFullYear(), d.getMonth() + delta, 1);
}

function surnameFromBooking(b: BookingApi): string {
  if (b.guestFullName) {
    const parts = b.guestFullName.trim().split(/\s+/);
    return parts[parts.length - 1] ?? "";
  }
  return b.guestUsername || "";
}

function getBookingColor(b: BookingApi) {
  if (b.status === "ARRIVED" || b.status === "CONFIRMED") return "bg-red-200";
  if (b.status === "INSERTED") return "bg-amber-200";
  return "bg-default-200";
}

function formatTreatment(treatment: BookingApi["treatment"]) {
  if (treatment === "ROOM_BREAKFAST") return "B&B";
  if (treatment === "HALF_BOARD") return "Mezza pensione";
  return "Pensione completa";
}

function HalfDiamond({ side, className }: { side: "left" | "right"; className: string }) {
  const style: React.CSSProperties =
    side === "left"
      ? {
          clipPath: "polygon(0% 50%, 100% 0%, 100% 100%)",
          width: "55%",
          right: 0,
          pointerEvents: "none",
        }
      : {
          clipPath: "polygon(100% 50%, 0% 0%, 0% 100%)",
          width: "55%",
          left: 0,
          pointerEvents: "none",
        };

  return (
    <div
      className={["absolute top-0 bottom-0", "opacity-90", className].join(" ")}
      style={style}
      aria-hidden="true"
    />
  );
}

export default function BookingCalendar({
  rooms,
  bookings,
  initialMonth,
  days,
  rowHeight = 24,
  onRangeSelect,
  onBack,
  onBookingSelect,
  onBookingMove,
  onBookingContextMenu,
}: Props) {
  const [selection, setSelection] = useState<{
    roomNumber: string;
    startIndex: number;
    endIndex: number;
  } | null>(null);

  const [hoverLineLeft, setHoverLineLeft] = useState<number | null>(null);
  const [headerHeight, setHeaderHeight] = useState(0);
  const [dragGhost, setDragGhost] = useState<{
    booking: BookingApi;
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const [bookingTooltip, setBookingTooltip] = useState<{
    booking: BookingApi;
    x: number;
    y: number;
  } | null>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [dragOverRoom, setDragOverRoom] = useState<string | null>(null);

  const selectionRef = useRef<{
    roomNumber: string;
    startIndex: number;
    endIndex: number;
  } | null>(null);
  const draggingRef = useRef(false);
  const bookingDragRef = useRef<{
    booking: BookingApi;
    startX: number;
    startY: number;
    hasMoved: boolean;
  } | null>(null);
  const bookingDragMovedRef = useRef(false);
  const dragOverRoomRef = useRef<string | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const tableRef = useRef<HTMLTableElement | null>(null);

  const initial = useMemo(() => {
    if (initialMonth && /^\d{4}-\d{2}$/.test(initialMonth)) {
      const [y, m] = initialMonth.split("-").map(Number);
      return new Date(y, (m ?? 1) - 1, 1);
    }
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }, [initialMonth]);

  const [month, setMonth] = useState<Date>(initial);

  const monthStart = useMemo(() => startOfMonth(month), [month]);
  const monthEnd = useMemo(() => endOfMonth(month), [month]);

  const daysInMonth = useMemo(() => {
    const res: Date[] = [];
    const d = new Date(monthStart);
    if (days && days > 0) {
      for (let i = 0; i < days; i += 1) {
        const day = new Date(monthStart);
        day.setDate(monthStart.getDate() + i);
        res.push(day);
      }
      return res;
    }
    while (d.getTime() <= monthEnd.getTime()) {
      res.push(new Date(d));
      d.setDate(d.getDate() + 1);
    }
    return res;
  }, [monthStart, monthEnd, days]);

  const monthLabel = useMemo(() => {
    return month.toLocaleDateString("it-IT", { month: "long", year: "numeric" });
  }, [month]);

  const bookingsByRoom = useMemo(() => {
    const map = new Map<string, BookingApi[]>();
    for (const r of rooms) map.set(r.roomNumber, []);
    for (const b of bookings) {
      if (!b.roomNumber) continue;
      if (!map.has(b.roomNumber)) map.set(b.roomNumber, []);
      map.get(b.roomNumber)!.push(b);
    }
    return map;
  }, [bookings, rooms]);

  const dayIndexByYmd = useMemo(() => {
    return new Map(daysInMonth.map((day, index) => [toYMD(day), index]));
  }, [daysInMonth]);

  const bookingStartsByRoom = useMemo(() => {
    const map = new Map<string, number[]>();
    const firstDay = daysInMonth[0];
    const lastDay = daysInMonth[daysInMonth.length - 1];

    rooms.forEach((room) => map.set(room.roomNumber, []));
    bookings.forEach((booking) => {
      if (!booking.roomNumber) return;
      const startDate = parseYMD(booking.checkInDate);
      const endDate = parseYMD(booking.checkOutDate);
      if (endDate < firstDay || startDate > lastDay) return;

      const startKey = toYMD(startDate);
      const rawStart = dayIndexByYmd.get(startKey);
      const clampedStart = startDate < firstDay ? 0 : rawStart ?? 0;

      if (!map.has(booking.roomNumber)) map.set(booking.roomNumber, []);
      map.get(booking.roomNumber)!.push(clampedStart);
    });

    map.forEach((starts, roomNumber) => {
      const unique = Array.from(new Set(starts)).sort((a, b) => a - b);
      map.set(roomNumber, unique);
    });

    return map;
  }, [bookings, dayIndexByYmd, daysInMonth, rooms]);

  const bookingEndsByRoom = useMemo(() => {
    const map = new Map<string, number[]>();
    const firstDay = daysInMonth[0];
    const lastDay = daysInMonth[daysInMonth.length - 1];

    rooms.forEach((room) => map.set(room.roomNumber, []));
    bookings.forEach((booking) => {
      if (!booking.roomNumber) return;
      const startDate = parseYMD(booking.checkInDate);
      const endDate = parseYMD(booking.checkOutDate);
      if (endDate < firstDay || startDate > lastDay) return;

      const endKey = toYMD(endDate);
      const rawEnd = dayIndexByYmd.get(endKey);
      const clampedEnd = endDate > lastDay ? daysInMonth.length - 1 : rawEnd ?? daysInMonth.length - 1;

      if (!map.has(booking.roomNumber)) map.set(booking.roomNumber, []);
      map.get(booking.roomNumber)!.push(clampedEnd);
    });

    map.forEach((ends, roomNumber) => {
      const unique = Array.from(new Set(ends)).sort((a, b) => a - b);
      map.set(roomNumber, unique);
    });

    return map;
  }, [bookings, dayIndexByYmd, daysInMonth, rooms]);

  const clampSelectionIndex = useCallback(
    (roomNumber: string, startIndex: number, targetIndex: number) => {
      if (targetIndex === startIndex) return targetIndex;

      if (targetIndex > startIndex) {
        const starts = bookingStartsByRoom.get(roomNumber) ?? [];
        const nextStart = starts.find((index) => index >= startIndex);
        if (nextStart !== undefined && targetIndex > nextStart) return nextStart;
        return targetIndex;
      }

      const ends = bookingEndsByRoom.get(roomNumber) ?? [];
      const previousEnd = [...ends].reverse().find((index) => index <= startIndex);
      if (previousEnd !== undefined && targetIndex < previousEnd) return previousEnd;
      return targetIndex;
    },
    [bookingEndsByRoom, bookingStartsByRoom]
  );

  const beginSelection = useCallback((roomNumber: string, index: number) => {
    if (bookingDragRef.current) return;
    draggingRef.current = true;
    setIsDragging(true);

    const next = { roomNumber, startIndex: index, endIndex: index };
    selectionRef.current = next;
    setSelection(next);
    console.debug("[calendar] beginSelection", next);
  }, []);

  const updateSelection = useCallback((roomNumber: string, index: number) => {
    if (!draggingRef.current) return;
    const cur = selectionRef.current;
    if (!cur || cur.roomNumber !== roomNumber) return;

    const clampedIndex = clampSelectionIndex(roomNumber, cur.startIndex, index);
    if (cur.endIndex === clampedIndex) return; // evita setState inutili
    const next = { ...cur, endIndex: clampedIndex };
    selectionRef.current = next;
    setSelection(next);
    console.debug("[calendar] updateSelection", next);
  }, [clampSelectionIndex]);

  const endSelection = useCallback(() => {
    const cur = selectionRef.current;

    // reset sempre lo stato di drag
    draggingRef.current = false;
    setIsDragging(false);
    selectionRef.current = null;
    setSelection(null);

    if (!cur) return;

    const start = Math.min(cur.startIndex, cur.endIndex);
    const end = Math.max(cur.startIndex, cur.endIndex);

    const startDate = daysInMonth[start] ? toYMD(daysInMonth[start]) : undefined;
    const endDate = daysInMonth[end] ? toYMD(daysInMonth[end]) : undefined;

    if (startDate && endDate && onRangeSelect) {
      console.debug("[calendar] endSelection", {
        roomNumber: cur.roomNumber,
        startDate,
        endDate,
      });
      onRangeSelect(cur.roomNumber, startDate, endDate);
    }
  }, [daysInMonth, onRangeSelect]);

  const beginBookingDrag = useCallback((booking: BookingApi, event: React.PointerEvent) => {
    bookingDragMovedRef.current = false;
    bookingDragRef.current = {
      booking,
      startX: event.clientX,
      startY: event.clientY,
      hasMoved: false,
    };
    setBookingTooltip(null);
    const scrollContainer = containerRef.current;
    if (scrollContainer) {
      const rect = scrollContainer.getBoundingClientRect();
      const left = event.clientX - rect.left + scrollContainer.scrollLeft;
      const top = event.clientY - rect.top + scrollContainer.scrollTop;
      setDragGhost({
        booking,
        x: left + 6,
        y: top - rowHeight / 2,
        width: 160,
        height: rowHeight,
      });
    }
    dragOverRoomRef.current = booking.roomNumber;
    setDragOverRoom(booking.roomNumber);
  }, [rowHeight]);

  const endBookingDrag = useCallback(() => {
    const drag = bookingDragRef.current;
    if (!drag) return;
    const targetRoom = dragOverRoomRef.current;
    bookingDragRef.current = null;
    dragOverRoomRef.current = null;
    setDragOverRoom(null);
    setDragGhost(null);

    if (!drag.hasMoved) return;
    bookingDragMovedRef.current = true;
    if (!targetRoom || targetRoom === drag.booking.roomNumber) return;
    onBookingMove?.(drag.booking, targetRoom);
  }, [dragOverRoom, onBookingMove]);

  useEffect(() => {
    if (!isDragging) return;
    const handleUp = () => endSelection();
    window.addEventListener("mouseup", handleUp);
    return () => window.removeEventListener("mouseup", handleUp);
  }, [endSelection, isDragging]);

  useEffect(() => {
    const handleUp = () => {
      if (bookingDragRef.current) endBookingDrag();
    };
    window.addEventListener("mouseup", handleUp);
    return () => window.removeEventListener("mouseup", handleUp);
  }, [endBookingDrag]);

  useEffect(() => {
    const updateHeaderHeight = () => {
      const rect = tableRef.current?.querySelector("thead")?.getBoundingClientRect();
      setHeaderHeight(rect?.height ?? 0);
    };
    updateHeaderHeight();
    window.addEventListener("resize", updateHeaderHeight);
    return () => window.removeEventListener("resize", updateHeaderHeight);
  }, [daysInMonth.length]);

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLTableElement>) => {
      const el = document.elementFromPoint(event.clientX, event.clientY);
      const headerCells = tableRef.current?.querySelectorAll<HTMLElement>("thead th[data-index]");
      const headerCell = el?.closest<HTMLElement>("thead th[data-index]");
      if (headerCell) {
        const left = headerCell.offsetLeft + headerCell.offsetWidth / 2;
        setHoverLineLeft(left);
      }

      if (bookingDragRef.current) {
        const drag = bookingDragRef.current;
        const moved = Math.abs(event.clientX - drag.startX) + Math.abs(event.clientY - drag.startY) > 4;
        if (moved && !drag.hasMoved) {
          bookingDragRef.current = { ...drag, hasMoved: true };
        }
        const scrollContainer = containerRef.current;
        if (scrollContainer) {
          const rect = scrollContainer.getBoundingClientRect();
          const threshold = 40;
          const speed = 18;
          if (event.clientY < rect.top + threshold) {
            scrollContainer.scrollTop -= speed;
          } else if (event.clientY > rect.bottom - threshold) {
            scrollContainer.scrollTop += speed;
          }
          const left = event.clientX - rect.left + scrollContainer.scrollLeft;
          const top = event.clientY - rect.top + scrollContainer.scrollTop;
          setDragGhost((prev) =>
            prev
              ? { ...prev, x: left + 6, y: top - rowHeight / 2 }
              : {
                  booking: drag.booking,
                  x: left + 6,
                  y: top - rowHeight / 2,
                  width: 160,
                  height: rowHeight,
                }
          );
        }
        const cell = el?.closest<HTMLElement>("[data-room]");
        if (cell) {
          const roomNumber = cell.dataset.room;
          if (roomNumber) {
            dragOverRoomRef.current = roomNumber;
            setDragOverRoom(roomNumber);
          }
        }
        return;
      }

      const cell = el?.closest<HTMLElement>("[data-room][data-index]");
      if (!cell) return;
      const roomNumber = cell.dataset.room;
      const index = cell.dataset.index ? Number(cell.dataset.index) : NaN;
      if (!roomNumber || Number.isNaN(index)) return;

      if (headerCells?.length) {
        const header = tableRef.current?.querySelector<HTMLElement>(`thead th[data-index="${index}"]`);
        if (header) {
          const left = header.offsetLeft + header.offsetWidth / 2;
          setHoverLineLeft(left);
        }
      }

      if (draggingRef.current) {
        updateSelection(roomNumber, index);
      }
    },
    [updateSelection]
  );

  const showBookingTooltip = useCallback(
    (booking: BookingApi, target: HTMLElement) => {
      if (bookingDragRef.current) return;
      const containerRect = containerRef.current?.getBoundingClientRect();
      if (!containerRect) return;
      const rect = target.getBoundingClientRect();
      const x = rect.left - containerRect.left + rect.width / 2;
      const y = rect.top - containerRect.top - 8;
      setBookingTooltip({ booking, x, y });
    },
    []
  );

  const hideBookingTooltip = useCallback(() => {
    setBookingTooltip(null);
  }, []);

  return (
    <div className="w-full">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="text-lg font-semibold capitalize">{monthLabel}</div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="flat" onPress={() => setMonth((m) => addMonths(m, -1))}>
            ←
          </Button>
          <Button size="sm" variant="flat" onPress={() => setMonth((m) => addMonths(m, 1))}>
            →
          </Button>
          {onBack && (
            <Button size="sm" variant="flat" onPress={onBack}>
              Torna alla griglia
            </Button>
          )}
        </div>
      </div>

      <div className="relative max-h-[70vh] overflow-auto" ref={containerRef}>
        <div className="relative">
          {dragGhost && (
            <div
              className="pointer-events-none absolute z-30"
              style={{
                left: dragGhost.x,
                top: dragGhost.y,
                width: dragGhost.width,
                height: dragGhost.height,
              }}
              aria-hidden="true"
            >
              <div className="flex h-full items-center rounded-md border border-primary-300 bg-primary-200/90 px-2 text-[11px] font-semibold text-foreground shadow-lg ring-1 ring-primary-200/60">
                {surnameFromBooking(dragGhost.booking)}
              </div>
            </div>
          )}
          {bookingTooltip && !bookingDragRef.current && (
            <div
              className="pointer-events-none absolute z-30 -translate-x-1/2 -translate-y-full"
              style={{ left: bookingTooltip.x, top: bookingTooltip.y }}
              aria-hidden="true"
            >
              <div className="rounded-md border border-default-200 bg-white px-3 py-2 text-[11px] shadow-lg">
                <div className="text-xs font-semibold">Camera {bookingTooltip.booking.roomNumber}</div>
                <div className="mt-1 flex gap-2 text-[10px] text-default-600">
                  <span>A {bookingTooltip.booking.adults}</span>
                  <span>B {bookingTooltip.booking.children}</span>
                  <span>I {bookingTooltip.booking.infants}</span>
                </div>
                <div className="mt-1 text-[10px] text-default-600">
                  {formatTreatment(bookingTooltip.booking.treatment)}
                </div>
              </div>
            </div>
          )}
          {hoverLineLeft !== null && (
            <div
              className="pointer-events-none absolute bottom-0 z-10 w-px bg-red-400"
              style={{ left: hoverLineLeft, top: headerHeight }}
              aria-hidden="true"
            />
          )}
          <table
            ref={tableRef}
            className="w-full table-fixed border-collapse"
            aria-label="Calendario prenotazioni"
            onPointerMove={handlePointerMove}
            // se esci dalla tabella mentre trascini, chiude comunque la selezione
            onPointerLeave={() => {
              if (draggingRef.current) endSelection();
              setHoverLineLeft(null);
              if (bookingDragRef.current) endBookingDrag();
              hideBookingTooltip();
            }}
            onPointerUp={() => {
              if (draggingRef.current) endSelection();
              if (bookingDragRef.current) endBookingDrag();
            }}
          >
        <thead className="bg-default-50 border-t border-default-200">
          <tr>
            <th className="sticky top-0 z-20 w-[180px] border border-default-200 bg-default-50 px-2 py-1 text-left text-sm font-semibold shadow-[inset_-1px_0_0_rgba(0,0,0,0.08),inset_0_-1px_0_rgba(0,0,0,0.08)]">
              Camera
            </th>
            {daysInMonth.map((d, index) => {
              const ymd = toYMD(d);
              const dow = d.toLocaleDateString("it-IT", { weekday: "short" });
              const dd = d.getDate();
              const isSaturday = d.getDay() === 6;
              const isSunday = d.getDay() === 0;
              const weekendClass = isSunday ? "bg-red-50" : isSaturday ? "bg-default-100" : "";
              return (
                <th
                  key={ymd}
                  className={`sticky top-0 z-20 min-w-[44px] border border-default-200 bg-default-50 px-1 py-1 text-center ${weekendClass} shadow-[inset_-1px_0_0_rgba(0,0,0,0.08),inset_0_-1px_0_rgba(0,0,0,0.08)]`}
                  data-index={index}
                >
                  <div className="flex flex-col items-center leading-tight">
                    <div className="text-[10px] text-foreground/60">{dow}</div>
                    <div className="text-sm font-semibold">{dd}</div>
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>

        <tbody>
          {rooms.map((room) => {
            const roomBookings = bookingsByRoom.get(room.roomNumber) ?? [];
            const firstDay = daysInMonth[0];
            const lastDay = daysInMonth[daysInMonth.length - 1];

            const ranges = roomBookings
              .map((booking) => {
                const startDate = parseYMD(booking.checkInDate);
                const endDate = parseYMD(booking.checkOutDate);
                if (endDate < firstDay || startDate > lastDay) return null;

                const startKey = toYMD(startDate);
                const endKey = toYMD(endDate);
                const rawStart = dayIndexByYmd.get(startKey);
                const rawEnd = dayIndexByYmd.get(endKey);

                const clampedStart = startDate < firstDay ? 0 : rawStart ?? 0;
                const clampedEnd = endDate > lastDay ? daysInMonth.length - 1 : rawEnd ?? daysInMonth.length - 1;

                return {
                  booking,
                  start: clampedStart,
                  end: clampedEnd,
                  surname: surnameFromBooking(booking),
                  colorClassName: getBookingColor(booking),
                };
              })
              .filter((item): item is NonNullable<typeof item> => Boolean(item))
              .sort((a, b) => a.start - b.start);

            const occupied = new Set<number>();
            const startsAt = new Map<number, typeof ranges>();
            const endsAt = new Map<number, typeof ranges>();
            const middleStartsAt = new Map<number, (typeof ranges)[number]>();

            ranges.forEach((range) => {
              for (let i = range.start; i < range.end; i += 1) occupied.add(i);

              const starts = startsAt.get(range.start) ?? [];
              starts.push(range);
              startsAt.set(range.start, starts);

              const ends = endsAt.get(range.end) ?? [];
              ends.push(range);
              endsAt.set(range.end, ends);

              if (range.end - range.start > 1) {
                middleStartsAt.set(range.start + 1, range);
              }
            });

            const cells: JSX.Element[] = [];
            let dayIndex = 0;

            while (dayIndex < daysInMonth.length) {
              const startRanges = startsAt.get(dayIndex) ?? [];
              const endRanges = endsAt.get(dayIndex) ?? [];
              const middleRange = middleStartsAt.get(dayIndex);

              if (startRanges.length === 0 && endRanges.length === 0 && !middleRange) {
                const cellIndex = dayIndex;
                const ymd = toYMD(daysInMonth[cellIndex]);
                const isSaturday = daysInMonth[cellIndex].getDay() === 6;
                const isSunday = daysInMonth[cellIndex].getDay() === 0;
                const weekendClass = isSunday ? "bg-red-50" : isSaturday ? "bg-default-100" : "";
                const isSelected =
                  selection?.roomNumber === room.roomNumber &&
                  cellIndex >= Math.min(selection.startIndex, selection.endIndex) &&
                  cellIndex <= Math.max(selection.startIndex, selection.endIndex);

                const isBlocked = occupied.has(cellIndex);

                cells.push(
                  <td
                    key={`${room.id}-${ymd}`}
                    className={`border border-default-200 p-0 ${weekendClass} ${
                      dragOverRoom === room.roomNumber ? "ring-1 ring-primary-200" : ""
                    }`}
                    data-room={room.roomNumber}
                    data-index={cellIndex}
                    onPointerEnter={() => {
                      if (draggingRef.current && !isBlocked) {
                        updateSelection(room.roomNumber, cellIndex);
                      }
                    }}
                  >
                    <div
                      className={isSelected ? "bg-primary-100" : ""}
                      style={{ height: rowHeight, touchAction: "none" }}
                      onPointerDown={(event) => {
                        event.preventDefault();
                        if (isBlocked) return;
                        console.debug("[calendar] pointerdown", {
                          roomNumber: room.roomNumber,
                          dayIndex: cellIndex,
                        });
                        beginSelection(room.roomNumber, cellIndex);
                      }}
                      data-room={room.roomNumber}
                      data-index={cellIndex}
                      role="button"
                      tabIndex={0}
                    />
                  </td>
                );

                dayIndex += 1;
                continue;
              }

              if (startRanges.length === 0 && endRanges.length === 0 && middleRange) {
                const middleSpan = Math.max(0, middleRange.end - middleRange.start - 1);
                const middleKey = toYMD(daysInMonth[dayIndex]);

                if (middleSpan > 0) {
                  cells.push(
                    <td
                      key={`${room.id}-${middleKey}-middle`}
                      className={`border border-default-200 p-0 ${
                        dragOverRoom === room.roomNumber ? "ring-1 ring-primary-200" : ""
                      }`}
                      colSpan={middleSpan}
                      data-room={room.roomNumber}
                    >
                      <div
                        className={["flex items-center justify-center", middleRange.colorClassName].join(" ")}
                        style={{ height: rowHeight }}
                        onPointerDown={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          beginBookingDrag(middleRange.booking, event);
                        }}
                        onContextMenu={(event) => {
                          event.preventDefault();
                          if (!onBookingContextMenu) return;
                          onBookingContextMenu(middleRange.booking, event.clientX, event.clientY);
                        }}
                        onMouseEnter={(event) => showBookingTooltip(middleRange.booking, event.currentTarget)}
                        onMouseLeave={hideBookingTooltip}
                        onClick={() => {
                          if (bookingDragMovedRef.current) {
                            bookingDragMovedRef.current = false;
                            return;
                          }
                          onBookingSelect?.(middleRange.booking);
                        }}
                        role="button"
                        tabIndex={0}
                      >
                        <span className="max-w-full truncate text-[11px] font-medium text-foreground/90">
                          {middleRange.surname}
                        </span>
                      </div>
                    </td>
                  );
                  dayIndex = middleRange.end;
                  continue;
                }
              }

              if (startRanges.length > 0 || endRanges.length > 0) {
                const cellIndex = dayIndex;
                const ymd = toYMD(daysInMonth[cellIndex]);
                const isSaturday = daysInMonth[cellIndex].getDay() === 6;
                const isSunday = daysInMonth[cellIndex].getDay() === 0;
                const weekendClass = isSunday ? "bg-red-50" : isSaturday ? "bg-default-100" : "";
                const showLeft = startRanges.length > 0;
                const showRight = endRanges.length > 0;
                const isSelected =
                  selection?.roomNumber === room.roomNumber &&
                  cellIndex >= Math.min(selection.startIndex, selection.endIndex) &&
                  cellIndex <= Math.max(selection.startIndex, selection.endIndex);
                const canSelect = showRight && !showLeft;
                const canEndOnStart = showLeft && !showRight;
                const labelRange = startRanges.find((item) => item.start === item.end) ?? null;
                const label = labelRange?.surname;
                const color = (startRanges[0] ?? endRanges[0])?.colorClassName ?? "bg-default-200";
                const booking = (startRanges[0] ?? endRanges[0])?.booking;

                cells.push(
                  <td
                    key={`${room.id}-${ymd}-boundary`}
                    className={`border border-default-200 p-0 ${weekendClass} ${
                      dragOverRoom === room.roomNumber ? "ring-1 ring-primary-200" : ""
                    }`}
                    data-room={room.roomNumber}
                    data-index={cellIndex}
                    onPointerEnter={() => {
                      if (!draggingRef.current) return;
                      if (canSelect || canEndOnStart) {
                        updateSelection(room.roomNumber, cellIndex);
                      }
                    }}
                    onClick={() => {
                      if (!booking || draggingRef.current) return;
                      if (bookingDragMovedRef.current) {
                        bookingDragMovedRef.current = false;
                        return;
                      }
                      onBookingSelect?.(booking);
                    }}
                  >
                    <div className="relative w-full" style={{ height: rowHeight }}>
                      {canSelect && (
                        <div
                          className={["absolute inset-0", isSelected ? "bg-primary-100" : ""].join(" ")}
                          style={{ height: rowHeight, touchAction: "none" }}
                          onPointerDown={(event) => {
                            event.preventDefault();
                            console.debug("[calendar] pointerdown", {
                              roomNumber: room.roomNumber,
                              dayIndex: cellIndex,
                            });
                            beginSelection(room.roomNumber, cellIndex);
                          }}
                          data-room={room.roomNumber}
                          data-index={cellIndex}
                          role="button"
                          tabIndex={0}
                        />
                      )}
                      {canEndOnStart && (
                        <div
                          className={["absolute inset-0", isSelected ? "bg-primary-100" : ""].join(" ")}
                          style={{ height: rowHeight, touchAction: "none" }}
                          data-room={room.roomNumber}
                          data-index={cellIndex}
                          aria-hidden="true"
                        />
                      )}
                      {showLeft && (
                        <div
                          className="absolute inset-0 z-10"
                          onPointerDown={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            if (booking) beginBookingDrag(booking, event);
                          }}
                          onContextMenu={(event) => {
                            event.preventDefault();
                            if (!booking || !onBookingContextMenu) return;
                            onBookingContextMenu(booking, event.clientX, event.clientY);
                          }}
                          onMouseEnter={(event) => booking && showBookingTooltip(booking, event.currentTarget)}
                          onMouseLeave={hideBookingTooltip}
                        >
                          <HalfDiamond side="left" className={color} />
                        </div>
                      )}
                      {showRight && (
                        <div
                          className="absolute inset-0 z-10"
                          onPointerDown={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            if (booking) beginBookingDrag(booking, event);
                          }}
                          onContextMenu={(event) => {
                            event.preventDefault();
                            if (!booking || !onBookingContextMenu) return;
                            onBookingContextMenu(booking, event.clientX, event.clientY);
                          }}
                          onMouseEnter={(event) => booking && showBookingTooltip(booking, event.currentTarget)}
                          onMouseLeave={hideBookingTooltip}
                        >
                          <HalfDiamond side="right" className={color} />
                        </div>
                      )}
                      {label && (
                        <div
                          className={["absolute inset-0 flex items-center justify-center", color].join(" ")}
                          onPointerDown={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            beginBookingDrag(booking!, event);
                          }}
                          onContextMenu={(event) => {
                            event.preventDefault();
                            if (!booking || !onBookingContextMenu) return;
                            onBookingContextMenu(booking, event.clientX, event.clientY);
                          }}
                          onMouseEnter={(event) => booking && showBookingTooltip(booking, event.currentTarget)}
                          onMouseLeave={hideBookingTooltip}
                          onClick={() => {
                            if (!booking) return;
                            if (bookingDragMovedRef.current) {
                              bookingDragMovedRef.current = false;
                              return;
                            }
                            onBookingSelect?.(booking);
                          }}
                          role="button"
                          tabIndex={0}
                        >
                          <span className="max-w-full truncate text-[11px] font-medium text-foreground/90">
                            {label}
                          </span>
                        </div>
                      )}
                    </div>
                  </td>
                );

                dayIndex += 1;
                continue;
              }

              dayIndex += 1;
            }

            return (
              <tr key={room.id}>
                <td className="border border-default-200 bg-default-50 px-2 py-1 text-sm font-medium">
                  {room.roomNumber} · {room.roomType}
                </td>
                {cells}
              </tr>
            );
          })}
        </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
