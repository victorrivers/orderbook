import { useCallback, useEffect, useRef, useState } from "react";

export enum ReadyState {
	CLOSED = WebSocket.CLOSED,
	CLOSING = WebSocket.CLOSING,
	CONNECTING = WebSocket.CONNECTING,
	OPEN = WebSocket.OPEN,
	UNINSTANTIATED = -1,
}

export function useWebSocket<T>(socketUrl: string) {
	const [readyState, setReadyState] = useState<ReadyState>(
		ReadyState.UNINSTANTIATED
	);

	const [lastMessage, setLastMessage] = useState<T>();

	const webSocketRef = useRef<WebSocket>();

	function onWebSocketOpen(this: WebSocket) {
		setReadyState(this.readyState);
	}

	function onWebSocketMessage(this: WebSocket, ev: Event & { data: string }) {
		setLastMessage(JSON.parse(ev.data));
	}

	function onWebSocketError(this: WebSocket) {
		setReadyState(this.readyState);
	}

	function onWebSocketClose(this: WebSocket) {
		setReadyState(this.readyState);
	}

	const sendMessage = useCallback((message) => {
		if (
			webSocketRef.current &&
			webSocketRef.current.readyState === ReadyState.OPEN
		) {
			webSocketRef.current.send(JSON.stringify(message));
		}
	}, []);

	function closeConnection() {
		if (
			webSocketRef.current &&
			webSocketRef.current.readyState !== ReadyState.CLOSED
		) {
			webSocketRef.current.close();
		}
	}

	useEffect(() => {
		webSocketRef.current = new WebSocket(socketUrl);
		const socket = webSocketRef.current;

		socket.addEventListener("open", onWebSocketOpen);
		socket.addEventListener("message", onWebSocketMessage);
		socket.addEventListener("error", onWebSocketError);
		socket.addEventListener("close", onWebSocketClose);

		return () => {
			socket.removeEventListener("open", onWebSocketOpen);
			socket.removeEventListener("message", onWebSocketMessage);
			socket.removeEventListener("error", onWebSocketError);
			socket.removeEventListener("close", onWebSocketClose);
			socket.close();
		};
	}, [socketUrl]);

	return { sendMessage, lastMessage, readyState, closeConnection };
}
