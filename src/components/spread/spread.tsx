import { useFormatter } from "../../utils/locale";
import styles from "./spread.module.scss";

interface SpreadProps {
	bidPrice: number;
	askPrice: number;
	className?: string;
}

export function Spread(props: SpreadProps): JSX.Element {
	const { bidPrice, askPrice, className } = props;

	const { formatNumber } = useFormatter();
	const spread = askPrice - bidPrice;
	const spreadPercentage = bidPrice === 0 ? 0 : (spread * 100) / bidPrice;

	return (
		<div className={className}>
			<span className={styles.fontBold}>Spread: </span>
			<span className={styles.font}>
				{`${formatNumber(spread, 1)} (${formatNumber(spreadPercentage, 2)}%)`}
			</span>
		</div>
	);
}
