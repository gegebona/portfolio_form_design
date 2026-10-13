/**
 * Shared look of every floating surface (select, combobox, menu): white, strong border, UBS pop shadow (shadow-pop),
 * and a short fade/scale in and out driven by Base UI's data-starting-style / data-ending-style.
 */
export const popupSurface =
  'rounded-sm border border-line-strong bg-surface text-fg shadow-pop outline-none transition-[opacity,scale] duration-100 ease-out data-ending-style:scale-98 data-ending-style:opacity-0 data-starting-style:scale-98 data-starting-style:opacity-0'
