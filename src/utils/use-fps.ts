import { useState, useRef, useCallback, useEffect } from "react";

interface FramesPerSecondResult {
    elapsedTime: number;
    currentFps: number;
}

export function useFramesPerSecond(stop:boolean, fps:number): FramesPerSecondResult {
	const handle = useRef(0);
	const frameCount = useRef(0);
	const fpsInterval = useRef(0);
	const startTime = useRef(0);
	const now = useRef(0);
	const then = useRef(0);
	const elapsed = useRef(0);

	const [result, setResult] = useState<FramesPerSecondResult>({ elapsedTime: 0, currentFps: 0 });

	const animate = useCallback(() => {

		handle.current = requestAnimationFrame(animate);

		now.current = Date.now();
		elapsed.current = now.current - then.current;

		if (elapsed.current > fpsInterval.current) {
			then.current = now.current - (elapsed.current % fpsInterval.current);
			var sinceStart = now.current - startTime.current;
			var currentFps = Math.round(1000 / (sinceStart / ++frameCount.current) * 100) / 100;
			setResult({ elapsedTime: Math.round(sinceStart / 1000 * 100) / 100, currentFps });
		}
	},[])

	useEffect(()=>{
		if (stop){
			cancelAnimationFrame(handle.current);
		} else {
			fpsInterval.current = 1000 / fps;
			then.current = Date.now();
			startTime.current = then.current;
			frameCount.current = 0;
			animate();
		}
	},[fps, stop, animate]);

	return result;
}