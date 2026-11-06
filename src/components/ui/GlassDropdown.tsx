import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Check, Search } from 'lucide-react';
import { Monogram } from './Monogram';

export interface DropdownOption<T extends string | number = string> {
  value: T;
  label: string;
  sublabel?: string;
  badge?: string;
  code?: string;
}

interface GlassDropdownProps<T extends string | number = string> {
  options: DropdownOption<T>[];
  value: T;
  onChange: (value: T) => void;
  placeholder?: string;
  className?: string;
  menuClassName?: string;
  searchable?: boolean;
  align?: 'left' | 'right';
  triggerIcon?: React.ReactNode;
}

export const GlassDropdown = <T extends string | number>({
  options,
  value,
  onChange,
  placeholder = 'Pilih opsi...',
  className = '',
  menuClassName = '',
  searchable = true,
  align = 'right',
  triggerIcon,
}: GlassDropdownProps<T>) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = useMemo(() => {
    return options.find((opt) => opt.value === value);
  }, [options, value]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const filteredOptions = useMemo(() => {
    if (!search.trim()) return options;
    const query = search.toLowerCase();
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(query) ||
        (opt.sublabel && opt.sublabel.toLowerCase().includes(query)) ||
        (opt.code && opt.code.toLowerCase().includes(query))
    );
  }, [options, search]);

  return (
    <div ref={dropdownRef} className={`relative inline-block text-left select-none ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className="flex items-center justify-between gap-2.5 px-3 py-1.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.13] border border-white/20 hover:border-white/35 backdrop-blur-md text-xs font-semibold text-white transition-all cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#E8FF1F]"
      >
        <div className="flex items-center gap-2 truncate">
          {triggerIcon}
          {selectedOption?.code && <Monogram code={selectedOption.code} size="sm" />}
          <span className="truncate font-mono-num">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>
        <ChevronDown
          size={14}
          className={`text-white/60 transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180 text-white' : ''}`}
        />
      </button>

      {/* Dropdown Menu Popover */}
      {isOpen && (
        <div
          role="listbox"
          className={`absolute ${align === 'right' ? 'right-0' : 'left-0'} mt-2 w-64 max-w-[90vw] rounded-2xl bg-[#0e0e14]/95 border border-white/15 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.85)] z-50 overflow-hidden flex flex-col p-1.5 animate-modal-pop ${menuClassName}`}
        >
          {/* Optional Search Bar */}
          {searchable && options.length > 8 && (
            <div className="p-1.5 border-b border-white/10 mb-1">
              <div className="relative">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/40" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari opsi..."
                  autoFocus
                  className="w-full bg-white/[0.06] border border-white/10 rounded-lg pl-7 pr-3 py-1 text-xs text-white placeholder-white/30 outline-none focus:border-[#E8FF1F] font-mono-num"
                />
              </div>
            </div>
          )}

          {/* Scrollable Option List */}
          <div className="max-h-60 overflow-y-auto flex flex-col gap-0.5 pr-0.5">
            {filteredOptions.length === 0 ? (
              <div className="py-3 px-2 text-center text-xs text-white/40">
                Tidak ada hasil ditemukan
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <div
                    key={String(opt.value)}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      onChange(opt.value);
                      setIsOpen(false);
                      setSearch('');
                    }}
                    className={`flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-[#E8FF1F]/15 text-[#E8FF1F] font-bold border border-[#E8FF1F]/30'
                        : 'text-white/80 hover:bg-white/[0.08] hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {opt.code && <Monogram code={opt.code} size="sm" highlight={isSelected} />}
                      <span className="truncate font-mono-num">{opt.label}</span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {opt.badge && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-white/50 font-mono-num">
                          {opt.badge}
                        </span>
                      )}
                      {isSelected && <Check size={13} className="text-[#E8FF1F]" />}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
