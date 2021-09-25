import { useEffect, useRef, useState } from "react";
import { useFormatter } from "../../utils/locale";
import { DataMessage, Product, useData } from "../../utils/use-data";
import { ConnectionState } from "../../utils/use-web-socket";
import { Spread } from "../spread/spread";
import styles from "./feed.module.scss";

export type OrderLevelSimple = {
	price: number;
	size: number;
	total: number;
};

export type OrderLevel = OrderLevelSimple & {
	depth: number;
};

export enum SortDirection {
	ASC = 0,
	DESC = 1,
}

export type FeedData = {
	bids: OrderLevel[];
	asks: OrderLevel[];
};

enum PriceLevel {
	PRICE = 0,
	SIZE = 1,
}

interface FeedProps {
	totalRows: number;
}

export function Feed(props: FeedProps) {
	const { totalRows } = props;

	const { formatIntNumber, formatNumber } = useFormatter();

	const [selectedProduct, setSelectedProduct] = useState<Product>(
		Product.PI_XBTUSD
	);

	const [feed, setFeed] = useState<FeedData>({
		bids: [{ price: 0, size: 0, total: 0, depth: 0 }],
		asks: [{ price: 0, size: 0, total: 0, depth: 0 }],
	});

	const [connectionState, setConnectionState] = useState(
		ConnectionState.INACTIVE
	);

	const { snapshotMessage, deltaMessage } = useData(
		connectionState,
		selectedProduct
	);

	const messageHistory = useRef<DataMessage[]>([]);

	useEffect(() => {
		setConnectionState(ConnectionState.ACTIVE);

		function handleVisibilityChange() {
			if (document.visibilityState === "hidden") {
				setConnectionState(ConnectionState.INACTIVE);
			}
		}

		document.addEventListener(
			"visibilitychange",
			handleVisibilityChange,
			false
		);

		return () =>
			document.removeEventListener(
				"visibilitychange",
				handleVisibilityChange,
				false
			);
	}, []);

	useEffect(() => {
		const bids = createOrderLevels(snapshotMessage.bids, SortDirection.ASC);
		const asks = createOrderLevels(snapshotMessage.asks, SortDirection.DESC);

		setFeed(createDepthLevels(bids, asks, totalRows));
	}, [snapshotMessage, totalRows]);

	useEffect(() => {
		messageHistory.current.push(deltaMessage);
	}, [deltaMessage]);

	useEffect(() => {
		if (messageHistory.current.length > 0) {
			const delta = messageHistory.current[messageHistory.current.length - 1];
			messageHistory.current.splice(messageHistory.current.length - 1, 1);

			const bids = updateOrderLevels(feed.bids, delta.bids, SortDirection.ASC);
			const asks = updateOrderLevels(feed.asks, delta.asks, SortDirection.DESC);

			setFeed(createDepthLevels(bids, asks, totalRows));
		}
	}, [messageHistory.current.length, feed.bids, feed.asks, totalRows]);

	function handleToggleFeed() {
		if (selectedProduct === Product.PI_XBTUSD) {
			setSelectedProduct(Product.PI_ETHUSD);
		} else {
			setSelectedProduct(Product.PI_XBTUSD);
		}
	}

	return (
		<div className={styles.feed}>
			<h1 className={styles.h1}>Order Book</h1>

			{connectionState === ConnectionState.INACTIVE && (
				<div className={styles.connectOverlay}>
					<button
						className={styles.buttonDefault}
						onClick={() => setConnectionState(ConnectionState.ACTIVE)}
					>
						CONNECT
					</button>
				</div>
			)}

			<div className={styles.flex}>
				<div className={styles.spreadSection}>
					<Spread
						className={styles.spread}
						bidPrice={feed.bids[0].price}
						askPrice={feed.asks[0].price}
					/>
				</div>
				<table className={styles.tableBids}>
					<thead>
						<tr className={styles.headerRow}>
							<th>TOTAL</th>
							<th>SIZE</th>
							<th>PRICE</th>
						</tr>
					</thead>
					<tbody>
						{feed.bids.slice(0, totalRows).map((level, index) => (
							<tr key={`bid-level-${index}`} className={styles.tr}>
								<td>{formatIntNumber(level.total)}</td>
								<td>{formatIntNumber(level.size)}</td>
								<td className={styles.cellBidPrice}>
									{formatNumber(level.price, 2)}
								</td>
								<td
									className={styles.depthLevelBid}
									style={{ left: `${level.depth}%` }}
								/>
							</tr>
						))}
					</tbody>
				</table>
				<table className={styles.tableAsks}>
					<thead>
						<tr className={styles.headerRow}>
							<th>PRICE</th>
							<th>SIZE</th>
							<th>TOTAL</th>
						</tr>
					</thead>
					<tbody>
						{feed.asks.slice(0, totalRows).map((level, index) => (
							<tr key={`ask-level-${index}`} className={styles.tr}>
								<td className={styles.cellAskPrice}>
									{formatNumber(level.price, 2)}
								</td>
								<td>{formatIntNumber(level.size)}</td>
								<td>{formatIntNumber(level.total)}</td>
								<td
									className={styles.depthLevelAsk}
									style={{ right: `${level.depth}%` }}
								/>
							</tr>
						))}
					</tbody>
				</table>
			</div>
			<footer className={styles.footer}>
				<button className={styles.buttonDefault} onClick={handleToggleFeed}>
					Toggle Feed
				</button>
			</footer>
		</div>
	);
}

export function createOrderLevels(
	priceLevels: [number, number][],
	sortDirection: SortDirection
): OrderLevelSimple[] {
	const orderLevels: OrderLevelSimple[] = [];

	const sortedPriceLevels = priceLevels.sort((a, b) =>
		sort(a[PriceLevel.PRICE], b[PriceLevel.PRICE], sortDirection)
	);

	sortedPriceLevels.forEach((level, index, array) =>
		orderLevels.push({
			price: level[PriceLevel.PRICE],
			size: level[PriceLevel.SIZE],
			total:
				index === 0
					? level[PriceLevel.SIZE]
					: array
							.slice(0, index + 1)
							.map((x) => x[PriceLevel.SIZE])
							.reduce(arrayReducer),
		})
	);
	return orderLevels;
}

export function updateOrderLevels(
	stateOrderLevels: OrderLevel[],
	deltaPriceLevels: [number, number][],
	sortDirection: SortDirection
): OrderLevelSimple[] {
	const orderLevels: OrderLevelSimple[] = [...stateOrderLevels];

	deltaPriceLevels.forEach((delta) => {
		const foundIndex = orderLevels.findIndex(
			(i) => i.price === delta[PriceLevel.PRICE]
		);
		if (foundIndex !== -1) {
			// Delete order level
			if (delta[PriceLevel.SIZE] === 0) {
				orderLevels.splice(foundIndex, 1);
			} else {
				// Update order level
				orderLevels[foundIndex].size = delta[PriceLevel.SIZE];
			}
		} else {
			// New price order level
			if (delta[PriceLevel.SIZE] > 0) {
				orderLevels.push({
					price: delta[PriceLevel.PRICE],
					size: delta[PriceLevel.SIZE],
					total: 0,
				});
			}
			orderLevels.sort((a, b) => sort(a.price, b.price, sortDirection));
		}

		orderLevels.forEach((level, index, array) => {
			level.total =
				index === 0
					? level.size
					: [...array]
							.slice(0, index + 1)
							.map((x) => x.size)
							.reduce(arrayReducer);
		});
	});
	return orderLevels;
}

export function createDepthLevels(
	bids: OrderLevelSimple[],
	asks: OrderLevelSimple[],
	totalItems: number
): FeedData {
	let highestTotal = 0;
	bids.slice(0, totalItems).forEach((level) => {
		highestTotal = Math.max(highestTotal, level.total);
	});

	const calculateDepth = (level: OrderLevelSimple, index: number) => ({
		...level,
		depth: index < totalItems ? 100 - (level.total * 100) / highestTotal : 0,
	});

	return {
		bids: bids.map(calculateDepth),
		asks: asks.map(calculateDepth),
	};
}

function arrayReducer(previousValue: number, currentValue: number): number {
	return previousValue + currentValue;
}

function sort(a: number, b: number, sortDirection: SortDirection) {
	if (sortDirection === SortDirection.ASC) {
		return a - b;
	} else {
		return b - a;
	}
}
