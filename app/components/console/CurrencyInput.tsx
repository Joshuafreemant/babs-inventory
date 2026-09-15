"use client";

/** A price field that shows comma-grouped digits as you type (₦12,500) while
 * the value it reports back is still a plain digit string — a drop-in
 * replacement for `<input type="number">` on price fields. */
export function CurrencyInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (digits: string) => void;
  placeholder?: string;
}) {
  const display = value ? Number(value).toLocaleString("en-NG") : "";
  return (
    <input
      inputMode="numeric"
      placeholder={placeholder}
      value={display}
      onChange={(e) => onChange(e.target.value.replace(/[^0-9]/g, ""))}
    />
  );
}
