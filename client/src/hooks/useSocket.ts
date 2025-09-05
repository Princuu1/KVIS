import { useEffect, useRef, useState } from "react";
import { useAuth } from "./useAuth";

interface ChatMessage {
  id: string;
  userId: string;
  message: string;
  room: string;
  createdAt: string;
}

export const useSocket = () => {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [onlineCount, setOnlineCount] = useState(0);
  const ws = useRef<WebSocket | null>(null);

  const connect = () => {
    if (!user) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      console.log("WebSocket connected");
      setIsConnected(true);
      
      // Join with user ID
      if (ws.current) {
        ws.current.send(JSON.stringify({
          type: 'join',
          userId: user.id
        }));
      }
    };

    ws.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'chat') {
          setMessages(prev => [...prev, data.message]);
        } else if (data.type === 'onlineCount') {
          setOnlineCount(data.count);
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };

    ws.current.onclose = () => {
      console.log("WebSocket disconnected");
      setIsConnected(false);
      
      // Attempt to reconnect after 3 seconds
      setTimeout(() => {
        if (user) {
          connect();
        }
      }, 3000);
    };

    ws.current.onerror = (error) => {
      console.error("WebSocket error:", error);
      setIsConnected(false);
    };
  };

  const sendMessage = (message: string, room: string = 'general') => {
    if (ws.current?.readyState === WebSocket.OPEN && user) {
      ws.current.send(JSON.stringify({
        type: 'chat',
        userId: user.id,
        text: message,
        room
      }));
    }
  };

  const disconnect = () => {
    if (ws.current) {
      ws.current.close();
      ws.current = null;
    }
  };

  useEffect(() => {
    if (user) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [user]);

  return {
    isConnected,
    messages,
    onlineCount,
    sendMessage,
    connect,
    disconnect,
  };
};
