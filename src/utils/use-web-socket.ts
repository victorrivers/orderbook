import { useCallback, useEffect, useRef, useState } from "react";

export enum ReadyState {
	CLOSED = WebSocket.CLOSED,
	CLOSING = WebSocket.CLOSING,
	CONNECTING = WebSocket.CONNECTING,
	OPEN = WebSocket.OPEN,
	UNINSTANTIATED = -1,
}

export enum ConnectionState {
	UNINITIALIZED = 0,
	CONNECTED = 1,
	DISCONNECTED = 2,
}

export function useWebSocket<T>(
	socketUrl: string,
	connectionState: ConnectionState
) {
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

	const detachEvenHandlers = useCallback((webSocket?: WebSocket) => {
		if (webSocket) {
			webSocket.removeEventListener("open", onWebSocketOpen);
			webSocket.removeEventListener("message", onWebSocketMessage);
			webSocket.removeEventListener("error", onWebSocketError);
			webSocket.removeEventListener("close", onWebSocketClose);
		}
	}, []);

	useEffect(() => {
		switch (connectionState) {
			case ConnectionState.CONNECTED:
				if (socketUrl) {
					webSocketRef.current = new WebSocket(socketUrl);
					const socket = webSocketRef.current;

					socket.addEventListener("open", onWebSocketOpen);
					socket.addEventListener("message", onWebSocketMessage);
					socket.addEventListener("error", onWebSocketError);
					socket.addEventListener("close", onWebSocketClose);
				}
				break;
			case ConnectionState.DISCONNECTED:
				if (webSocketRef.current) {
					webSocketRef.current.close();
				}
				detachEvenHandlers(webSocketRef.current);
				break;

			default:
				break;
		}

		return () => {
			detachEvenHandlers();
		};
	}, [socketUrl, connectionState, detachEvenHandlers]);

	return { sendMessage, lastMessage, readyState, closeConnection };
}
