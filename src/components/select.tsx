"use client";
import {
  Children,
  isValidElement,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type SelectHTMLAttributes,
} from "react";
import { Check, ChevronDown, Search } from "lucide-react";

type Option = { value: string; label: string; disabled?: boolean };

function optionLabel(node: ReactNode): string {
  return Children.toArray(node)
    .map((child) => {
      if (typeof child === "string" || typeof child === "number")
        return String(child);
      if (isValidElement(child))
        return optionLabel(
          (child.props as { children?: ReactNode }).children,
        );
      return "";
    })
    .join("")
    .replace(/\s+/g, " ")
    .trim();
}

function readOptions(children: ReactNode): Option[] {
  return Children.toArray(children).flatMap((child) => {
    if (!isValidElement(child)) return [];
    if (child.type === "optgroup")
      return readOptions(
        (child.props as { children?: ReactNode }).children,
      );
    if (child.type !== "option") return [];
    const props = child.props as {
      value?: string | number;
      children?: ReactNode;
      disabled?: boolean;
    };
    const label = optionLabel(props.children);
    const value =
      props.value === undefined || props.value === null
        ? label
        : String(props.value);
    return [{ value, label, disabled: Boolean(props.disabled) }];
  });
}

function chosenLabel(
  ids: string[],
  options: Option[],
  placeholder: string,
) {
  if (!ids.length) return placeholder;
  const labels = ids
    .map((id) => options.find((option) => option.value === id)?.label)
    .filter(Boolean) as string[];
  if (labels.length <= 2) return labels.join(", ");
  return `${labels.length} members selected`;
}

type Props = Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  "size" | "multiple"
> & {
  children: ReactNode;
  searchable?: boolean;
  placeholder?: string;
  multiple?: boolean;
  values?: string[];
  onValuesChange?: (values: string[]) => void;
};

export function Select({
  children,
  className,
  disabled,
  required,
  name,
  id,
  value,
  defaultValue,
  onChange,
  onBlur,
  searchable: searchableProp,
  placeholder,
  multiple = false,
  values,
  onValuesChange,
  "aria-label": ariaLabel,
  ...rest
}: Props) {
  const options = useMemo(() => readOptions(children), [children]);
  const listed = placeholder
    ? options.filter((option) => option.value !== "")
    : options;
  const generated = useId();
  const listId = `${generated}-list`;
  const searchId = `${generated}-search`;
  const wrap = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [inner, setInner] = useState(() =>
    String(
      value ?? defaultValue ?? (placeholder ? "" : options[0]?.value ?? ""),
    ),
  );
  const [innerValues, setInnerValues] = useState<string[]>(() => values || []);
  const selected = String(value ?? inner);
  const selectedValues = values ?? innerValues;
  const current = listed.find((option) => option.value === selected);
  const searchable = searchableProp ?? (multiple || listed.length > 8);
  const shown = query
    ? listed.filter((option) =>
        option.label.toLowerCase().includes(query.trim().toLowerCase()),
      )
    : listed;
  const triggerText = multiple
    ? chosenLabel(selectedValues, listed, placeholder || "Select")
    : current?.label || placeholder || "Select";
  const isPlaceholder = multiple ? selectedValues.length === 0 : !selected;

  useEffect(() => {
    if (value !== undefined) setInner(String(value));
  }, [value]);

  useEffect(() => {
    if (values) setInnerValues(values);
  }, [values]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      return;
    }
    const onDoc = (e: MouseEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    if (searchable) setTimeout(() => searchRef.current?.focus(), 0);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, searchable]);

  const choose = (next: string) => {
    if (multiple) {
      const nextValues = selectedValues.includes(next)
        ? selectedValues.filter((id) => id !== next)
        : [...selectedValues, next];
      setInnerValues(nextValues);
      onValuesChange?.(nextValues);
      return;
    }
    setInner(next);
    setOpen(false);
    onChange?.({
      target: { value: next, name: name || "" },
    } as unknown as Parameters<NonNullable<typeof onChange>>[0]);
  };

  return (
    <div
      className={className ? `nice-select ${className}` : "nice-select"}
      ref={wrap}
    >
      <select
        {...rest}
        id={id}
        name={name}
        multiple={multiple}
        required={required}
        disabled={disabled}
        value={multiple ? selectedValues : selected}
        tabIndex={-1}
        aria-hidden="true"
        className="nice-select-native"
        onChange={(e) => {
          if (multiple) {
            onValuesChange?.(
              Array.from(e.target.selectedOptions).map((option) => option.value),
            );
            return;
          }
          choose(e.target.value);
        }}
        onBlur={onBlur}
      >
        {placeholder && !multiple ? (
          <option value="" disabled hidden>
            {placeholder}
          </option>
        ) : null}
        {listed.map((option) => (
          <option
            key={option.value || "empty"}
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </option>
        ))}
      </select>
      <button
        type="button"
        className="nice-select-trigger"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={ariaLabel}
        aria-multiselectable={multiple || undefined}
        onClick={() => !disabled && setOpen((v) => !v)}
      >
        <span className={isPlaceholder ? "placeholder" : ""}>{triggerText}</span>
        <ChevronDown size={16} strokeWidth={1.8} />
      </button>
      {open && (
        <div className="nice-select-panel" id={listId} role="listbox">
          {searchable && (
            <div className="nice-select-search">
              <Search size={14} />
              <input
                ref={searchRef}
                id={searchId}
                className="nice-select-search-input"
                type="text"
                value={query}
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search"
                aria-label="Search options"
              />
            </div>
          )}
          <ul>
            {shown.length ? (
              shown.map((option) => {
                const active = multiple
                  ? selectedValues.includes(option.value)
                  : option.value === selected;
                return (
                  <li key={option.value || "empty"}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={active}
                      disabled={option.disabled}
                      className={active ? "is-selected" : ""}
                      onClick={() => !option.disabled && choose(option.value)}
                    >
                      <span>{option.label}</span>
                      {active && <Check size={15} strokeWidth={2.2} />}
                    </button>
                  </li>
                );
              })
            ) : (
              <li className="nice-select-empty">No matches</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
