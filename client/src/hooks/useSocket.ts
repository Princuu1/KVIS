// client/src/hooks/useSocket.ts
import { useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { useAuth } from "@/hooks/useAuth";

export interface ChatMessage {
  id: string;
  userId: string;
  fullName: string;
  message: string;
  studentClass?: string;
  student_class?: string;
  createdAt: string;
  idPhotoUrl?: string;
}

export interface OnlineUser {
  userId: string;
  fullName?: string;
  sockets: string[];
  socketsCount: number;
  idPhotoUrl?: string;
  studentClass?: string;
}

export function useSocket() {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [onlineCount, setOnlineCount] = useState(0);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const socketRef = useRef<Socket | null>(null);

  // 🔑 Always set VITE_API_HOST in Render to your backend domain (e.g. https://kvis.onrender.com)
  const rawApiHost = (import.meta.env.VITE_API_HOST as string) || "";
  const apiHost = rawApiHost ? rawApiHost.replace(/\/+$/, "") : window.location.origin;

  const getUserClass = () =>
    (
      (user as any)?.student_class ??
      (user as any)?.studentClass ??
      (user as any)?.student_Class ??
      ""
    )
      .toString()
      .trim();

  // Load saved messages
  useEffect(() => {
    if (!user) return;
    const cls = getUserClass();
    if (!cls) return;
    const saved = localStorage.getItem(`chat_${cls}`);
    if (saved) {
      try {
        setMessages(JSON.parse(saved));
      } catch {
        setMessages([]);
      }
    }
  }, [user]);

  // Save messages
  useEffect(() => {
    if (!user) return;
    const cls = getUserClass();
    if (!cls) return;
    localStorage.setItem(`chat_${cls}`, JSON.stringify(messages));
  }, [messages, user]);

  // Setup socket
  useEffect(() => {
    if (!user) return;
    const cls = getUserClass();
    if (!cls) {
      console.warn("[useSocket] user has no class, socket not started");
      return;
    }

    const socket = io(apiHost, {
      transports: ["websocket", "polling"],
      reconnection: true,
      withCredentials: true,
      timeout: 20000,
      path: "/socket.io", // ✅ must match backend
    });
    socketRef.current = socket;

    const joinRoom = () => {
      const className = getUserClass();
      if (!className) return;
      socket.emit("joinRoom", {
        student_class: className,
        studentClass: className,
        fullName: user.fullName,
        userId: user.id,
        idPhotoUrl: (user as any)?.idPhotoUrl ?? "",
      });
    };

    socket.on("connect", () => {
      console.log("[socket] connected", socket.id);
      setIsConnected(true);
      joinRoom();
    });

    socket.on("reconnect", (attempt) => {
      console.log("[socket] reconnected after", attempt, socket.id);
      joinRoom();
    });

    socket.on("disconnect", (reason) => {
      console.log("[socket] disconnected", reason);
      setIsConnected(false);
    });

    socket.on("chatMessage", (msg: ChatMessage) => {
      try {
        const myClass = getUserClass();
        const msgClass = (msg.student_class ?? msg.studentClass ?? "").toString().trim();
        if (!msgClass || msgClass !== myClass) return;
        setMessages((prev) => {
          if (prev.find((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      } catch (err) {
        console.error("[socket] chatMessage handler error", err);
      }
    });

    socket.on("onlineUsers", (users: OnlineUser[]) => {
      try {
        const cls = getUserClass();
        const filtered = (users || []).filter(
          (u) => !u.studentClass || u.studentClass === cls
        );
        setOnlineUsers(filtered);
        setOnlineCount(filtered.length);
      } catch (err) {
        console.error("[socket] onlineUsers handler error", err);
      }
    });

    socket.on("onlineCount", (count: number) => {
      setOnlineCount(typeof count === "number" ? count : onlineCount);
    });

    socket.on("connect_error", (err) => {
      console.error("[socket] connect_error", err);
    });

    return () => {
      socket.off("connect");
      socket.off("reconnect");
      socket.off("disconnect");
      socket.off("connect_error");
      socket.off("chatMessage");
      socket.off("onlineUsers");
      socket.off("onlineCount");
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user, apiHost]);

  const sendMessage = (text: string) => {
    const socket = socketRef.current;
    if (!socket || !user) return;
    const className = getUserClass();
    if (!className) return;
    const msg: ChatMessage = {
      id: `${socket.id}_${Date.now()}`,
      userId: user.id,
      fullName: user.fullName,
      message: text,
      studentClass: className,
      student_class: className,
      createdAt: new Date().toISOString(),
      idPhotoUrl: (user as any)?.idPhotoUrl ?? "",
    };
    socket.emit("chatMessage", msg);
  };

  return { isConnected, messages, onlineCount, onlineUsers, sendMessage };
}
