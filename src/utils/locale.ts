export function toFormattedNumber(value: number, digits?: number) {
	return new Intl.NumberFormat(undefined, {
		minimumFractionDigits: digits,
	}).format(value);
}
