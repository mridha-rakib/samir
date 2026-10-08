"use client";

import { io, Socket } from "socket.io-client";

/**
 * Singleton Socket.io service for real-time notifications.
 * Mirrors the mobile app's SocketApi class pattern.
 */
class SocketService {
  private socket: Socket | null = null;
  private userId: string | null = null;

  /**
   * Connect to the backend Socket.io server.
   * Emits "join" with the userId so the server adds us to the user's room.
   */
  init(userId: string, token: string) {
    if (this.socket?.connected && this.userId === userId) {
      // Already connected for this user
      return;
    }

    // Disconnect previous connection if any
    this.disconnect();

    this.userId = userId;

    // Extract base URL (strip /api/v1 path)
    const apiUrl = process.env.NEXT_PUBLIC_URL || "https://api.hostibook.com/api/v1";
    const baseUrl = apiUrl.replace(/\/api\/v1\/?$/, "");

    this.socket = io(baseUrl, {
      transports: ["websocket"],
      reconnectionAttempts: 10,
      reconnectionDelay: 3000,
      autoConnect: true,
      extraHeaders: {
        Authorization: token,
      },
    });

    this.socket.on("connect", () => {
      console.log("✅ Socket.io connected:", this.socket?.id);
      // Backend requires "join" event with userId to subscribe to the user's room
      if (this.userId) {
        this.socket?.emit("join", this.userId);
        console.log(`👤 Emitted 'join' for user: ${this.userId}`);
      }
    });

    this.socket.on("disconnect", (reason) => {
      console.log("❌ Socket.io disconnected:", reason);
    });

    this.socket.on("connect_error", (error) => {
      console.warn("⚠️ Socket.io connect error:", error.message);
    });
  }

  /**
   * Listen for notification events from the backend.
   */
  onNotification(callback: (data: any) => void) {
    if (!this.socket) return;
    this.socket.on("notification", (data: any) => {
      console.log("🔔 Socket notification received:", data);
      callback(data);
    });
  }

  /**
   * Remove notification listener.
   */
  offNotification() {
    if (!this.socket) return;
    this.socket.off("notification");
  }

  /**
   * Check if connected.
   */
  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  /**
   * Disconnect and clean up.
   */
  disconnect() {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
      this.userId = null;
      console.log("🛑 Socket.io connection closed");
    }
  }
}

// Export a singleton instance
const socketService = new SocketService();
export default socketService;
