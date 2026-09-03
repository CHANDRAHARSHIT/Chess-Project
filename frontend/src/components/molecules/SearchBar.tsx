import React from "react";
import { Search, X } from "lucide-react";
import { Input } from "../atoms/Input";

export interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  placeholder = "Search...",
  className = "",
  autoFocus = false,
}) => {
  return (
    <div className={`relative w-full ${className}`}>
      <Input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        leftIcon={<Search className="w-4 h-4" />}
        rightIcon={
          value ? (
            <button
              type="button"
              onClick={() => onChange("")}
              className="p-1 hover:text-brand-text text-brand-secondary transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : undefined
        }
      />
    </div>
  );
};

export default SearchBar;
