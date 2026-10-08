import { Server as SocketIOServer } from "socket.io";
import { Server as HttpServer } from "http";

export const socketDevices: Record<string, string> = {};

class SocketHelper {
  private static io: SocketIOServer | null = null;

  public static initialize(server: HttpServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
    });

    this.io.on("connection", (socket) => {
      console.log("🔌 A user connected to Socket.io:", socket.id);

      socket.on("join", (userId: string) => {
        if (userId) {
          socket.join(userId);
          socketDevices[userId] = socket.id;
          console.log(`👤 User ${userId} joined room`);
        }
      });

      socket.on("disconnect", () => {
        // Clean up socketDevices mapping if needed
        // Find userId by socketId and delete
        const userId = Object.keys(socketDevices).find(key => socketDevices[key] === socket.id);
        if (userId) {
          delete socketDevices[userId];
        }
        console.log("❌ A user disconnected from Socket.io");
      });
    });

    return this.io;
  }

  public static emitToUser(userId: string, event: string, data: any) {
    if (this.io) {
      this.io.to(userId).emit(event, data);
    }
  }

  public static emitToAll(event: string, data: any) {
    if (this.io) {
        this.io.emit(event, data);
    }
  }

  public static getIO() {
    return this.io;
  }
}

export default SocketHelper;
