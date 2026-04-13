import { useState, useRef, useCallback } from 'react';

interface RegexInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string | null;
  label?: string;
  id?: string;
}

export function RegexInput({ value, onChange, placeholder, error, label, id }: RegexInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = useState(false);



  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="section-title" htmlFor={id}>
          {label}
        </label>
      )}
      <div className={`relative ${isFocused ? 'animate-pulse-glow' : ''}`} style={{ borderRadius: '10px' }}>
        <input
          ref={inputRef}
          id={id}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder || 'Enter regex... e.g. (a|b)*abb'}
          className="input-field"
          style={{
            borderColor: error ? 'var(--color-error)' : undefined,
          }}
          spellCheck={false}
          autoComplete="off"
        />
        {value && (
          <button
            onClick={() => onChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem' }}
            aria-label="Clear input"
          >
            ×
          </button>
        )}
      </div>
      {error && (
        <p className="text-sm animate-fade-in" style={{ color: 'var(--color-error)', margin: 0 }}>
          {error}
        </p>
      )}
    </div>
  );
}

// Export the insertAtCursor capability as a ref-based approach
export type RegexInputRef = {
  insertAtCursor: (text: string) => void;
};

export function useRegexInput(initialValue: string = '') {
  const [value, setValue] = useState(initialValue);
  const inputRef = useRef<HTMLInputElement>(null);

  const insertAtCursor = useCallback((text: string) => {
    const input = inputRef.current;
    const currentValue = value;

    if (!input) {
      setValue(currentValue + text);
      return;
    }

    const start = input.selectionStart ?? currentValue.length;
    const end = input.selectionEnd ?? currentValue.length;
    const newValue = currentValue.slice(0, start) + text + currentValue.slice(end);
    setValue(newValue);

    requestAnimationFrame(() => {
      const newPos = start + text.length;
      input.setSelectionRange(newPos, newPos);
      input.focus();
    });
  }, [value]);

  return { value, setValue, inputRef, insertAtCursor };
}
