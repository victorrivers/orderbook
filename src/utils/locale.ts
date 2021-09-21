export function userLocale(): string {
  const html = document.getElementsByTagName("html")[0];
  return (html && html.getAttribute("data-locale")) || "en-US";
}

export function toFormattedNumber(value: number, digits?: number) {
  return new Intl.NumberFormat(userLocale(), {
    minimumFractionDigits: digits,
  }).format(value);
}
