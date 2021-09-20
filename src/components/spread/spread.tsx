interface SpreadProps {
	bidPrice: number;
	askPrice: number;
}

export function Spread(props: SpreadProps): JSX.Element {
	const { bidPrice, askPrice } = props;

	const spread = askPrice - bidPrice;
	const spreadPercentage = bidPrice === 0 ? 0 : (spread * 100) / bidPrice;

	return (
		<>{`Spread: ${spread.toFixed(1)} (${spreadPercentage.toFixed(2)}%)`}</>
	);
}
