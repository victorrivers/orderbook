import { useEffect, useRef, useState } from "react";
import {
	ConnectionState,
	ReadyState,
	useWebSocket,
} from "../../utils/use-web-socket";
import styles from "./feed.module.css";

interface Message {
	event: string;
	feed: string;
	bids: [number, number][];
	asks: [number, number][];
}

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

/*
 * TODO:
 * - Handle Ready states: Error, Close, etc.
 * - Display 2 decimals.
 */
export function Feed() {
	const [feed, setFeed] = useState<FeedData>({
		bids: [],
		asks: [],
	});

	const [connectionState, setConnectionState] = useState(
		ConnectionState.DISCONNECTED
	);

	const { sendMessage, lastMessage, readyState } = useWebSocket<Message>(
		"wss://www.cryptofacilities.com/ws/v1",
		connectionState
	);

	const messageHistory = useRef<Message[]>([]);

	useEffect(() => {
		setConnectionState(ConnectionState.CONNECTED);
	}, []);

	useEffect(() => {
		if (readyState === ReadyState.OPEN) {
			sendMessage({
				event: "subscribe",
				feed: "book_ui_1",
				product_ids: ["PI_XBTUSD"],
			});
		}
	}, [readyState, sendMessage]);

	useEffect(() => {
		// TODO: Avoid asking for undefined
		if (lastMessage) {
			if (lastMessage.feed === "book_ui_1_snapshot") {
				setFeed({
					bids: createOrderLevels(lastMessage.bids, SortDirection.ASC),
					asks: createOrderLevels(lastMessage.asks, SortDirection.DESC),
				});
			} else if (
				lastMessage.event === undefined &&
				lastMessage.feed === "book_ui_1" &&
				(lastMessage.bids.length > 0 || lastMessage.asks.length > 0)
			) {
				messageHistory.current.push(lastMessage);
			}
		}
	}, [lastMessage]);

	useEffect(() => {

		if (messageHistory.current.length > 0) {

			const deltaMessage = messageHistory.current[messageHistory.current.length - 1];
			messageHistory.current.splice(messageHistory.current.length - 1 , 1);

			setFeed({
				bids: updateOrderLevels(
					feed.bids,
					deltaMessage.bids,
					SortDirection.ASC,
				),
				asks: updateOrderLevels(
					feed.asks,
					deltaMessage.asks,
					SortDirection.DESC,
				)
			});
		}

	}, [messageHistory.current.length, feed.bids, feed.asks]);

	const connectionStatus = {
		[ReadyState.CONNECTING]: "Connecting",
		[ReadyState.OPEN]: "Open",
		[ReadyState.CLOSING]: "Closing",
		[ReadyState.CLOSED]: "Closed",
		[ReadyState.UNINSTANTIATED]: "Uninstantiated",
	}[readyState];

	function handleToggleFeed() {}

	return (
		<div>
			<div>Orderbook: {connectionStatus}</div>
			<div>
				<button onClick={() => setConnectionState(ConnectionState.CONNECTED)}>
					CONNECT
				</button>
				<button
					onClick={() => setConnectionState(ConnectionState.DISCONNECTED)}
				>
					DISCONNECT
				</button>
			</div>

			<div className={styles.flex}>
				<table>
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
								<td>{level.price}</td>
							</tr>
						))}
					</tbody>
				</table>
				<table>
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
								<td>{level.price}</td>
								<td>{level.size}</td>
								<td>{level.total}</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
			<hr />
			<button onClick={handleToggleFeed}>Toggle Feed</button>
		</div>
	);
};

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
	sortDirection: SortDirection,
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
