import { useEffect, useState } from "react";

export function useScreenSize() {
	const layoutSmallWidth = 768;
	const layoutSmallTotalRows = 12;

	const isLayoutSmallFn = (width: number) => width < layoutSmallWidth;

	const [isLayoutSmall, setIsLayoutSmall] = useState(
		isLayoutSmallFn(window.innerWidth)
	);

	const [totalRows, setTotalRows] = useState(20);

	useEffect(() => {
		let timeoutId: NodeJS.Timeout;
		function handleWindowResize(this: Window) {
			clearTimeout(timeoutId);
			timeoutId = setTimeout(() => {
				const isSmall = isLayoutSmallFn(this.innerWidth);
				setIsLayoutSmall(isSmall);
				setTotalRows(
					isSmall ? layoutSmallTotalRows : calculateTotalRows(this.innerHeight)
				);
			}, 500);
		}

		const isWindowMobileWidth = isLayoutSmallFn(window.innerWidth);
		setIsLayoutSmall(isWindowMobileWidth);
		setTotalRows(
			isWindowMobileWidth
				? layoutSmallTotalRows
				: calculateTotalRows(window.innerHeight)
		);

		window.addEventListener("resize", handleWindowResize);

		return () => window.removeEventListener("resize", handleWindowResize);
	}, []);

	return { totalRows, isLayoutSmall };
}

function calculateTotalRows(innerHeight: number) {
	const rows = document.querySelector("table")?.querySelectorAll("tbody tr");
	if (rows) {
		return Math.max(
			Math.floor((innerHeight * rows.length) / document.body.scrollHeight),
			20
		);
	}
	return 20;
}
