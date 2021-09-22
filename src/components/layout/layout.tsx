import { toFormattedNumber, userLocale } from "../../utils/locale";
import { Feed } from "../feed/feed";

export function Layout(): JSX.Element {
	const locale = userLocale();

	const formatIntNumberFn = (value: number) => toFormattedNumber(value, locale);
	const formatNumberFn = (value: number) => toFormattedNumber(value, locale, 2);

	return (
		<Feed
			totalRows={20}
			formatIntNumber={formatIntNumberFn}
			formatNumber={formatNumberFn}
		/>
	);
}
