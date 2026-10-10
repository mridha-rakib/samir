/* eslint-disable no-unused-vars */
/* eslint-disable no-empty */
import { useEffect, useRef, useState } from "react";
import { wsUrl } from "../config/envConfig";

export default function useChatSocket(channelName, senderId) {
  const socketRef = useRef(null);
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    // if there's no channel, don't open a socket
    if (!channelName) {
      // ensure any existing socket is closed when channel becomes falsy
      if (
        socketRef.current &&
        socketRef.current.readyState !== WebSocket.CLOSED
      ) {
        try {
          socketRef.current.close();
        } catch (_) {}
      }
      return;
    }

    socketRef.current = new WebSocket(wsUrl);

    socketRef.current.onopen = () => {
      console.log("✅ Connected to WebSocket server");

      // subscribe to channel
      const subscribePayload = {
        type: "subscribe",
        channelName,
      };
      try {
        socketRef.current.send(JSON.stringify(subscribePayload));
        console.log(`📡 Subscribed to channel: ${channelName}`);
      } catch (err) {
        console.error("❌ Failed to send subscribe payload:", err);
      }
    };

    socketRef.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("📥 Incoming WS message:", data);

        // handle subscription confirmation
        if (data?.type === "subscribe" || data?.type === "subscribed") {
          console.log(
            `✅ Successfully subscribed to channel: ${data.channelName}`,
          );
          return;
        }

        // handle incoming messages
        if (data?.type === "message" && data?.channelName === channelName) {
          console.log("🎯 Processing message for current channel:", data);
          const messageData = {
            id: data.id || `ws-${Date.now()}`,
            text: data.message || "",
            files: Array.isArray(data.files) ? data.files : [],
            createdAt: data.createdAt || new Date().toISOString(),
            senderId: data.senderId || senderId,
            channelName: data.channelName || channelName,
            sender: data.sender || undefined,
          };
          console.log("📝 Adding message to state:", messageData);
          setMessages((prev) => [...prev, messageData]);
          return;
        }

        // Debug: Check why message is not being handled
        if (data?.type === "message") {
          console.log("🔍 Message type check failed:", {
            receivedChannel: data?.channelName,
            expectedChannel: channelName,
            channelMatch: data?.channelName === channelName,
            data,
          });
        }

        // handle messages with direct message field (Postman style)
        if (
          typeof data?.message !== "undefined" &&
          data?.channelName === channelName
        ) {
          console.log(
            "🎯 Processing direct message for current channel:",
            data,
          );
          const messageData = {
            id: data.id || `ws-${Date.now()}`,
            message: data.message ?? "",
            files: Array.isArray(data.files) ? data.files : [],
            createdAt: data.createdAt || new Date().toISOString(),
            senderId: data.senderId || senderId,
            channelName: data.channelName || channelName,
            sender: data.sender || undefined,
          };
          console.log("📝 Adding direct message to state:", messageData);
          setMessages((prev) => [...prev, messageData]);
          return;
        }

        // handle messages without type field (fallback for Postman)
        if (
          !data?.type &&
          typeof data?.message !== "undefined" &&
          data?.channelName === channelName
        ) {
          console.log(
            "🎯 Processing message without type for current channel:",
            data,
          );
          const messageData = {
            id: data.id || `ws-${Date.now()}`,
            message: data.message ?? "",
            files: Array.isArray(data.files) ? data.files : [],
            createdAt: data.createdAt || new Date().toISOString(),
            senderId: data.senderId || senderId,
            channelName: data.channelName || channelName,
            sender: data.sender || undefined,
          };
          console.log("📝 Adding message without type to state:", messageData);
          setMessages((prev) => [...prev, messageData]);
          return;
        }

        // Log unhandled messages for debugging
        console.log("❌ Unhandled message type or wrong channel:", {
          type: data?.type,
          channelName: data?.channelName,
          expectedChannel: channelName,
          data,
        });

        // Otherwise ignore control or unknown payloads
      } catch (err) {
        // Case 3: Non-JSON payload, treat as plain text message
        const text = String(event.data ?? "");
        if (text && text.trim()) {
          const messageData = {
            id: `ws-${Date.now()}`,
            message: text,
            files: [],
            createdAt: new Date().toISOString(),
            senderId,
            channelName,
          };
          setMessages((prev) => [...prev, messageData]);
        } else {
          console.error("❌ Failed to parse WS message:", event.data, err);
        }
      }
    };

    socketRef.current.onerror = (err) => {
      console.error("❌ WebSocket error:", err);
    };

    socketRef.current.onclose = () => {
      console.log(`🔌 WebSocket closed (unsubscribed from ${channelName})`);
    };

    // cleanup on unmount or when channel changes
    return () => {
      const rs = socketRef.current?.readyState;
      if (rs === WebSocket.OPEN || rs === WebSocket.CONNECTING) {
        try {
          socketRef.current.close();
        } catch (_) {}
      }
    };
  }, [channelName, senderId]);

  // send message via socket
  const sendMessage = (message, file = null) => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      console.warn("⚠️ WebSocket not open, message not sent");
      return;
    }

    if (!senderId) {
      console.error("❌ senderId is required but not provided");
      return;
    }

    const msgData = {
      type: "message",
      channelName,
      senderId,
      message,
      files: file ? [file.name] : [],
    };

    console.log("📤 Sending message:", msgData);
    socketRef.current.send(JSON.stringify(msgData));
  };

  return { messages, sendMessage };
}
