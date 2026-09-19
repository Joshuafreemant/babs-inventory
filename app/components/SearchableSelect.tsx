"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";

export interface SelectOption {
  value: string;
  label: string;
}

export function SearchableSelect({
  value,
  onChange,
  options,
  placeholder = "Select…",
  icon,
  emptyText = "No matches",
}: {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  icon?: string;
  emptyText?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const listId = useId();

  const selected = options.find((o) => o.value === value);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? options.filter((o) => o.label.toLowerCase().includes(q)) : options;
  }, [options, query]);

  const openList = () => {
    if (open) return;
    setQuery("");
    setActive(Math.max(0, options.findIndex((o) => o.value === value)));
    setOpen(true);
  };

  const close = () => {
    setOpen(false);
    setQuery("");
  };

  const pick = (o: SelectOption) => {
    onChange(o.value);
    close();
  };

  // close when clicking anywhere outside
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) close();
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  // keep the highlighted option visible while arrowing through a long list
  useEffect(() => {
    if (open) listRef.current?.children[active]?.scrollIntoView({ block: "nearest" });
  }, [active, open]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        if (!open) return openList();
        setActive((i) => Math.min(i + 1, filtered.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActive((i) => Math.max(i - 1, 0));
        break;
      case "Enter":
        if (open) {
          e.preventDefault();
          if (filtered[active]) pick(filtered[active]);
        }
        break;
      case "Escape":
        if (open) {
          e.preventDefault();
          e.stopPropagation();
          close();
        }
        break;
      case "Tab":
        close();
        break;
    }
  };

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      <div className="field" onClick={() => inputRef.current?.focus()}>
        {icon && <span className="icon">{icon}</span>}
        <input
          ref={inputRef}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open && filtered[active] ? `${listId}-${active}` : undefined}
          autoComplete="off"
          value={open ? query : selected?.label ?? ""}
          placeholder={open && selected ? selected.label : placeholder}
          onFocus={openList}
          onClick={openList}
          onKeyDown={onKeyDown}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
            setOpen(true);
          }}
        />
        <span
          aria-hidden
          style={{
            paddingRight: 10,
            fontSize: 12,
            color: "var(--ink-soft)",
            pointerEvents: "none",
            transform: open ? "rotate(180deg)" : "none",
          }}
        >
          &#9662;
        </span>
      </div>

      {open && (
        <ul
          id={listId}
          ref={listRef}
          role="listbox"
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            right: 0,
            zIndex: 30,
            margin: 0,
            padding: 4,
            listStyle: "none",
            background: "#fff",
            border: "1px solid var(--line)",
            borderRadius: 10,
            boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
            maxHeight: 220,
            overflowY: "auto",
          }}
        >
          {filtered.length === 0 ? (
            <li style={{ padding: "9px 12px", fontSize: 14, color: "var(--ink-soft)" }}>{emptyText}</li>
          ) : (
            filtered.map((o, i) => (
              <li
                key={o.value}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={o.value === value}
                onMouseEnter={() => setActive(i)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(o)}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "9px 12px",
                  fontSize: 14.5,
                  borderRadius: 6,
                  cursor: "pointer",
                  fontWeight: o.value === value ? 600 : 400,
                  background: i === active ? "rgba(0,0,0,0.06)" : "transparent",
                }}
              >
                <span>{o.label}</span>
                {o.value === value && <span aria-hidden>&#10003;</span>}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}