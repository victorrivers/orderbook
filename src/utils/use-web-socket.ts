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
	ACTIVE = 1,
	INACTIVE = 2,
}

interface WebSocketData {
    sendMessage: (message: Object) => void;
    lastMessage: Object;
    readyState: ReadyState;
};

export function useWebSocket(
	socketUrl: string,
	connectionState: ConnectionState
): WebSocketData {
	const [readyState, setReadyState] = useState<ReadyState>(
		ReadyState.UNINSTANTIATED
	);

	const [lastMessage, setLastMessage] = useState({});

	const webSocketRef = useRef<WebSocket>();

	function onWebSocketOpen(this: WebSocket) {
		setReadyState(this.readyState);
	}

	function onWebSocketMessage(this: WebSocket, ev: MessageEvent<string>) {
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
			case ConnectionState.ACTIVE:
				if (socketUrl) {
					webSocketRef.current = new WebSocket(socketUrl);
					const socket = webSocketRef.current;

					socket.addEventListener("open", onWebSocketOpen);
					socket.addEventListener("message", onWebSocketMessage);
					socket.addEventListener("error", onWebSocketError);
					socket.addEventListener("close", onWebSocketClose);
				}
				break;
			case ConnectionState.INACTIVE:
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

	return { sendMessage, lastMessage, readyState };
}
