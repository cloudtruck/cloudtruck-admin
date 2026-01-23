'use client';

import { useState, useEffect } from 'react';
import { INDIAN_CITIES } from '@/lib/constants';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CityAutocompleteProps {
  value?: string;
  onChange: (city: string) => void;
  placeholder?: string;
  label?: string;
  className?: string;
  disabled?: boolean;
}

export function CityAutocomplete({
  value = '',
  onChange,
  placeholder = 'Search or select city...',
  label,
  className,
  disabled = false,
}: CityAutocompleteProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredCities, setFilteredCities] = useState<string[]>(INDIAN_CITIES.slice(0, 20));
  const [showDropdown, setShowDropdown] = useState(false);

  // Filter cities based on search query
  useEffect(() => {
    if (searchQuery) {
      const filtered = INDIAN_CITIES.filter((city) =>
        city.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredCities(filtered.slice(0, 50)); // Limit to 50 results
    } else {
      setFilteredCities(INDIAN_CITIES.slice(0, 20)); // Show top 20 by default
    }
  }, [searchQuery]);

  const handleSelect = (city: string) => {
    onChange(city);
    setSearchQuery('');
    setShowDropdown(false);
  };

  return (
    <div className={cn('relative', className)}>
      {label && <Label className="mb-2">{label}</Label>}
      <div className="relative">
        <Input
          type="text"
          value={value || searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            if (value) onChange(''); // Clear selection when typing
            setShowDropdown(true);
          }}
          onFocus={() => setShowDropdown(true)}
          onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full"
        />
        {showDropdown && filteredCities.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-[300px] overflow-auto">
            {filteredCities.map((city) => (
              <button
                key={city}
                type="button"
                onClick={() => handleSelect(city)}
                className={cn(
                  'w-full px-3 py-2 text-left hover:bg-gray-100 flex items-center gap-2',
                  value === city && 'bg-gray-50'
                )}
              >
                <Check
                  className={cn(
                    'h-4 w-4',
                    value === city ? 'opacity-100' : 'opacity-0'
                  )}
                />
                {city}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

