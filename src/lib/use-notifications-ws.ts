import { useEffect, useRef } from "react";
import { Client } from "@stomp/stompjs";

export function useNotificationsWebSocket({
  onMessage,
  token,
}: {
  onMessage: (notification: any) => void;
  token: string;
}) {
  const clientRef = useRef<Client | null>(null);
  const onMessageRef = useRef(onMessage);

  // Mantiene aggiornata la callback SENZA ricreare la socket
  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    const defaultBaseUrl =
      (import.meta.env.VITE_WEBSOCKET_URL as string) ||
      "http://localhost:8080";

    if (!token) return;

    const wsUrl = defaultBaseUrl + "/ws/notifications";

    const client = new Client({
      brokerURL: wsUrl,
      onConnect: () => {
        client.subscribe(
          "/topic/notifications/receptionist",
          (message) => {
            try {
              onMessageRef.current(JSON.parse(message.body));
            } catch {
              onMessageRef.current(message.body);
            }
          },
          {
            token: `${token}`,
          }
        );
      },
    });

    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
    };
  }, [token]);
}