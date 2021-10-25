import {
	SortDirection,
	OrderLevel,
	OrderLevelSimple,
	FeedData,
	createOrderLevels,
	updateOrderLevels,
	createDepthLevels,
} from "../../../components/feed/feed";

describe("create order levels", () => {
	test("create order levels - sort ascending", () => {
		const priceLevels: [number, number][] = [
			[4500, 1],
			[2500, 2],
			[1000, 3],
			[3800, 4],
		];
		const expected: OrderLevelSimple[] = [
			{ price: 1000, size: 3 },
			{ price: 2500, size: 2 },
			{ price: 3800, size: 4 },
			{ price: 4500, size: 1 },
		];
		const actual = createOrderLevels(priceLevels, SortDirection.ASC);
		expect(actual).toEqual(expected);
	});

	test("create order levels - sort descending", () => {
		const priceLevels: [number, number][] = [
			[150, 1],
			[40, 4],
			[280, 2],
			[300, 3],
			[2500, 8],
		];
		const expected: OrderLevelSimple[] = [
			{ price: 2500, size: 8 },
			{ price: 300, size: 3 },
			{ price: 280, size: 2 },
			{ price: 150, size: 1 },
			{ price: 40, size: 4 } 
		];
		const actual = createOrderLevels(priceLevels, SortDirection.DESC);
		expect(actual).toEqual(expected);
	});
});

describe("update order levels", () => {
	test("update order levels - sort ascending", () => {
		const stateOrderLevels: OrderLevel[] = [
			{ price: 1, size: 1, total: 1, depth: 0 },
			{ price: 2, size: 2, total: 3, depth: 0 },
			{ price: 3, size: 3, total: 6, depth: 0 },
			{ price: 4, size: 4, total: 10, depth: 0 },
		];
		const deltaPriceLevels: [number, number][] = [
			[1, 1],
			[2, 0],
			[3, 3],
			[4, 11],
		];
		const expected: OrderLevelSimple[] = [
			{ price: 1, size: 1 },
			{ price: 3, size: 3 },
			{ price: 4, size: 11 },
		];
		const actual = updateOrderLevels(
			stateOrderLevels,
			deltaPriceLevels,
			SortDirection.ASC
		);
		expect(actual).toMatchObject(expected);
	});

	test("update order levels - sort descending", () => {
		const stateOrderLevels: OrderLevel[] = [
			{ price: 1405.5, size: 40, total: 40, depth: 0 },
			{ price: 1320, size: 600, total: 640, depth: 0 },
			{ price: 1210.5, size: 4500, total: 5140, depth: 0 },
			{ price: 1200, size: 1000, total: 6140, depth: 0 },
		];
		const deltaPriceLevels: [number, number][] = [
			[1210.5, 0],
			[1205.5, 451],
			[1576, 3750],
			[1405.5, 1833],
			[1320, 1652],
		];
		const expected: OrderLevelSimple[] = [
			{ price: 1576, size: 3750 },
			{ price: 1405.5, size: 1833 },
			{ price: 1320, size: 1652 },
			{ price: 1205.5, size: 451 },
			{ price: 1200, size: 1000 },
		];
		const actual = updateOrderLevels(
			stateOrderLevels,
			deltaPriceLevels,
			SortDirection.DESC
		);
		expect(actual).toMatchObject(expected);
	});
});

describe("create depth levels", () => {
	test("create depth levels - total items is 20", () => {
		const bids: OrderLevelSimple[] = [
			{ price: 42259.0, size: 470649 },
			{ price: 42400.0, size: 475589 },
			{ price: 42421.0, size: 26730 },
			{ price: 42573.0, size: 182604 },
			{ price: 42620.5, size: 26730 },
			{ price: 42687.0, size: 2029 },
			{ price: 42709.5, size: 7053 },
			{ price: 42722.0, size: 17488 },
		];

		const asks: OrderLevelSimple[] = [
			{ price: 43474.5, size: 26730 },
			{ price: 43438.5, size: 16428 },
			{ price: 43433.5, size: 11562 },
			{ price: 43387.5, size: 480314 },
			{ price: 43281.5, size: 26730 },
			{ price: 43203.0, size: 2086 },
			{ price: 43162.5, size: 17669 },
			{ price: 43152.5, size: 26730 },
		];

		const expected: FeedData = {
			bids: [
				{
					price: 42259,
					size: 470649,
					total: 470649,
					depth: 61.06709395204786,
				},
				{
					price: 42400,
					size: 475589,
					total: 946238,
					depth: 21.725542489196542,
				},
				{
					price: 42421,
					size: 26730,
					total: 972968,
					depth: 19.51439027457002,
				},
				{
					price: 42573,
					size: 182604,
					total: 1155572,
					depth: 4.409068950227976,
				},
				{
					price: 42620.5,
					size: 26730,
					total: 1182302,
					depth: 2.197916735601453,
				},
				{
					price: 42687,
					size: 2029,
					total: 1184331,
					depth: 2.0300743172147264,
				},
				{
					price: 42709.5,
					size: 7053,
					total: 1191384,
					depth: 1.446637857440649,
				},
				{ price: 42722, size: 17488, total: 1208872, depth: 0 },
			],
			asks: [
				{
					price: 43474.5,
					size: 26730,
					total: 26730,
					depth: 97.78884778537348,
				},
				{
					price: 43438.5,
					size: 16428,
					total: 43158,
					depth: 96.42989497647393,
				},
				{
					price: 43433.5,
					size: 11562,
					total: 54720,
					depth: 95.47346617342448,
				},
				{
					price: 43387.5,
					size: 480314,
					total: 535034,
					depth: 55.741054470613925,
				},
				{
					price: 43281.5,
					size: 26730,
					total: 561764,
					depth: 53.5299022559874,
				},
				{
					price: 43203,
					size: 2086,
					total: 563850,
					depth: 53.35734469819799,
				},
				{
					price: 43162.5,
					size: 17669,
					total: 581519,
					depth: 51.895734205110216,
				},
				{
					price: 43152.5,
					size: 26730,
					total: 608249,
					depth: 49.68458199048369,
				},
			],
		};
		const actual = createDepthLevels(bids, asks, 20);
		expect(actual).toEqual(expected);
	});

	test("create depth levels - total items is 6", () => {
		const bids: OrderLevelSimple[] = [
			{ price: 2933.45, size: 45304 },
			{ price: 2939.55, size: 40288 },
			{ price: 2940.5, size: 133637 },
			{ price: 2940.7, size: 15891 },
			{ price: 2940.75, size: 151463 },
			{ price: 2940.9, size: 3275 },
			{ price: 2941.0, size: 5008 },
			{ price: 2941.1, size: 3932 },
		];

		const asks: OrderLevelSimple[] = [
			{ price: 2981.95, size: 36514 },
			{ price: 2955.95, size: 48610 },
			{ price: 2949.2, size: 5000 },
			{ price: 2948.9, size: 31773 },
			{ price: 2948.85, size: 4141 },
			{ price: 2948.6, size: 1824 },
			{ price: 2948.5, size: 5862 },
			{ price: 2948.45, size: 3003 },
		];

		const expected: FeedData = {
			bids: [
				{
					price: 2933.45,
					size: 45304,
					depth: 80.73154134059203,
					total: 45304
				},
				{
					price: 2939.55,
					size: 40288,
					depth: 63.59646138142225,
					total: 85592
				},
				{
					price: 2940.5,
					size: 133637,
					depth: 6.758676420551211,
					total: 219229
				},
				{ price: 2940.7, size: 15891, depth: 0, total: 235120 }
			],
			asks: [
				{
					price: 2981.95,
					size: 36514,
					depth: 84.47005784280367,
					total: 36514
				},
				{
					price: 2955.95,
					size: 48610,
					depth: 63.79550867642055,
					total: 85124
				},
				{
					price: 2949.2,
					size: 5000,
					depth: 61.668935011908815,
					total: 90124
				},
				{
					price: 2948.9,
					size: 31773,
					depth: 48.155410003402515,
					total: 121897
				}
			],
		};
		const actual = createDepthLevels(bids, asks, 4);
		expect(actual).toEqual(expected);
	});
});
