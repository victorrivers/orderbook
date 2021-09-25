import { useState, useEffect } from "react";
import { ConnectionState, ReadyState, useWebSocket } from "./use-web-socket";

export enum Product {
	PI_XBTUSD = "PI_XBTUSD",
	PI_ETHUSD = "PI_ETHUSD",
}

export interface DataMessage {
	bids: [number, number][];
	asks: [number, number][];
}

interface EventMessage {
	event: string;
	product_ids: Product[];
}

interface FeedMessage {
	feed: string;
}

export function useData(
	connectionState: ConnectionState,
	selectedProduct: Product
): {
	snapshotMessage: DataMessage;
	deltaMessage: DataMessage;
} {
	const [subscribedProduct, setSubscribedProduct] = useState<Product>();
	const [snapshotMessage, setSnapshotMessage] = useState<DataMessage>({
		bids: [],
		asks: [],
	});
	const [deltaMessage, setDeltaMessage] = useState<DataMessage>({
		bids: [],
		asks: [],
	});

	const { readyState, sendMessage, lastMessage } = useWebSocket(
		"wss://www.cryptofacilities.com/ws/v1",
		connectionState
	);

	const feedName = "book_ui_1";

	useEffect(() => {
		if (readyState === ReadyState.OPEN) {
			// Subscribe.
			if (subscribedProduct === undefined) {
				sendMessage({
					event: "subscribe",
					feed: feedName,
					product_ids: [selectedProduct],
				});
			} else if (selectedProduct !== subscribedProduct) {
				// Unsubscribe.
				sendMessage({
					event: "unsubscribe",
					feed: feedName,
					product_ids: [subscribedProduct],
				});
			}
		} else if (readyState === ReadyState.CLOSED) {
			setSubscribedProduct(undefined);
		}
	}, [readyState, sendMessage, selectedProduct, subscribedProduct]);

	useEffect(() => {
		const message: EventMessage = lastMessage as EventMessage;
		if (message.event !== undefined) {
			switch (message.event) {
				case "subscribed":
					setSubscribedProduct(message.product_ids[0]);
					break;
				case "unsubscribed":
					setSubscribedProduct(undefined);
					break;
				case "alert":
					console.warn("Alert", message);
					break;
			}
		} else {
			const feedMessage: FeedMessage = lastMessage as FeedMessage;
			if (feedMessage.feed === "book_ui_1_snapshot") {
				setSnapshotMessage(lastMessage as DataMessage);
			} else if (feedMessage.feed === feedName) {
				setDeltaMessage(lastMessage as DataMessage);
			}
		}
	}, [lastMessage]);

	return { snapshotMessage, deltaMessage };
}
