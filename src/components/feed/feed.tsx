import { useEffect, useRef, useState } from "react";
import { DataMessage, Product, useData } from "../../utils/use-data";
import {
	ConnectionState,
} from "../../utils/use-web-socket";
import { Spread } from "../spread/spread";
import styles from "./feed.module.scss";

type OrderLevel = {
	price: number;
	size: number;
	total: number;
};

type FeedData = {
	bids: OrderLevel[];
	asks: OrderLevel[];
};

enum PriceLevel {
	PRICE = 0,
	SIZE = 1,
}

export enum SortDirection {
	ASC = 0,
	DESC = 1,
}

export function Feed() {
	const [selectedProduct, setSelectedProduct] = useState<Product>(Product.PI_XBTUSD);

	const [feed, setFeed] = useState<FeedData>({
		bids: [{ price: 0, size: 0, total: 0 }],
		asks: [{ price: 0, size: 0, total: 0 }],
	});

	const [connectionState, setConnectionState] = useState(
		ConnectionState.INACTIVE
	);

	const { snapshotMessage, deltaMessage } = useData(
		connectionState, selectedProduct
	);

	const messageHistory = useRef<DataMessage[]>([]);

	useEffect(() => {
		setConnectionState(ConnectionState.ACTIVE);
	}, []);

	useEffect(() => {
		setFeed({
			bids: createOrderLevels(snapshotMessage.bids, SortDirection.ASC),
			asks: createOrderLevels(snapshotMessage.asks, SortDirection.DESC),
		});
	}, [snapshotMessage]);

	useEffect(() => {
		messageHistory.current.push(deltaMessage);
	}, [deltaMessage]);


	useEffect(() => {
		if (messageHistory.current.length > 0) {

			const delta = messageHistory.current[messageHistory.current.length - 1];
			messageHistory.current.splice(messageHistory.current.length - 1 , 1);

			setFeed({
				bids: updateOrderLevels(
					feed.bids,
					delta.bids,
					SortDirection.ASC,
				),
				asks: updateOrderLevels(
					feed.asks,
					delta.asks,
					SortDirection.DESC,
				)
			});
		}
	}, [messageHistory.current.length, feed.bids, feed.asks]);

	function handleToggleFeed() {
		if (selectedProduct === Product.PI_XBTUSD) {
			setSelectedProduct(Product.PI_ETHUSD);
		} else {
			setSelectedProduct(Product.PI_XBTUSD);
		}
	}

	return (
		<div className={styles.feed}>
			<div className={styles.header}>
				<span className={styles.leftText}>Order Book</span>
				<Spread bidPrice={feed.bids[0].price} askPrice={feed.asks[0].price} />
				<div style={{ position: "absolute", right: 0, top: 0 }}>
					<div>
						<button
							onClick={() => setConnectionState(ConnectionState.ACTIVE)}
						>
							CONNECT
						</button>
						<button
							onClick={() => setConnectionState(ConnectionState.INACTIVE)}
						>
							DISCONNECT
						</button>
					</div>
				</div>
			</div>

			<div className={styles.flex}>
				<table className={styles.table}>
					<thead>
						<tr>
							<th>TOTAL</th>
							<th>SIZE</th>
							<th>PRICE</th>
						</tr>
					</thead>
					<tbody>
						{feed.bids.map((level, index) => (
							<tr key={`bid-level-${index}`}>
								<td>{level.total}</td>
								<td>{level.size}</td>
								<td className={styles.cellBidPrice}>{level.price}</td>
							</tr>
						))}
					</tbody>
				</table>
				<table className={styles.table}>
					<thead>
						<tr>
							<th>PRICE</th>
							<th>SIZE</th>
							<th>TOTAL</th>
						</tr>
					</thead>
					<tbody>
						{feed.asks.map((level, index) => (
							<tr key={`ask-level-${index}`}>
								<td className={styles.cellAskPrice}>{level.price}</td>
								<td>{level.size}</td>
								<td>{level.total}</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
			<button onClick={handleToggleFeed}>Toggle Feed</button>
		</div>
	);
}

export function createOrderLevels(
	priceLevels: [number, number][],
	sortDirection: SortDirection
): OrderLevel[] {
	const orderLevels: OrderLevel[] = [];

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
							.reduce(reducer),
		})
	);
	return orderLevels;
}

export function updateOrderLevels(
	stateOrderLevels: OrderLevel[],
	deltaPriceLevels: [number, number][],
	sortDirection: SortDirection
): OrderLevel[] {
	const orderLevels: OrderLevel[] = [...stateOrderLevels];

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
	});

	orderLevels.forEach((level, index, array) => {
		level.total =
			index === 0
				? level.size
				: [...array]
						.slice(0, index + 1)
						.map((x) => x.size)
						.reduce(reducer);
	});

	return orderLevels;
}

function reducer(previousValue: number, currentValue: number): number {
	return previousValue + currentValue;
}

function sort(a: number, b: number, sortDirection: SortDirection) {
	if (sortDirection === SortDirection.ASC) {
		return a - b;
	} else {
		return b - a;
	}
}
