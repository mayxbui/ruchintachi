"use client";

import { IconChevronDown } from "@tabler/icons-react";
import { useCallback, useId, useRef, useState, type KeyboardEvent } from "react";
import { useDismiss } from "./use-dismiss";

export type DropdownOption<T extends string> = { value: T; label: string };

/** Trigger shared by the dropdown and date picker: looks like a text input. */
export const triggerClass =
  "flex w-full min-w-0 items-center justify-between gap-2 rounded-2xl bg-white py-3 pr-3 pl-3 text-left text-[15px] font-bold shadow-pop outline-none focus-visible:ring-4 focus-visible:ring-sunny sm:pl-4 sm:text-lg";

/** Yellow popover card, matching the icon picker. */
export const popoverClass = "absolute top-full z-20 mt-2 rounded-3xl bg-sunny p-2 shadow-pop";

/**
 * A labelled select in the site's style. Posts its value through a hidden
 * input called `name`. Arrow keys move, Enter picks, Escape closes.
 */
export function Dropdown<T extends string>({
  label,
  name,
  value,
  options,
  onChange,
}: {
  label: string;
  name: string;
  value: T;
  options: DropdownOption<T>[];
  onChange: (value: T) => void;
}) {
  const id = useId();
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(open, close, ref);

  const selected = options.findIndex((o) => o.value === value);

  function show() {
    setActive(Math.max(selected, 0));
    setOpen(true);
  }

  function choose(index: number) {
    onChange(options[index].value);
    setOpen(false);
  }

  function onKeyDown(e: KeyboardEvent) {
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
        e.preventDefault();
        show();
      }
      return;
    }
    if (e.key === "ArrowDown") setActive((i) => Math.min(i + 1, options.length - 1));
    else if (e.key === "ArrowUp") setActive((i) => Math.max(i - 1, 0));
    else if (e.key === "Enter" || e.key === " ") choose(active);
    else if (e.key === "Tab") setOpen(false);
    else return;
    if (e.key !== "Tab") e.preventDefault();
  }

  return (
    <div ref={ref} className="relative min-w-0">
      <span id={`${id}-label`} className="mb-1 block font-bold">
        {label}
      </span>
      <input type="hidden" name={name} value={value} />
      <button
        type="button"
        role="combobox"
        aria-labelledby={`${id}-label`}
        aria-controls={`${id}-list`}
        aria-expanded={open}
        aria-activedescendant={open ? `${id}-${active}` : undefined}
        onClick={() => (open ? setOpen(false) : show())}
        onKeyDown={onKeyDown}
        className={triggerClass}
      >
        <span className="truncate">{options[selected]?.label}</span>
        <IconChevronDown
          aria-hidden
          stroke={2.5}
          className={`size-5 shrink-0 text-caption transition ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <ul
          id={`${id}-list`}
          role="listbox"
          aria-labelledby={`${id}-label`}
          className={`${popoverClass} left-0 w-full min-w-max space-y-1`}
        >
          {options.map((option, i) => (
            <li
              key={option.value}
              id={`${id}-${i}`}
              role="option"
              aria-selected={i === selected}
              onPointerEnter={() => setActive(i)}
              onClick={() => choose(i)}
              className={`cursor-pointer rounded-2xl px-3 py-2 font-bold transition ${
                i === selected
                  ? "bg-tangerine text-white"
                  : i === active
                    ? "bg-sand"
                    : "bg-white"
              }`}
            >
              {option.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
