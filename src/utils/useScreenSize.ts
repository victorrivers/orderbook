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
	const tableHeader = document.querySelector("table thead tr") as HTMLElement;
	const header = document.querySelector("h1") as HTMLElement;
	const footer = document.querySelector("footer") as HTMLElement;
	const tableRow = document.querySelector("table tbody tr") as HTMLElement;

	if (tableHeader && tableRow && header && footer) {
		const offset =
			header.offsetHeight + tableHeader.offsetHeight + footer.offsetHeight;
		return Math.ceil((innerHeight - offset) / tableRow.scrollHeight);
	}
	return 20;
}
