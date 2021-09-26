import { useState, useRef, useCallback, useEffect } from "react";

interface FramesPerSecondResult {
	elapsedTime: number;
	currentFps: number;
}

export function useFramesPerSecond(
	stop: boolean,
	fps: number
): FramesPerSecondResult {
	const handle = useRef(0);
	const frameCount = useRef(0);
	const fpsInterval = useRef(0);
	const startTime = useRef(0);
	const now = useRef(0);
	const then = useRef(0);
	const elapsed = useRef(0);

	const [result, setResult] = useState<FramesPerSecondResult>({
		elapsedTime: 0,
		currentFps: 0,
	});

	const animate = useCallback(() => {
		handle.current = requestAnimationFrame(animate);

		now.current = Date.now();
		elapsed.current = now.current - then.current;

		if (elapsed.current > fpsInterval.current) {
			then.current = now.current - (elapsed.current % fpsInterval.current);
			var sinceStart = now.current - startTime.current;
			var currentFps =
				Math.round((1000 / (sinceStart / ++frameCount.current)) * 100) / 100;
			setResult({
				elapsedTime: Math.round((sinceStart / 1000) * 100) / 100,
				currentFps,
			});
		}
	}, []);

	useEffect(() => {
		if (stop) {
			cancelAnimationFrame(handle.current);
		} else {
			fpsInterval.current = 1000 / fps;
			then.current = Date.now();
			startTime.current = then.current;
			frameCount.current = 0;
			animate();
		}
	}, [fps, stop, animate]);

	return result;
}

export function useSupportedFps() {
	const [result, setResult] = useState("");

	useEffect(() => {
		var t, previousTime: number;
		var drawLoad = 1;
		var slowCount = 0;
		var maxSlow = 10;
		// Note, you might need to polyfill performance.now and requestAnimationFrame
		t = previousTime = performance.now();
		var tick = function () {
			var maximumFrameTime = 1000 / 60; // 300 FPS
			t = performance.now();
			var elapsed = t - previousTime;
			previousTime = t;
			if (elapsed < maximumFrameTime || slowCount < maxSlow) {
				if (elapsed < maximumFrameTime) {
					drawLoad += 10;
				} else {
					slowCount++;
				}
				setResult("drawLoad:" + drawLoad);
				requestAnimationFrame(tick);
			} else {
				// found maximum sustainable load at 300 FPS
				setResult("could draw " + drawLoad + " in " + maximumFrameTime + " ms");
			}
		};
		requestAnimationFrame(tick);
	}, []);

	return result;
}
