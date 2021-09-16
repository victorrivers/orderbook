import {
	SortDirection,
	createOrderLevels,
	updateOrderLevels,
} from "../../../components/feed/feed";

describe("create order levels", () => {
	test("create order levels - sort ascending", () => {
		const priceLevels: [number, number][] = [
			[1, 1],
			[2, 2],
			[3, 3],
			[4, 4],
		];
		const expected = [
			{ price: 1, size: 1, total: 1 },
			{ price: 2, size: 2, total: 3 },
			{ price: 3, size: 3, total: 6 },
			{ price: 4, size: 4, total: 10 },
		];
		const actual = createOrderLevels(priceLevels, SortDirection.ASC);
		expect(actual).toEqual(expected);
	});

	test("create order levels - sort descending", () => {
		const priceLevels: [number, number][] = [
			[1, 1],
			[2, 2],
			[3, 3],
			[4, 4],
		];
		const expected = [
			{ price: 4, size: 4, total: 4 },
			{ price: 3, size: 3, total: 7 },
			{ price: 2, size: 2, total: 9 },
			{ price: 1, size: 1, total: 10 },
		];
		const actual = createOrderLevels(priceLevels, SortDirection.DESC);
		expect(actual).toEqual(expected);
	});
});

describe("update order levels", () => {
	test("update order levels - sort ascending", () => {
		const stateOrderLevels = [
			{ price: 1, size: 1, total: 1 },
			{ price: 2, size: 2, total: 3 },
			{ price: 3, size: 3, total: 6 },
			{ price: 4, size: 4, total: 10 },
		];
		const deltaPriceLevels: [number, number][] = [
			[1, 1],
			[2, 0],
			[3, 3],
			[4, 11],
		];
		const expected = [
			{ price: 1, size: 1, total: 1 },
			{ price: 3, size: 3, total: 4 },
			{ price: 4, size: 11, total: 15 },
		];
		const actual = updateOrderLevels(
			stateOrderLevels,
			deltaPriceLevels,
			SortDirection.ASC
		);
		expect(actual).toEqual(expected);
	});

	test("update order levels - sort descending", () => {
		const stateOrderLevels = [
			{ price: 1405.5, size: 40, total: 40 },
			{ price: 1320, size: 600, total: 640 },
			{ price: 1210.5, size: 4500, total: 5140 },
			{ price: 1200, size: 1000, total: 6140 },
		];
		const deltaPriceLevels: [number, number][] = [
			[1210.5, 0],
			[1205.5, 451],
			[1576, 3750],
			[1405.5, 1833],
			[1320, 1652],
		];
		const expected = [
			{ price: 1576, size: 3750, total: 3750 },
			{ price: 1405.5, size: 1833, total: 5583 },
			{ price: 1320, size: 1652, total: 7235 },
			{ price: 1205.5, size: 451, total: 7686 },
			{ price: 1200, size: 1000, total: 8686 },
		];
		const actual = updateOrderLevels(
			stateOrderLevels,
			deltaPriceLevels,
			SortDirection.DESC
		);
		expect(actual).toEqual(expected);
	});
});
