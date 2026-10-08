"use client";

import { useState, useRef, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { useGetMyProfileQuery } from "@/redux/api/userApi";
import {
  useGetMyChannelsQuery,
  useGetChannelMessagesQuery,
  useSendMessageMutation,
} from "@/redux/api/chatApi";
import { useNotification } from "../layout";

// Icons & Helpers
import { SearchIcon } from "../../provider/components/Icons";

function formatMsgTime(iso?: string): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

function ChatContent() {
  const token = useSelector((state: RootState) => state.auth.token);
  const searchParams = useSearchParams();
  const ownerIdParam = searchParams.get("ownerId");

  const { data: profileResponse } = useGetMyProfileQuery(undefined, { skip: !token });
  const [channelLimit, setChannelLimit] = useState(20);
  const { data: channelsResponse, refetch: refetchChannels, isLoading: isLoadingChannels, isFetching: isFetchingChannels } = useGetMyChannelsQuery({ page: 1, limit: channelLimit }, { skip: !token });
  const [sendMessageMutation] = useSendMessageMutation();
  const { triggerNotification } = useNotification();

  // Refetch channels on mount to ensure fresh chats/channels list
  useEffect(() => {
    refetchChannels();
  }, [refetchChannels]);

  const [activeChannelId, setActiveChannelId] = useState<string | null>(null);
  const [msgPage, setMsgPage] = useState(1);
  const MSG_LIMIT = 30;

  const { data: messagesResponse, isLoading: isLoadingMessages, isFetching: isFetchingMessages, refetch: refetchMessages } = useGetChannelMessagesQuery(
    { channelId: activeChannelId || "", page: msgPage, limit: MSG_LIMIT },
    { skip: !activeChannelId }
  );

  const channelsResponseRef = useRef<any>(null);
  const profileResponseRef = useRef<any>(null);
  useEffect(() => { channelsResponseRef.current = channelsResponse; }, [channelsResponse]);
  useEffect(() => { profileResponseRef.current = profileResponse; }, [profileResponse]);

  const [allPagedMessages, setAllPagedMessages] = useState<any[]>([]);
  const [typedMessage, setTypedMessage] = useState("");
  const [searchChatQuery, setSearchChatQuery] = useState("");
  const messageEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [imageViewerUrl, setImageViewerUrl] = useState<string | null>(null);

  // Real-time WebSocket state
  const wsRef = useRef<WebSocket | null>(null);
  const [realtimeMessages, setRealtimeMessages] = useState<any[]>([]);
  const [remoteTyping, setRemoteTyping] = useState(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeChannelNameRef = useRef<string | null>(null);
  const isSendingTypingRef = useRef(false);

  // Sync incoming paged messages
  useEffect(() => {
    if (!activeChannelId) {
      setAllPagedMessages([]);
      return;
    }
    const incoming = messagesResponse?.data?.messages;
    if (!incoming) {
      if (isLoadingMessages || isFetchingMessages) {
        setAllPagedMessages([]);
      }
      return;
    }
    if (msgPage === 1) {
      setAllPagedMessages(incoming);
    } else {
      setAllPagedMessages((prev) => {
        const existingIds = new Set(prev.map((m: any) => m.id || m._id));
        const newOnes = incoming.filter((m: any) => !existingIds.has(m.id || m._id));
        return [...newOnes, ...prev];
      });
    }
    setRealtimeMessages((prev) => prev.filter((m) => !m.id?.startsWith("opt-")));
  }, [messagesResponse, activeChannelId, msgPage, isLoadingMessages, isFetchingMessages]);

  // Connect WS
  const connectWs = useCallback(() => {
    if (wsRef.current) {
      console.log("%c[WS-LIFECYCLE] 🔌 Closing existing WebSocket connection before reconnecting...", "color: #eab308; font-weight: bold;");
      wsRef.current.close();
    }
    const wsUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "wss://api.hostibook.com";
    console.log(`%c[WS-CONNECT] 🔌 Attempting to connect to: ${wsUrl}`, "color: #3b82f6; font-weight: bold; background-color: #eff6ff; padding: 3px 6px; border-radius: 4px;");
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("%c[WS-OPEN] 🟢 WebSocket Connected Successfully!", "color: #10b981; font-weight: bold; background-color: #ecfdf5; padding: 4px 8px; border-radius: 4px; border: 1px solid #10b981;");
      if (activeChannelNameRef.current) {
        console.log(`%c[WS-SUBSCRIBE] 📡 Subscribing on connect to channel: ${activeChannelNameRef.current}`, "color: #8b5cf6; font-weight: bold;");
        ws.send(JSON.stringify({ type: "subscribe", channelName: activeChannelNameRef.current }));
      }
    };

    ws.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        console.log("%c[WS-RECEIVE] 📥 Message Received from Server:", "color: #8b5cf6; font-weight: bold; background-color: #f5f3ff; padding: 3px 6px; border-radius: 4px;", parsed);
        const myId = profileResponseRef.current?.data?.id;

        if (parsed.type === "message" && parsed.channelName === activeChannelNameRef.current) {
          // Server sends: {type: 'message', channelName, data: {id, message, senderId, files, createdAt, sender}}
          const msgData = parsed.data || parsed;
          if (msgData.senderId === myId) {
            console.log("%c[WS-RECEIVE] 💬 Message is from ourselves, skipping append.", "color: #71717a; font-style: italic;");
            return;
          }

          const newMsg = {
            id: msgData.id || `ws-${Date.now()}`,
            message: msgData.message,
            senderId: msgData.senderId,
            createdAt: msgData.createdAt || new Date().toISOString(),
            files: msgData.files || [],
          };
          console.log("%c[WS-RECEIVE] 💬 Appending new real-time message to state:", "color: #10b981; font-weight: bold;", newMsg);
          setRealtimeMessages((prev) => [...prev, newMsg]);

          if (myId) {
            console.log(`%c[WS-SEEN] 👁️ Sending seen status for received message in channel: ${parsed.channelName}`, "color: #06b6d4;");
            ws.send(JSON.stringify({ type: "seen", channelName: parsed.channelName, senderId: myId }));
          }
        } else if (parsed.type === "typing" && parsed.channelName === activeChannelNameRef.current) {
          console.log(`%c[WS-TYPING] ✍️ Remote user typing state updated: ${parsed.isTyping}`, "color: #f59e0b; font-weight: bold;");
          setRemoteTyping(parsed.isTyping);
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
          if (parsed.isTyping) {
            typingTimeoutRef.current = setTimeout(() => {
              console.log("%c[WS-TYPING] ✍️ Remote typing timed out", "color: #71717a;");
              setRemoteTyping(false);
            }, 3000);
          }
        } else if (parsed.type === "seen" && parsed.channelName === activeChannelNameRef.current) {
          console.log("%c[WS-SEEN] 👁️ Received seen confirmation from channel.", "color: #06b6d4; font-weight: bold;");
        }
      } catch (err) {
        console.error("%c[WS-ERROR] ⚠️ Failed to parse WebSocket message:", "color: #ef4444; font-weight: bold;", event.data, err);
      }
    };

    ws.onerror = (error) => {
      console.error("%c[WS-ERROR] 🔴 WebSocket Error occurred:", "color: #ef4444; font-weight: bold; background-color: #fef2f2; padding: 4px 8px; border-radius: 4px;", error);
    };

    ws.onclose = (event) => {
      console.warn(`%c[WS-CLOSE] 🟡 WebSocket Connection Closed (code: ${event.code}, reason: ${event.reason || "none"})`, "color: #d97706; font-weight: bold; background-color: #fffbeb; padding: 4px 8px; border-radius: 4px;");
    };
  }, []);

  useEffect(() => {
    connectWs();
    return () => {
      if (wsRef.current) {
        console.log("%c[WS-LIFECYCLE] 🔌 Cleaning up: closing WebSocket connection", "color: #71717a;");
        wsRef.current.close();
      }
    };
  }, [connectWs]);

  // Handle URL search param: ownerId
  useEffect(() => {
    if (ownerIdParam && channelsResponse) {
      const rawChannels = channelsResponse?.data?.data || channelsResponse?.data || [];
      const found = rawChannels.find((c: any) => c.receiverUser?.id === ownerIdParam || c.receiverUser?._id === ownerIdParam);
      if (found) {
        console.log(`%c[ROUTING] 📍 Found channel for ownerId ${ownerIdParam}:`, "color: #2563eb;", found.id || found._id);
        setActiveChannelId(found.id || found._id);
      }
    }
  }, [ownerIdParam, channelsResponse]);

  useEffect(() => {
    setRealtimeMessages([]);
    setRemoteTyping(false);
    setMsgPage(1);

    if (!activeChannelId) {
      activeChannelNameRef.current = null;
      return;
    }

    const cr = channelsResponseRef.current;
    const rawChs = cr?.data?.data || cr?.data || [];
    const channelObj = rawChs.find((c: any) => c.id === activeChannelId || c._id === activeChannelId);
    const channelName = channelObj?.channelName || null;
    activeChannelNameRef.current = channelName;

    const doSubscribe = () => {
      if (!channelName) return;
      console.log(`%c[WS-SUBSCRIBE] 📡 Sending subscribe event for channel name: ${channelName}`, "color: #8b5cf6; font-weight: bold;");
      wsRef.current?.send(JSON.stringify({ type: "subscribe", channelName }));
      const myId = profileResponseRef.current?.data?.id;
      if (myId) {
        console.log(`%c[WS-SEEN] 👁️ Sending seen status on channel selection: ${channelName}`, "color: #06b6d4;");
        wsRef.current?.send(JSON.stringify({ type: "seen", channelName, senderId: myId }));
      }
    };

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      doSubscribe();
    } else {
      console.log(`%c[WS-SUBSCRIBE] ⏳ WebSocket is not OPEN (state: ${wsRef.current?.readyState}). Queuing subscription onopen...`, "color: #f59e0b;");
      const prev = wsRef.current?.onopen;
      if (wsRef.current) {
        wsRef.current.onopen = (e) => {
          (prev as any)?.(e);
          doSubscribe();
        };
      }
    }
  }, [activeChannelId]);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeChannelId, messagesResponse, realtimeMessages, remoteTyping]);

  // Image selection handler
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const imageFiles = files.filter(f => f.type.startsWith("image/"));
    if (imageFiles.length === 0) {
      triggerNotification("Please select image files only", "error");
      return;
    }
    setSelectedImages(prev => [...prev, ...imageFiles]);
    const newPreviews = imageFiles.map(f => URL.createObjectURL(f));
    setImagePreviews(prev => [...prev, ...newPreviews]);
    // Reset input so same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeSelectedImage = (index: number) => {
    URL.revokeObjectURL(imagePreviews[index]);
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const clearSelectedImages = () => {
    imagePreviews.forEach(url => URL.revokeObjectURL(url));
    setSelectedImages([]);
    setImagePreviews([]);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = typedMessage.trim();
    const hasImages = selectedImages.length > 0;
    if (!text && !hasImages) return;
    if (activeChannelId === null) return;

    const cr = channelsResponseRef.current;
    const rawChs = cr?.data?.data || cr?.data || [];
    const currentChannelObj = rawChs.find(
      (c: any) => c.id === activeChannelId || c._id === activeChannelId
    );
    const receiverUser = currentChannelObj?.receiverUser;
    const receiverId = receiverUser?.id || receiverUser?._id || "";
    const channelName = currentChannelObj?.channelName;
    const myId = profileResponseRef.current?.data?.id;

    // Optimistic message
    const optimisticId = `opt-${Date.now()}`;
    const optimisticMsg: any = {
      id: optimisticId,
      message: text || (hasImages ? `📷 ${selectedImages.length} image${selectedImages.length > 1 ? "s" : ""}` : ""),
      senderId: myId,
      createdAt: new Date().toISOString(),
      files: hasImages ? imagePreviews.map(url => url) : [],
      _isOptimisticImages: hasImages,
    };
    setRealtimeMessages((prev) => [...prev, optimisticMsg]);
    setTypedMessage("");

    // Capture and clear images
    const imagesToSend = [...selectedImages];
    clearSelectedImages();

    try {
      if (hasImages && receiverId) {
        // Images must go through HTTP API (FormData)
        console.log("📤 Sending message with images via HTTP (FormData)...", { text, receiverId, imagesCount: imagesToSend.length });
        const formData = new FormData();
        formData.append("data", JSON.stringify({ message: text || "" }));
        imagesToSend.forEach(file => {
          formData.append("messageImages", file);
        });
        await sendMessageMutation({ receiverId, body: formData }).unwrap();
        console.log("✅ HTTP message with images sent successfully.");
        setTimeout(() => { refetchMessages(); }, 300);
      } else if (channelName && wsRef.current?.readyState === WebSocket.OPEN && myId) {
        // Text only: send via WebSocket for real-time
        const payload = {
          type: "message",
          channelName,
          message: text,
          senderId: myId,
          receiverId,
        };
        console.log("📤 Sending text message via WebSocket:", payload);
        wsRef.current.send(JSON.stringify(payload));
        setTimeout(() => { refetchMessages(); }, 600);
      } else if (receiverId) {
        // Fallback: text via HTTP
        console.log("📤 WebSocket not available, sending text message via HTTP fallback...", { text, receiverId });
        const formData = new FormData();
        formData.append("data", JSON.stringify({ message: text }));
        await sendMessageMutation({ receiverId, body: formData }).unwrap();
        console.log("✅ HTTP fallback message sent successfully.");
        refetchMessages();
      }
      if (channelName && wsRef.current?.readyState === WebSocket.OPEN && myId) {
        console.log("✍️ Stopping typing status (typing=false) after send");
        wsRef.current.send(JSON.stringify({ type: "typing", channelName, senderId: myId, isTyping: false }));
      }
      isSendingTypingRef.current = false;
    } catch (err: any) {
      console.error("🔴 Failed to send message:", err);
      triggerNotification("Failed to send message", "error");
    }
  };


  const handleTyping = (value: string) => {
    setTypedMessage(value);
    const channelName = activeChannelNameRef.current;
    const myId = profileResponse?.data?.id;
    if (!channelName || !myId || wsRef.current?.readyState !== WebSocket.OPEN) return;

    if (!isSendingTypingRef.current) {
      console.log("✍️ Sending typing status: typing=true");
      isSendingTypingRef.current = true;
      wsRef.current.send(JSON.stringify({ type: "typing", channelName, senderId: myId, isTyping: true }));
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      isSendingTypingRef.current = false;
      wsRef.current?.send(JSON.stringify({ type: "typing", channelName, senderId: myId, isTyping: false }));
    }, 2000);
  };

  const rawChannels = channelsResponse?.data?.data || channelsResponse?.data || [];
  const activeChannelObj = rawChannels.find((c: any) => c.id === activeChannelId || c._id === activeChannelId);

  const sortedRest = [...allPagedMessages].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
  const allMessageIds = new Set(sortedRest.map((m: any) => m.id || m._id));
  const messages = [
    ...sortedRest,
    ...realtimeMessages.filter((m) => m.id?.startsWith("opt-") || !allMessageIds.has(m.id)),
  ];

  return (
    <div className="flex-1 flex flex-col lg:flex-row bg-white overflow-hidden w-full h-full pb-20 lg:pb-0 border-t border-zinc-200">
      {/* THREADS LIST */}
      <div className={`w-full lg:w-80 border-r border-zinc-150 flex flex-col h-full ${
        activeChannelId !== null ? "hidden lg:flex" : "flex"
      }`}>
        <div className="p-4 border-b border-zinc-150 flex flex-col gap-3 shrink-0">
          <div className="flex items-center justify-between text-left">
            <h3 className="text-lg font-black tracking-tight text-zinc-950">Messages</h3>
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
          </div>
          <div className="relative">
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchChatQuery}
              onChange={(e) => setSearchChatQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-zinc-200 rounded-xl text-xs font-bold bg-zinc-50 focus:bg-white focus:border-blue-500 outline-none transition-all text-zinc-800"
            />
            <div className="absolute left-3 top-2.5">
              <SearchIcon />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-zinc-100">
          {isLoadingChannels ? (
            <div className="p-3 space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-3 p-2 animate-pulse">
                  <div className="w-12 h-12 rounded-full bg-zinc-200 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-zinc-200 rounded-full w-3/4" />
                    <div className="h-2.5 bg-zinc-100 rounded-full w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : rawChannels.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
              <p className="text-xs font-bold text-zinc-400">No chats found.</p>
            </div>
          ) : (
            rawChannels
              .filter((c: any) => {
                const name = c.receiverUser?.fullName || c.name || "";
                return name.toLowerCase().includes(searchChatQuery.toLowerCase());
              })
              .map((c: any) => {
                const isActive = activeChannelId === (c.id || c._id);
                const receiverUser = c.receiverUser;
                const avatar = receiverUser?.profileImage || "https://i.ibb.co/Ps9gZ8DD/Profile-image.png";
                const name = receiverUser?.fullName || c.name || "Unknown";
                const lastMsgText = c.lastMessage?.message || c.lastMsg || "Tap to open conversation";
                const lastMsgTime = formatMsgTime(c.lastMessage?.createdAt || c.updatedAt);
                const hasUnread = !c.isReadByMe;
                return (
                  <button
                    key={c.id || c._id}
                    onClick={() => setActiveChannelId(c.id || c._id)}
                    className={`w-full p-4 text-left flex items-start gap-3 transition-colors ${
                      isActive ? "bg-blue-600 text-white" : "hover:bg-zinc-50"
                    }`}
                  >
                    <div className="relative w-12 h-12 rounded-full overflow-hidden bg-zinc-200 shrink-0 shadow-inner">
                      <img src={avatar} alt={name} className="w-full h-full object-cover" />
                      <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white bg-emerald-500" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-0.5">
                        <h4 className={`text-sm font-bold truncate ${isActive ? "text-white" : "text-zinc-900"}`}>
                          {name}
                        </h4>
                        <span className={`text-[10px] font-semibold shrink-0 ml-1 ${isActive ? "text-blue-100" : "text-zinc-400"}`}>
                          {lastMsgTime}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-1">
                        <p className={`text-xs truncate font-medium ${isActive ? "text-blue-100" : "text-zinc-500"}`}>
                          {lastMsgText}
                        </p>
                        {hasUnread && !isActive && (
                          <span className="shrink-0 w-2 h-2 rounded-full bg-blue-600" />
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
          )}

          {(() => {
            const channelsMeta = channelsResponse?.data?.meta || channelsResponse?.meta;
            const rawChannels = channelsResponse?.data?.data || channelsResponse?.data || [];
            const hasMoreChannels = channelsMeta ? rawChannels.length < channelsMeta.total : false;
            if (!hasMoreChannels) return null;
            return (
              <div className="p-3 text-center border-t border-zinc-100 shrink-0">
                <button
                  onClick={() => setChannelLimit((prev) => prev + 20)}
                  disabled={isFetchingChannels}
                  className="w-full py-2 px-3 text-xs font-semibold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isFetchingChannels ? "Loading chats..." : "Load More Chats"}
                </button>
              </div>
            );
          })()}
        </div>
      </div>

      {/* CONVERSATION VIEW */}
      <div className={`flex-1 flex flex-col justify-between bg-zinc-50/30 h-full ${
        activeChannelId === null ? "hidden lg:flex" : "flex"
      }`}>
        {activeChannelId === null ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-sm mx-auto">
            <div className="w-16 h-16 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mb-4 shadow-sm">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z" />
              </svg>
            </div>
            <h3 className="text-base font-black text-zinc-950">Your Messages</h3>
            <p className="text-xs text-zinc-400 mt-1 font-semibold leading-relaxed">
              Select a conversation from the left panel to chat with property owners in real time.
            </p>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            {(() => {
              const receiverUser = activeChannelObj?.receiverUser;
              const activeAvatar = receiverUser?.profileImage || "https://i.ibb.co/Ps9gZ8DD/Profile-image.png";
              const activeName = receiverUser?.fullName || activeChannelObj?.name || "User";
              const activeRole = receiverUser?.role === "PROPERTY_OWNER" ? "Property Owner" : (receiverUser?.role || "Hostibook User");
              return (
                <div className="p-4 bg-white border-b border-zinc-150 flex items-center justify-between shadow-sm shrink-0">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setActiveChannelId(null)}
                      className="lg:hidden p-1.5 rounded-full hover:bg-zinc-100 text-zinc-500 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>

                    <div className="relative w-10 h-10 rounded-full overflow-hidden bg-zinc-200 shadow-inner shrink-0">
                      <img src={activeAvatar} alt={activeName} className="w-full h-full object-cover" />
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white bg-emerald-500" />
                    </div>
                    <div className="text-left">
                      <h4 className="text-sm font-bold text-zinc-900 leading-tight">{activeName}</h4>
                      <p className="text-[10px] text-zinc-400 font-semibold">
                        {remoteTyping ? (
                          <span className="text-blue-500 animate-pulse">typing...</span>
                        ) : (
                          <>{activeRole} &bull; Active Now</>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${
                      wsRef.current?.readyState === WebSocket.OPEN ? "bg-emerald-500" : "bg-zinc-300"
                    }`} title={wsRef.current?.readyState === WebSocket.OPEN ? "Real-time connected" : "Connecting..."} />
                  </div>
                </div>
              );
            })()}

            {/* Messages list */}
            <div className="flex-1 p-5 overflow-y-auto space-y-4">
              {(isLoadingMessages || isFetchingMessages) && allPagedMessages.length === 0 ? (
                <div className="space-y-4 animate-pulse">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className={`flex flex-col max-w-[60%] ${i % 2 === 0 ? "ml-auto items-end" : "mr-auto items-start"}`}>
                      <div className={`h-9 rounded-2xl ${i % 2 === 0 ? "bg-blue-100 w-40" : "bg-zinc-200 w-52"}`} />
                      <div className="h-2 bg-zinc-100 rounded w-10 mt-1" />
                    </div>
                  ))}
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-16">
                  <p className="text-xs font-bold text-zinc-400">No messages yet. Say hello! 👋</p>
                </div>
              ) : (
                <>
                {messages.map((msg: any, idx: number) => {
                  const isSent = msg.senderId === profileResponse?.data?.id;
                  const isOptimistic = msg.id?.startsWith("opt-");
                  const msgFiles = msg.files || [];
                  const hasImages = msgFiles.length > 0;
                  const hasText = !!(msg.message || msg.text) && !(msg._isOptimisticImages && !msg.message?.trim());
                  return (
                    <div
                      key={msg.id || msg._id || idx}
                      className={`flex flex-col max-w-[78%] ${
                        isSent ? "ml-auto items-end" : "mr-auto items-start"
                      }`}
                    >
                      {/* Image attachments */}
                      {hasImages && (
                        <div className={`flex flex-wrap gap-1.5 mb-1 ${isSent ? "justify-end" : "justify-start"}`}>
                          {msgFiles.map((fileUrl: string, fIdx: number) => (
                            <button
                              key={fIdx}
                              onClick={() => setImageViewerUrl(fileUrl)}
                              className={`relative rounded-xl overflow-hidden shadow-sm border cursor-pointer group transition-transform hover:scale-[1.02] ${
                                isOptimistic ? "opacity-60" : ""
                              } ${isSent ? "border-blue-400/30" : "border-zinc-200"}`}
                              style={{ width: msgFiles.length === 1 ? 240 : 140, height: msgFiles.length === 1 ? 180 : 110 }}
                            >
                              <img
                                src={fileUrl}
                                alt="Attachment"
                                className="w-full h-full object-cover"
                                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                <svg className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                                </svg>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                      {/* Text bubble */}
                      {hasText && (
                        <div className={`px-4 py-3 rounded-2xl text-xs font-semibold leading-relaxed text-left ${
                          isSent
                            ? `bg-blue-600 text-white rounded-br-none shadow-sm ${isOptimistic ? "opacity-70" : ""}`
                            : "bg-zinc-100 text-zinc-800 rounded-bl-none border border-zinc-200"
                        }`}>
                          {msg.message || msg.text}
                        </div>
                      )}
                      {/* Optimistic image-only indicator */}
                      {!hasText && isOptimistic && hasImages && (
                        <div className={`px-3 py-2 rounded-2xl text-[10px] font-semibold ${
                          isSent ? "bg-blue-600/80 text-white/80 rounded-br-none" : "bg-zinc-100 text-zinc-500 rounded-bl-none"
                        }`}>
                          📷 Sending {msgFiles.length} image{msgFiles.length > 1 ? "s" : ""}...
                        </div>
                      )}
                      <span className="text-[9px] font-semibold text-zinc-400 mt-1">
                        {formatMsgTime(msg.createdAt) || msg.time || ""}
                        {isSent && !isOptimistic && (
                          <span className="ml-1 text-emerald-500">✓</span>
                        )}
                      </span>
                    </div>
                  );
                })}
                </>
              )}
              {/* Typing Indicator */}
              {remoteTyping && (
                <div className="flex items-center gap-2 mr-auto max-w-[78%] animate-fade-in">
                  <div className="bg-zinc-100 border border-zinc-200 text-zinc-500 px-4 py-2 rounded-2xl rounded-bl-none flex items-center gap-1.5 shadow-sm">
                
                    <span className="flex items-center gap-1 mt-0.5">
                      <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                      <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                      <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                    </span>
                  </div>
                </div>
              )}
              <div ref={messageEndRef} />
            </div>

            {/* Image Preview Strip */}
            {imagePreviews.length > 0 && (
              <div className="px-4 py-3 bg-white border-t border-zinc-100 flex items-center gap-2 overflow-x-auto shrink-0">
                {imagePreviews.map((previewUrl, idx) => (
                  <div key={idx} className="relative shrink-0 group">
                    <img
                      src={previewUrl}
                      alt={`Preview ${idx + 1}`}
                      className="w-16 h-16 rounded-xl object-cover border-2 border-blue-200 shadow-sm"
                    />
                    <button
                      type="button"
                      onClick={() => removeSelectedImage(idx)}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold shadow-md opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={clearSelectedImages}
                  className="text-[10px] font-bold text-red-500 hover:text-red-600 px-2 py-1 rounded-lg hover:bg-red-50 transition-colors whitespace-nowrap cursor-pointer"
                >
                  Clear all
                </button>
              </div>
            )}

            {/* Input send bar */}
            <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-zinc-150 flex items-center gap-2 shrink-0">
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageSelect}
                className="hidden"
              />
              {/* Attachment button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="h-10 w-10 bg-zinc-100 hover:bg-zinc-200 text-zinc-500 hover:text-blue-600 rounded-xl flex items-center justify-center transition-all shrink-0 cursor-pointer"
                aria-label="Attach image"
                title="Attach images"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </button>
              <div className="flex-1 relative flex items-center">
                <input
                  type="text"
                  value={typedMessage}
                  onChange={(e) => handleTyping(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendMessage(e as any); } }}
                  placeholder={selectedImages.length > 0 ? "Add a caption (optional)..." : "Type a message..."}
                  className="w-full pl-4 pr-4 py-3 rounded-2xl border border-zinc-200 focus:border-blue-500 outline-none text-xs font-bold bg-zinc-50 transition-colors"
                />
              </div>
              <button
                type="submit"
                disabled={!typedMessage.trim() && selectedImages.length === 0}
                className="h-10 w-10 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl flex items-center justify-center shadow-md active:scale-[0.97] transition-all shrink-0"
                aria-label="Send message"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                </svg>
              </button>
            </form>
          </>
        )}
      </div>

      {/* FULLSCREEN IMAGE VIEWER MODAL */}
      {imageViewerUrl && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setImageViewerUrl(null)}
        >
          <button
            onClick={() => setImageViewerUrl(null)}
            className="absolute top-6 right-6 w-10 h-10 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-full flex items-center justify-center text-lg font-bold transition-colors z-10 cursor-pointer"
          >
            ✕
          </button>
          <img
            src={imageViewerUrl}
            alt="Full size"
            className="max-w-[90vw] max-h-[85vh] object-contain rounded-2xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}

export default function MessagePage() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex justify-center items-center h-full">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <ChatContent />
    </Suspense>
  );
}
