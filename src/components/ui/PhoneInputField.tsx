'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { PHONE_COUNTRIES, type PhoneCountry, formatLocalDigits } from '@/lib/phone'

interface PhoneInputFieldProps {
  dialCode: string
  /** Raw digits only — no spaces */
  localNumber: string
  onDialCodeChange: (dialCode: string) => void
  /** Always called with raw digits only */
  onLocalNumberChange: (localNumber: string) => void
  error?: string | null
  disabled?: boolean
  id?: string
}

export function PhoneInputField({
  dialCode,
  localNumber,
  onDialCodeChange,
  onLocalNumberChange,
  error,
  disabled,
  id,
}: PhoneInputFieldProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [search, setSearch] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  const selectedCountry = PHONE_COUNTRIES.find((c) => c.dialCode === dialCode) ?? PHONE_COUNTRIES[0]

  const filtered = search.trim()
    ? PHONE_COUNTRIES.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.dialCode.includes(search)
      )
    : PHONE_COUNTRIES

  useEffect(() => {
    if (dropdownOpen) {
      setTimeout(() => searchRef.current?.focus(), 30)
    }
  }, [dropdownOpen])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleCountrySelect = (country: PhoneCountry) => {
    onDialCodeChange(country.dialCode)
    // Clear the number when country changes — old number is invalid
    onLocalNumberChange('')
    setDropdownOpen(false)
    setSearch('')
  }

  const handleNumberInput = (value: string) => {
    const digits = value.replace(/\D/g, '')
    // Hard cap at maxLocalLen — user cannot type beyond the country limit
    const capped = digits.slice(0, selectedCountry.maxLocalLen)
    onLocalNumberChange(capped)
  }

  // Display formatted value (with spaces), stored value is raw digits
  const displayValue = formatLocalDigits(localNumber, selectedCountry.formatGroups)

  const hasError = Boolean(error)

  return (
    <div className="space-y-1.5">
      <div className="flex min-w-0 gap-2">
        {/* Country code selector */}
        <div ref={dropdownRef} className="relative shrink-0">
          <button
            type="button"
            onClick={() => !disabled && setDropdownOpen((p) => !p)}
            disabled={disabled}
            aria-haspopup="listbox"
            aria-expanded={dropdownOpen}
            className={`flex h-11 min-w-[6rem] items-center justify-between gap-1.5 rounded-xl border px-3 text-sm font-medium shadow-xs transition-all outline-none
              ${hasError ? 'border-rose-300 bg-rose-50' : 'border-input bg-white hover:bg-slate-50 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/25'}
              ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
          >
            <span className="text-base leading-none">{selectedCountry.flag}</span>
            <span className="font-mono text-slate-700">{selectedCountry.dialCode}</span>
            <ChevronDown
              className={`h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform duration-150 ${dropdownOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {dropdownOpen && (
            <div
              role="listbox"
              className="absolute left-0 top-full z-50 mt-1 w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
            >
              <div className="border-b border-slate-100 p-2">
                <input
                  ref={searchRef}
                  type="text"
                  placeholder="Search country…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/25"
                />
              </div>

              <ul className="max-h-52 overflow-y-auto py-1">
                {filtered.map((country) => (
                  <li key={country.code} role="option" aria-selected={country.dialCode === dialCode}>
                    <button
                      type="button"
                      onClick={() => handleCountrySelect(country)}
                      className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors
                        ${country.dialCode === dialCode
                          ? 'bg-primary/5 font-semibold text-primary'
                          : 'text-slate-700 hover:bg-slate-50'}`}
                    >
                      <span className="w-5 shrink-0 text-base">{country.flag}</span>
                      <span className="flex-1 truncate">{country.name}</span>
                      <span className="shrink-0 font-mono text-xs text-slate-400">{country.dialCode}</span>
                    </button>
                  </li>
                ))}
                {filtered.length === 0 && (
                  <li className="px-4 py-4 text-center text-sm text-slate-400">No results</li>
                )}
              </ul>
            </div>
          )}
        </div>

        {/* Local phone number input — min-w-0 prevents flex overflow */}
        <input
          id={id}
          type="tel"
          inputMode="numeric"
          value={displayValue}
          onChange={(e) => handleNumberInput(e.target.value)}
          placeholder={selectedCountry.placeholder}
          disabled={disabled}
          aria-invalid={hasError}
          className={`h-11 min-w-0 flex-1 rounded-xl border px-4 text-sm shadow-xs transition-all outline-none placeholder:text-slate-400
            ${hasError
              ? 'border-rose-300 bg-rose-50 focus:ring-2 focus:ring-rose-200'
              : 'border-input bg-white focus:border-primary focus:ring-2 focus:ring-primary/25'}
            ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
        />
      </div>

      {/* Digit counter + error */}
      <div className="flex items-center justify-between gap-3 px-0.5">
        <p className={`text-xs font-medium ${hasError ? 'text-rose-600' : 'text-transparent'}`} aria-live="polite">
          {hasError ? error : 'ok'}
        </p>
        <p
          className={`text-xs tabular-nums ${
            localNumber.length === selectedCountry.maxLocalLen ? 'text-emerald-500' : 'text-slate-400'
          }`}
        >
          {localNumber.length}/{selectedCountry.maxLocalLen}
        </p>
      </div>
    </div>
  )
}
