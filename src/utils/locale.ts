import { useEffect, useState } from "react";

export function useFormatter() {
	const [formatters, setFormatters] = useState({
		formatIntNumber: (value: number) => new Intl.NumberFormat().format(value),
		formatNumber: (value: number, digits?: number) =>
			new Intl.NumberFormat(undefined, {
				minimumFractionDigits: digits,
				maximumFractionDigits: digits,
			}).format(value),
	});

	useEffect(() => {
		const locale = userLocale();

		setFormatters({
			formatIntNumber: (value: number) =>
				new Intl.NumberFormat(locale).format(value),
			formatNumber: (value: number, digits?: number) =>
				new Intl.NumberFormat(locale, {
					minimumFractionDigits: digits,
					maximumFractionDigits: digits,
				}).format(value),
		});
	}, []);

	return formatters;
}

function userLocale(): string {
	const html = document.getElementsByTagName("html")[0];
	return (html && html.getAttribute("data-locale")) || "en-US";
}
