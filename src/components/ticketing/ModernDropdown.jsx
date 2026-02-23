import React, { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Check } from "lucide-react";

export function ModernDropdown({
  label,
  value,
  onChange,
  options,
  placeholder = "Auswählen…",
  disabled = false,
  className = "",
  required = false,
}) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const btnRef = useRef(null);
  const menuRef = useRef(null);

  const selected = useMemo(
    () => options.find((o) => o.value === value) || null,
    [options, value]
  );

  useEffect(() => {
    const onDoc = (e) => {
      const btn = btnRef.current;
      const menu = menuRef.current;
      if (!btn || !menu) return;
      if (btn.contains(e.target) || menu.contains(e.target)) return;
      setOpen(false);
      setActiveIndex(-1);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  useEffect(() => {
    if (!open) return;
    const idx = Math.max(0, options.findIndex((o) => o.value === value));
    setActiveIndex(idx);
    setTimeout(() => menuRef.current?.focus(), 0);
  }, [open, options, value]);

  const selectAt = (idx) => {
    const opt = options[idx];
    if (!opt) return;
    onChange?.(opt.value);
    setOpen(false);
    setActiveIndex(-1);
    btnRef.current?.focus();
  };

  const onButtonKeyDown = (e) => {
    if (disabled) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setOpen((v) => !v);
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
    }
  };

  const onMenuKeyDown = (e) => {
    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      setActiveIndex(-1);
      btnRef.current?.focus();
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(options.length - 1, i + 1));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(0, i - 1));
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      selectAt(activeIndex);
      return;
    }
  };

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <p className="mb-2 text-[10px] font-bold uppercase tracking-widest" style={{ color: "#888" }}>
          {label}{required && <span style={{ color: "#beff00", marginLeft: "4px" }}>*</span>}
        </p>
      )}

      <button
        ref={btnRef}
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((v) => !v)}
        onKeyDown={onButtonKeyDown}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl transition-all outline-none"
        style={{
          background: "#0d0d0d",
          border: "1px solid #1a1a1a",
          color: "#fff",
          opacity: disabled ? 0.6 : 1,
          boxShadow: open ? "0 0 0 2px rgba(190,255,0,0.15)" : "none",
        }}
        onMouseEnter={(e) => {
          if (disabled) return;
          e.currentTarget.style.borderColor = "#1f1f1f";
        }}
        onMouseLeave={(e) => {
          if (disabled) return;
          e.currentTarget.style.borderColor = "#1a1a1a";
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="text-sm font-semibold truncate" style={{ color: selected ? "#fff" : "#666" }}>
          {selected ? selected.label : placeholder}
        </span>

        <ChevronDown
          className="w-4 h-4 transition-transform flex-shrink-0"
          style={{ color: "#666", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </button>

      {open && (
        <div
          ref={menuRef}
          tabIndex={-1}
          onKeyDown={onMenuKeyDown}
          className="mt-2 rounded-2xl overflow-hidden outline-none"
          style={{
            background: "rgba(13,13,13,0.98)",
            border: "1px solid #1a1a1a",
            boxShadow: "0 16px 40px rgba(0,0,0,0.55)",
            backdropFilter: "blur(10px)",
            animation: "synergyFadeIn 140ms ease-out",
          }}
          role="listbox"
        >
          {options.map((opt, idx) => {
            const isSelected = opt.value === value;
            const isActive = idx === activeIndex;

            return (
              <button
                key={opt.value}
                type="button"
                onMouseEnter={() => setActiveIndex(idx)}
                onClick={() => selectAt(idx)}
                className="w-full px-4 py-3 flex items-center justify-between text-left transition-all"
                style={{
                  background: isActive ? "#111" : "transparent",
                  color: "#fff",
                  borderLeft: isActive ? "2px solid #beff00" : "2px solid transparent",
                }}
              >
                <span className="text-sm font-semibold truncate">{opt.label}</span>
                {isSelected ? <Check className="w-4 h-4" style={{ color: "#beff00" }} /> : <span />}
              </button>
            );
          })}
        </div>
      )}

      <style>{`
        @keyframes synergyFadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}