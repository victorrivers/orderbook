import { useEffect, useReducer, useRef, useState } from "react";
import { useFormatter } from "../../utils/locale";
import { Product, useData } from "../../utils/use-data";
import { useFramesPerSecond } from "../../utils/use-fps";
import { ConnectionState } from "../../utils/use-web-socket";
import { useScreenSize } from "../../utils/useScreenSize";
import { Spread } from "../spread/spread";
import styles from "./feed.module.scss";

export type OrderLevelSimple = {
	price: number;
	size: number;
};

export type OrderLevel = OrderLevelSimple & {
	total: number;
	depth: number;
};

export type FeedData = {
	bids: OrderLevel[];
	asks: OrderLevel[];
};

export enum SortDirection {
	ASC = 0,
	DESC = 1,
}

type FeedDataSimple = {
	bids: OrderLevelSimple[];
	asks: OrderLevelSimple[];
};

enum PriceLevel {
	PRICE = 0,
	SIZE = 1,
}

export function Feed() {
	const feedRef = useRef<FeedDataSimple>({
		bids: [{ price: 0, size: 0 }],
		asks: [{ price: 0, size: 0 }],
	});

	const [connectionState, setConnectionState] = useState(
		ConnectionState.INACTIVE
	);

	const [selectedProduct, setSelectedProduct] = useState<Product>(
		Product.PI_XBTUSD
	);

	const { snapshotMessage, deltaMessage } = useData(
		connectionState,
		selectedProduct
	);

	const [state, dispatch] = useReducer(reducer, createDepthLevels(feedRef.current.bids, feedRef.current.asks, 1));

	const framesPerSecond = 2;
	const { elapsedTime } = useFramesPerSecond(
		connectionState !== ConnectionState.ACTIVE,
		framesPerSecond
	);

	const { totalRows, isLayoutSmall } = useScreenSize();

	useEffect(() => {
		dispatch(createDepthLevels(feedRef.current.bids, feedRef.current.asks, totalRows));
	}, [elapsedTime, totalRows]);

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
		const bids = createOrderLevels(snapshotMessage.bids, SortDirection.DESC);
		const asks = createOrderLevels(snapshotMessage.asks, SortDirection.ASC);

		feedRef.current = {bids, asks};
		dispatch(createDepthLevels(bids, asks, totalRows));
	}, [snapshotMessage, totalRows]);

	useEffect(() => {
		const bids = updateOrderLevels(
			feedRef.current.bids,
			deltaMessage.bids,
			SortDirection.DESC
		);
		const asks = updateOrderLevels(
			feedRef.current.asks,
			deltaMessage.asks,
			SortDirection.ASC
		);

		feedRef.current = {bids, asks};
	}, [deltaMessage, totalRows]);

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
			<div className={styles.flex}>
				<div className={styles.spreadSection}>
					<Spread
						className={styles.spread}
						bidPrice={state.bids.length ? state.bids[0].price : 0}
						askPrice={state.asks.length ? state.asks[0].price : 0}
					/>
				</div>
				<Table
					items={state.bids.slice(0, totalRows)}
					type="BIDS"
					isLayoutSmall={isLayoutSmall}
				/>
				<Table
					items={state.asks.slice(0, totalRows)}
					type="ASKS"
					isLayoutSmall={isLayoutSmall}
				/>
			</div>
			<footer className={styles.footer}>
				<button className={styles.buttonDefault} onClick={handleToggleFeed}>
					Toggle Feed
				</button>
			</footer>
			{connectionState === ConnectionState.INACTIVE && (
				<div className={styles.connectionWarningContainer}>
					<div className={styles.connectionWarning}>
						<div>
							<h3>Warning:</h3>
							<div>Feed disconnected due to inactivity.</div>
						</div>
						<button
							className={styles.buttonDefault}
							onClick={() => setConnectionState(ConnectionState.ACTIVE)}
						>
							RECONNECT
						</button>
					</div>
				</div>
			)}
		</div>
	);
}

interface TableProps {
	items: OrderLevel[];
	type: "BIDS" | "ASKS";
	isLayoutSmall: boolean;
}

function Table(props: TableProps): JSX.Element {
	const { type, isLayoutSmall } = props;

	const { formatIntNumber, formatNumber } = useFormatter();

	const [items, setItems] = useState(props.items);

	const classNames =
		type === "BIDS"
			? {
					table: styles.tableBids,
					cellPrice: styles.cellBidPrice,
					cellDepth: styles.depthLevelBid,
			  }
			: {
					table: styles.tableAsks,
					cellPrice: styles.cellAskPrice,
					cellDepth: styles.depthLevelAsk,
			  };

	const columnsRef = useRef([
		{
			header: "PRICE",
			cell: (level: OrderLevel) => (
				<td key="price" className={classNames.cellPrice}>
					{formatNumber(level.price, 2)}
				</td>
			),
		},
		{
			header: "SIZE",
			cell: (level: OrderLevel) => (
				<td key="size">{formatIntNumber(level.size)}</td>
			),
		},
		{
			header: "TOTAL",
			cell: (level: OrderLevel) => (
				<td key="total">{formatIntNumber(level.total)}</td>
			),
		},
	]);

	const [columns, setColumns] = useState(columnsRef.current);

	useEffect(() => {
		const invertColumns = type === "BIDS" && !isLayoutSmall;

		if (invertColumns) {
			setColumns([...columnsRef.current].reverse());
		} else {
			setColumns(columnsRef.current);
		}
	}, [type, isLayoutSmall]);

	useEffect(() => {
		const invertRows = type === "ASKS" && isLayoutSmall;

		if (invertRows) {
			setItems([...props.items].reverse());
		} else {
			setItems(props.items);
		}
	}, [type, isLayoutSmall, props.items]);

	return (
		<table className={classNames.table}>
			<thead>
				<tr className={styles.headerRow}>
					{columns.map((col, index) => (
						<th key={`col-${index}`}>{col.header}</th>
					))}
				</tr>
			</thead>
			<tbody>
				{items.map((level, index) => (
					<tr key={`order-level-${index}`} className={styles.tr}>
						{columns.map((col) => col.cell(level))}
						<td
							className={classNames.cellDepth}
							style={
								isLayoutSmall
									? { left: 0, right: `${level.depth}%` }
									: type === "BIDS"
									? { left: `${level.depth}%` }
									: { right: `${level.depth}%` }
							}
						/>
					</tr>
				))}
			</tbody>
		</table>
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

	sortedPriceLevels.forEach((level) =>
		orderLevels.push({
			price: level[PriceLevel.PRICE],
			size: level[PriceLevel.SIZE],
		})
	);
	return orderLevels;
}

export function updateOrderLevels(
	stateOrderLevels: OrderLevelSimple[],
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
				});
			}
			orderLevels.sort((a, b) => sort(a.price, b.price, sortDirection));
		}
	});
	return orderLevels;
}

export function createDepthLevels(
	bids: OrderLevelSimple[],
	asks: OrderLevelSimple[],
	totalItems: number
): FeedData {
	const _bids = bids.slice(0, totalItems).map((level, index, array) => (
		{...level,
			depth:0,
			total:
				index === 0
					? level.size
					: [...array]
							.slice(0, index + 1)
							.map((x) => x.size)
							.reduce(arrayReducer),
		}));

	const _asks = asks.slice(0, totalItems).map((level, index, array) => (
		{...level,
			depth:0,
			total:
				index === 0
					? level.size
					: [...array]
							.slice(0, index + 1)
							.map((x) => x.size)
							.reduce(arrayReducer),
		}));

	let highestTotal = 0;
	_bids.slice(0, totalItems).forEach((level) => {
		highestTotal = Math.max(highestTotal, level.total);
	});
	_asks.slice(0, totalItems).forEach((level) => {
		highestTotal = Math.max(highestTotal, level.total);
	});

	const calculateDepth = (level: OrderLevel, index: number) => ({
		...level,
		depth: index < totalItems ? 100 - (level.total * 100) / highestTotal : 0,
	});

	return {
		bids: _bids.map(calculateDepth),
		asks: _asks.map(calculateDepth),
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

function reducer(_state: FeedData, state: FeedData) {
	return state;
}
