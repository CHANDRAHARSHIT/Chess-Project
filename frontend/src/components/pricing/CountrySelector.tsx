import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Search, Globe } from "lucide-react";

interface CountrySelectorProps {
  onSelect: (countryCode: string) => void;
  disabled?: boolean;
}

const COUNTRIES = [
  { code: "NZ", flag: "🇳🇿", name: "New Zealand", currency: "NZD" },
  { code: "IN", flag: "🇮🇳", name: "India", currency: "INR" },
  { code: "US", flag: "🇺🇸", name: "United States", currency: "USD" },
  { code: "GB", flag: "🇬🇧", name: "United Kingdom", currency: "GBP" },
  { code: "AU", flag: "🇦🇺", name: "Australia", currency: "AUD" },
  { code: "EU", flag: "🇪🇺", name: "Europe", currency: "EUR" },
];

export const CountrySelector: React.FC<CountrySelectorProps> = ({
  onSelect,
  disabled,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!import.meta.env.DEV) {
    return null;
  }

  const filteredCountries = COUNTRIES.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.currency.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const selectedCountry = COUNTRIES.find((c) => c.code === selectedCode);

  const handleSelect = (code: string) => {
    setSelectedCode(code);
    setIsOpen(false);
    setSearchTerm("");
    onSelect(code); // Trigger the API refresh immediately
  };

  return (
    <div className="flex flex-col items-center justify-center mb-10 relative z-50 w-full">
      <div className="bg-[#0c1020]/90 backdrop-blur-xl border border-brand-accent/30 p-5 rounded-2xl max-w-sm w-full shadow-[0_10px_40px_rgba(212,175,110,0.15)] relative">
        <div className="flex items-center gap-2 mb-3 justify-center">
          <Globe className="w-4 h-4 text-brand-accent" />
          <h3 className="text-sm font-display font-medium text-white tracking-wide">
            Dev Mode: Region Simulator
          </h3>
        </div>

        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            disabled={disabled}
            onClick={() => setIsOpen(!isOpen)}
            className="w-full bg-[#080b14]/80 border border-brand-border hover:border-brand-accent/50 text-white rounded-xl py-3 px-4 flex items-center justify-between transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            {selectedCountry ? (
              <div className="flex items-center gap-3">
                <span className="text-xl leading-none">
                  {selectedCountry.flag}
                </span>
                <span className="font-sans text-sm font-medium tracking-wide">
                  {selectedCountry.name}
                </span>
                <span className="font-mono text-[11px] font-bold text-brand-accent bg-brand-accent/10 border border-brand-accent/20 px-1.5 py-0.5 rounded">
                  {selectedCountry.currency}
                </span>
              </div>
            ) : (
              <span className="text-brand-secondary text-sm font-sans">
                Select region to preview...
              </span>
            )}
            <ChevronDown
              className={`w-4 h-4 text-brand-secondary group-hover:text-brand-accent transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
            />
          </button>

          {isOpen && (
            <div className="absolute top-[calc(100%+8px)] left-0 right-0 bg-[#0c1020] border border-brand-accent/40 rounded-xl shadow-2xl overflow-hidden z-[100] animate-in fade-in zoom-in-95 duration-200">
              <div className="p-2 border-b border-brand-border/50 flex items-center gap-2 bg-[#080b14]/50">
                <Search className="w-4 h-4 text-brand-secondary ml-2" />
                <input
                  type="text"
                  placeholder="Search region..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-transparent border-none focus:ring-0 text-sm text-white placeholder:text-brand-secondary/60 py-2 outline-none"
                  autoFocus
                />
              </div>
              <div className="max-h-60 overflow-y-auto">
                {filteredCountries.length > 0 ? (
                  filteredCountries.map((country) => (
                    <button
                      key={country.code}
                      onClick={() => handleSelect(country.code)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-brand-accent/10 transition-colors text-left border-l-2 border-transparent hover:border-brand-accent group"
                    >
                      <span className="text-xl leading-none">
                        {country.flag}
                      </span>
                      <span className="font-sans text-sm text-brand-text group-hover:text-brand-accent font-medium flex-1">
                        {country.name}
                      </span>
                      <span className="font-mono text-xs text-brand-secondary group-hover:text-brand-accent font-semibold transition-colors">
                        {country.currency}
                      </span>
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-6 text-center text-sm text-brand-secondary font-sans">
                    No matching regions found.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
