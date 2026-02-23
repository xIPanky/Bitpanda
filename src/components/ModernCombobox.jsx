import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, X } from "lucide-react";

export default function ModernCombobox({
  label,
  value,
  options = [],
  placeholder = "Wähle eine Option",
  onChange,
  searchable = true,
  clearable = true,
  disabled = false,
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);
  const optionsListRef = useRef(null);

  const filtered = search
    ? options.filter((opt) =>
        opt.label.toLowerCase().includes(search.toLowerCase())
      )
    : options;

  const selectedOption = options.find((opt) => opt.value === value);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus search input when menu opens
  useEffect(() => {
    if (open && searchable && searchInputRef.current) {
      setTimeout(() => searchInputRef.current.focus(), 50);
    }
  }, [open, searchable]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (optionsListRef.current && highlightedIndex >= 0) {
      const items = optionsListRef.current.querySelectorAll("[data-option]");
      items[highlightedIndex]?.scrollIntoView({ block: "nearest" });
    }
  }, [highlightedIndex]);

  const handleKeyDown = (e) => {
    if (!open) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < filtered.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
        break;
      case "Enter":
        e.preventDefault();
        if (filtered[highlightedIndex]) {
          onChange(filtered[highlightedIndex].value);
          setOpen(false);
          setSearch("");
          setHighlightedIndex(0);
        }
        break;
      case "Escape":
        e.preventDefault();
        setOpen(false);
        setSearch("");
        setHighlightedIndex(0);
        break;
      default:
        break;
    }
  };

  const handleSelectOption = (optionValue) => {
    onChange(optionValue);
    setOpen(false);
    setSearch("");
    setHighlightedIndex(0);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange(null);
    setSearch("");
    setHighlightedIndex(0);
  };

  const handleOpenChange = () => {
    if (!disabled) {
      setOpen(!open);
      setHighlightedIndex(0);
      setSearch("");
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {label && (
        <label className="text-sm font-semibold text-white mb-2 block">
          {label}
        </label>
      )}

      {/* Trigger Button */}
      <button
        onClick={handleOpenChange}
        disabled={disabled}
        className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-150"
        style={{
          background: "#0d0d0d",
          border: open ? "1px solid #beff00" : "1px solid #1a1a1a",
          color: selectedOption ? "#ffffff" : "#666",
        }}
        onMouseEnter={(e) => {
          if (!open && !disabled) {
            e.currentTarget.style.borderColor = "#333";
            e.currentTarget.style.background = "#111";
          }
        }}
        onMouseLeave={(e) => {
          if (!open && !disabled) {
            e.currentTarget.style.borderColor = "#1a1a1a";
            e.currentTarget.style.background = "#0d0d0d";
          }
        }}
      >
        <span>{selectedOption?.label || placeholder}</span>
        <div className="flex items-center gap-2">
          {clearable && selectedOption && (
            <X
              className="w-4 h-4"
              style={{ color: "#666" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "#beff00";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "#666";
              }}
              onClick={handleClear}
            />
          )}
          <ChevronDown
            className="w-4 h-4 transition-transform"
            style={{
              color: open ? "#beff00" : "#555",
              transform: open ? "rotate(180deg)" : "rotate(0deg)",
            }}
          />
        </div>
      </button>

      {/* Popover Menu */}
      {open && (
        <div
          className="absolute top-full left-0 right-0 mt-2 rounded-xl shadow-xl z-50 overflow-hidden"
          style={{
            background: "#0d0d0d",
            border: "1px solid #1a1a1a",
            animation: "fadeIn 0.15s ease-out",
          }}
        >
          {/* Search Input */}
          {searchable && (
            <div className="p-2" style={{ borderBottom: "1px solid #1a1a1a" }}>
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Suchen..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setHighlightedIndex(0);
                }}
                onKeyDown={handleKeyDown}
                className="w-full px-3 py-2 text-sm rounded-lg"
                style={{
                  background: "#111",
                  border: "1px solid #1a1a1a",
                  color: "#fff",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#beff00";
                  e.target.style.boxShadow = "0 0 0 2px rgba(190,255,0,0.1)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "#1a1a1a";
                  e.target.style.boxShadow = "none";
                }}
              />
            </div>
          )}

          {/* Options List */}
          <div
            ref={optionsListRef}
            className="max-h-64 overflow-y-auto"
            onKeyDown={handleKeyDown}
          >
            {filtered.length === 0 ? (
              <div className="px-4 py-3 text-sm" style={{ color: "#666" }}>
                Keine Treffer
              </div>
            ) : (
              filtered.map((option, index) => (
                <button
                  key={option.value}
                  data-option
                  onClick={() => handleSelectOption(option.value)}
                  className="w-full text-left px-4 py-2.5 text-sm transition-colors duration-100"
                  style={{
                    background:
                      index === highlightedIndex ? "#1a2e00" : "transparent",
                    color:
                      index === highlightedIndex
                        ? "#beff00"
                        : option.value === value
                          ? "#beff00"
                          : "#ccc",
                    fontWeight:
                      option.value === value || index === highlightedIndex
                        ? "600"
                        : "400",
                    borderLeft:
                      option.value === value
                        ? "3px solid #beff00"
                        : "3px solid transparent",
                  }}
                  onMouseEnter={(e) => {
                    setHighlightedIndex(index);
                  }}
                >
                  {option.label}
                </button>
              ))
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}