import { useEffect, useRef, useState } from "react";
import { ReadyState, useWebSocket } from "../../utils/use-web-socket";
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

/*
 * TODO:
 * - Handle Ready states: Error, Close, etc.
 * - Display 2 decimals.
 */
export const Feed = () => {
	const [feed, setFeed] = useState<FeedData>({
		bids: [],
		asks: [],
	});

	const messageHistory = useRef<Message[]>([]);

	const { sendMessage, lastMessage, readyState, closeConnection } =
		useWebSocket<Message>("wss://www.cryptofacilities.com/ws/v1");

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
		if (messageHistory.current.length > 9) {
			closeConnection();
		}
		if (lastMessage) {
			// TODO: Avoid asking for undefined
			if (lastMessage.feed === "book_ui_1_snapshot") {
				setFeed((x) => {
					const feed = {
						bids: createOrderLevels(lastMessage.bids),
						asks: createOrderLevels(lastMessage.asks),
					};
					return feed;
				});
			}
			messageHistory.current.push(lastMessage);
		}
	}, [lastMessage, closeConnection]);

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
			<div>{connectionStatus}</div>

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
						{feed.asks.map((level, index) => (
							<tr key={`ask-level-${index}`}>
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
							<tr key={`bid-level-${index}`}>
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

// TODO: Create index 0,1 typed.
function createOrderLevels(priceLevels: [number, number][]): OrderLevel[] {
	const orderLevels: OrderLevel[] = [];

	priceLevels
		.sort((a, b) => a[0] - b[0])
		.forEach((level, index, array) =>
			orderLevels.push({
				price: level[0],
				size: level[1],
				total: 0,
			})
		);
	return orderLevels;
}
