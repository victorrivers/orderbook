interface SpreadProps {
	bidPrice: number;
	askPrice: number;
	className?: string;
}

export function Spread(props: SpreadProps): JSX.Element {
	const { bidPrice, askPrice, className } = props;

	const spread = askPrice - bidPrice;
	const spreadPercentage = bidPrice === 0 ? 0 : (spread * 100) / bidPrice;

	return (
		<div className={className}>{`Spread: ${spread.toFixed(
			1
		)} (${spreadPercentage.toFixed(2)}%)`}</div>
	);
}
