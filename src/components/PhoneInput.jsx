import React, { useState, useEffect, useMemo } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { Command } from 'cmdk';
import { getCountries, getCountryCallingCode, AsYouType, parsePhoneNumberFromString } from 'libphonenumber-js';
import * as Flags from 'country-flag-icons/react/3x2';
import { ChevronDown, Search, Check } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });

export function PhoneInput({ value, onChange, onBlur, inputRef, error, disabled, id, placeholder, autoComplete }) {
  const [open, setOpen] = useState(false);
  const [country, setCountry] = useState('IN');

  useEffect(() => {
    if (value) {
      const parsed = parsePhoneNumberFromString(value);
      if (parsed && parsed.country) {
        setCountry(parsed.country);
      }
    }
  }, [value]);

  const countries = useMemo(() => {
    return getCountries().map(c => ({
      code: c,
      name: regionNames.of(c) || c,
      dialCode: `+${getCountryCallingCode(c)}`
    })).sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  const maxDigits = useMemo(() => {
    if (country === 'IN') return 10;
    return 12;
  }, [country]);

  const displayValue = useMemo(() => {
    if (!value) return '';
    const prefix = `+${getCountryCallingCode(country)}`;
    if (value.startsWith(prefix)) {
      return value.slice(prefix.length).trim();
    }
    const parsed = parsePhoneNumberFromString(value);
    if (parsed && parsed.nationalNumber) {
      return parsed.nationalNumber;
    }
    return value.replace(/^\+\d+\s*/, '');
  }, [value, country]);

  const handleCountrySelect = (c) => {
    setCountry(c.code);
    setOpen(false);
    
    const currentNationalDigits = displayValue.replace(/\D/g, '');
    if (currentNationalDigits) {
      const truncated = currentNationalDigits.slice(0, c.code === 'IN' ? 10 : 12);
      const dialCode = `+${getCountryCallingCode(c.code)}`;
      const formatter = new AsYouType(c.code);
      formatter.input(`${dialCode}${truncated}`);
      onChange(formatter.getNumber()?.formatInternational() || `${dialCode} ${truncated}`);
    } else {
      onChange('');
    }
  };

  const handleInputChange = (e) => {
    let rawDigits = e.target.value.replace(/\D/g, '');
    
    if (rawDigits.length > maxDigits) {
      rawDigits = rawDigits.slice(0, maxDigits);
    }

    if (!rawDigits) {
      onChange('');
      return;
    }

    const dialCode = `+${getCountryCallingCode(country)}`;
    const formatter = new AsYouType(country);
    formatter.input(`${dialCode}${rawDigits}`);
    
    const formattedIntl = formatter.getNumber()?.formatInternational() || `${dialCode} ${rawDigits}`;
    onChange(formattedIntl);
  };

  const Flag = Flags[country];

  const dynamicPlaceholder = useMemo(() => {
    if (country === 'IN') return '98765 43210';
    const formatter = new AsYouType(country);
    let sample = '9999999999';
    const dialCode = `+${getCountryCallingCode(country)}`;
    const fullSample = formatter.input(`${dialCode}${sample}`);
    return fullSample.replace(dialCode, '').trim() || '98765 43210';
  }, [country]);

  return (
    <div className={cn(
      "flex relative w-full h-12 rounded-xl border bg-white overflow-hidden transition-colors focus-within:ring-[#b512b8] focus-within:ring-2 focus-within:ring-offset-0 focus-within:border-[#b512b8]",
      error ? "border-red-500 focus-within:ring-red-500 focus-within:border-red-500" : "border-gray-300 hover:border-gray-400",
      disabled && "opacity-50 cursor-not-allowed"
    )}>
      <Popover.Root open={open} onOpenChange={setOpen}>
        <Popover.Trigger 
          disabled={disabled} 
          aria-label="Select country"
          className="flex items-center gap-1.5 pl-3 pr-2.5 hover:bg-gray-50 transition-colors border-r border-gray-200 outline-none focus-visible:bg-gray-100 shrink-0"
        >
          {Flag ? <Flag className="w-5 h-auto shadow-xs rounded-[2px] shrink-0" /> : <div className="w-5 h-3.5 bg-gray-200 rounded-[2px] shrink-0" />}
          <span className="text-[14px] font-medium text-gray-700 select-none">+{getCountryCallingCode(country)}</span>
          <ChevronDown className="w-3.5 h-3.5 text-gray-400 shrink-0" />
        </Popover.Trigger>
        
        <Popover.Portal>
          <Popover.Content 
            align="start" 
            className="z-[100] w-[320px] bg-white rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] border border-gray-200 overflow-hidden animate-in fade-in zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:zoom-out-95"
            sideOffset={8}
          >
            <Command className="flex flex-col w-full h-[320px]">
              <div className="flex items-center border-b border-gray-100 px-3">
                <Search className="w-4 h-4 text-gray-400 shrink-0" />
                <Command.Input 
                  placeholder="Search countries or codes..." 
                  className="flex h-11 w-full rounded-none bg-transparent px-3 py-3 text-[14px] outline-none placeholder:text-gray-400" 
                />
              </div>
              <Command.List className="overflow-y-auto p-1.5 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
                <Command.Empty className="py-6 text-center text-sm text-gray-500">No country found.</Command.Empty>
                <Command.Group>
                  {countries.map((c) => {
                    const ItemFlag = Flags[c.code];
                    return (
                      <Command.Item
                        key={c.code}
                        value={`${c.name} ${c.dialCode}`}
                        onSelect={() => handleCountrySelect(c)}
                        className={cn(
                          "flex items-center gap-3 px-2.5 py-2 rounded-lg cursor-pointer text-[14px] outline-none transition-colors",
                          "data-[selected=true]:bg-gray-100 hover:bg-gray-100",
                          country === c.code && "bg-[#b512b8]/5 data-[selected=true]:bg-[#b512b8]/10 hover:bg-[#b512b8]/10 text-[#8c0c8e] font-medium"
                        )}
                      >
                        {ItemFlag ? <ItemFlag className="w-5 h-auto shadow-sm rounded-[2px] shrink-0" /> : <div className="w-5 h-3.5 bg-gray-200 rounded-[2px] shrink-0" />}
                        <span className="flex-1 truncate">{c.name}</span>
                        <span className={cn("text-[13px]", country === c.code ? "text-[#8c0c8e]" : "text-gray-500")}>
                          {c.dialCode}
                        </span>
                        {country === c.code && <Check className="w-4 h-4 text-[#8c0c8e] shrink-0" />}
                      </Command.Item>
                    );
                  })}
                </Command.Group>
              </Command.List>
            </Command>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>

      <input
        ref={inputRef}
        id={id}
        type="tel"
        value={displayValue}
        onChange={handleInputChange}
        onBlur={onBlur}
        disabled={disabled}
        autoComplete={autoComplete || "off"}
        placeholder={placeholder || dynamicPlaceholder}
        className="flex-1 min-w-0 bg-transparent px-3.5 py-2 text-[15px] text-gray-900 outline-none placeholder:text-gray-400 disabled:cursor-not-allowed"
      />
    </div>
  );
}
