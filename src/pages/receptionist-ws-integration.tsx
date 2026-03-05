import { useNotificationsWebSocket } from "@/lib/use-notifications-ws";

// ...existing code...

export default function ReceptionistPage() {
  // ...existing state...
  const [notifications, setNotifications] = useState<NotificationApi[]>([]);
  // ...existing state...

  // Recupera il token di autenticazione
  const token = localStorage.getItem("authToken") || "";

  // Integra WebSocket per notifiche in tempo reale
  useNotificationsWebSocket({
    token,
    onMessage: (notification) => {
      setNotifications((prev) => {
        // Evita duplicati (es: se arriva una notifica già presente)
        if (prev.some((n) => n.id === notification.id)) return prev;
        return [notification, ...prev];
      });
    },
  });

  // ...resto del componente...
}
