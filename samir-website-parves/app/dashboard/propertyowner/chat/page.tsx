"use client";

import React, { useState, useRef, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { useGetMyProfileQuery } from "@/redux/api/userApi";
import {
  useGetMyChannelsQuery,
  useGetChannelMessagesQuery,
  useSendMessageMutation,
} from "@/redux/api/chatApi";
import { useNotification } from "../../owner/components/PropertyOwnerLayout";

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
  const { triggerNotification } = useNotification();
  const token = useSelector((state: RootState) => state.auth.token);
  const searchParams = useSearchParams();
  const providerIdParam = searchParams.get("providerId") || searchParams.get("ownerId");

  const { data: profileResponse } = useGetMyProfileQuery(undefined, { skip: !token });
  const [channelLimit, setChannelLimit] = useState(20);
  const { data: channelsResponse, refetch: refetchChannels, isLoading: isLoadingChannels, isFetching: isFetchingChannels } = useGetMyChannelsQuery({ page: 1, limit: channelLimit }, { skip: !token });
  const [sendMessageMutation] = useSendMessageMutation();

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
      wsRef.current.close();
    }
    const wsUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "wss://api.hostibook.com";
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      if (activeChannelNameRef.current) {
        ws.send(JSON.stringify({ type: "subscribe", channelName: activeChannelNameRef.current }));
      }
    };

    ws.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        const myId = profileResponseRef.current?.data?.id;

        if (parsed.type === "message" && parsed.channelName === activeChannelNameRef.current) {
          const msgData = parsed.data || parsed;
          if (msgData.senderId === myId) return;

          const newMsg = {
            id: msgData.id || `ws-${Date.now()}`,
            message: msgData.message,
            senderId: msgData.senderId,
            createdAt: msgData.createdAt || new Date().toISOString(),
            files: msgData.files || [],
          };
          setRealtimeMessages((prev) => [...prev, newMsg]);

          if (myId) {
            ws.send(JSON.stringify({ type: "seen", channelName: parsed.channelName, senderId: myId }));
          }
        } else if (parsed.type === "typing" && parsed.channelName === activeChannelNameRef.current) {
          setRemoteTyping(parsed.isTyping);
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
          if (parsed.isTyping) {
            typingTimeoutRef.current = setTimeout(() => {
              setRemoteTyping(false);
            }, 3000);
          }
        }
      } catch (err) {
        console.error("Failed to parse WebSocket message:", err);
      }
    };
  }, []);

  useEffect(() => {
    connectWs();
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connectWs]);

  // Handle URL search param: providerId / ownerId
  useEffect(() => {
    if (providerIdParam && channelsResponse) {
      const rawChannels = channelsResponse?.data?.data || channelsResponse?.data || [];
      const found = rawChannels.find((c: any) => c.receiverUser?.id === providerIdParam || c.receiverUser?._id === providerIdParam);
      if (found) {
        setActiveChannelId(found.id || found._id);
      }
    }
  }, [providerIdParam, channelsResponse]);

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
      wsRef.current?.send(JSON.stringify({ type: "subscribe", channelName }));
      const myId = profileResponseRef.current?.data?.id;
      if (myId) {
        wsRef.current?.send(JSON.stringify({ type: "seen", channelName, senderId: myId }));
      }
    };

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      doSubscribe();
    } else {
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

    // Optimistic UI update
    const optimisticId = `opt-${Date.now()}`;
    const optimisticMsg: any = {
      id: optimisticId,
      message: text || (hasImages ? `📷 ${selectedImages.length} image(s)` : ""),
      senderId: myId,
      createdAt: new Date().toISOString(),
      files: hasImages ? imagePreviews.map(url => url) : [],
    };
    setRealtimeMessages((prev) => [...prev, optimisticMsg]);
    setTypedMessage("");

    const imagesToSend = [...selectedImages];
    clearSelectedImages();

    try {
      if (hasImages && receiverId) {
        const formData = new FormData();
        formData.append("data", JSON.stringify({ message: text || "" }));
        imagesToSend.forEach(file => {
          formData.append("messageImages", file);
        });
        await sendMessageMutation({ receiverId, body: formData }).unwrap();
        setTimeout(() => { refetchMessages(); }, 300);
      } else if (channelName && wsRef.current?.readyState === WebSocket.OPEN && myId) {
        const payload = {
          type: "message",
          channelName,
          message: text,
          senderId: myId,
          receiverId,
        };
        wsRef.current.send(JSON.stringify(payload));
        setTimeout(() => { refetchMessages(); }, 600);
      } else if (receiverId) {
        const formData = new FormData();
        formData.append("data", JSON.stringify({ message: text }));
        await sendMessageMutation({ receiverId, body: formData }).unwrap();
        refetchMessages();
      }
    } catch (err: any) {
      console.error("Failed to send message:", err);
      triggerNotification("Failed to send message", "error");
    }
  };

  const handleTyping = (value: string) => {
    setTypedMessage(value);
    const channelName = activeChannelNameRef.current;
    const myId = profileResponse?.data?.id;
    if (!channelName || !myId || wsRef.current?.readyState !== WebSocket.OPEN) return;

    if (!isSendingTypingRef.current) {
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
  const sortedRest = [...allPagedMessages].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
  const allMessageIds = new Set(sortedRest.map((m: any) => m.id || m._id));
  const messages = [
    ...sortedRest,
    ...realtimeMessages.filter((m) => !allMessageIds.has(m.id)),
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
            <svg className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
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
                        <span className={`text-[10px] font-semibold ${isActive ? "text-blue-100" : "text-zinc-400"}`}>
                          {lastMsgTime}
                        </span>
                      </div>
                      <p className={`text-xs truncate font-medium ${isActive ? "text-blue-100" : "text-zinc-500"}`}>
                        {lastMsgText}
                      </p>
                    </div>
                  </button>
                );
              })
          )}

          {(() => {
            const channelsMeta = channelsResponse?.data?.meta || channelsResponse?.meta;
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

      {/* CHAT WINDOW */}
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
            <h3 className="text-base font-black text-zinc-955">Start your message</h3>
            <p className="text-xs text-zinc-400 mt-1 font-semibold leading-relaxed">
              Select a thread from the side panel to coordinate with your home assistants, plumbers, or managers.
            </p>
          </div>
        ) : (
          <>
            {/* Header */}
            {(() => {
              const cr = channelsResponseRef.current;
              const rawChs = cr?.data?.data || cr?.data || [];
              const chat = rawChs.find((c: any) => c.id === activeChannelId || c._id === activeChannelId)!;
              const name = chat?.receiverUser?.fullName || "Chat";
              const avatar = chat?.receiverUser?.profileImage || "https://i.ibb.co/Ps9gZ8DD/Profile-image.png";
              return (
                <div className="p-4 bg-white border-b border-zinc-150 flex items-center justify-between shadow-sm shrink-0">
                  <div className="flex items-center gap-3">
                    <button onClick={() => setActiveChannelId(null)} className="lg:hidden p-1.5 rounded-full hover:bg-zinc-100 text-zinc-500 transition-colors cursor-pointer">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <div className="relative w-10 h-10 rounded-full overflow-hidden bg-zinc-200 shadow-inner">
                      <img src={avatar} alt={name} className="w-full h-full object-cover" />
                    </div>
                    <div className="text-left">
                      <h4 className="text-sm font-bold text-zinc-900 leading-tight">{name}</h4>
                      <p className="text-[10px] text-zinc-400 font-semibold">Active Now</p>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* History */}
            <div className="flex-1 p-5 overflow-y-auto space-y-4">
              {messages.map((msg, idx) => {
                const myId = profileResponse?.data?.id;
                const isMe = msg.senderId === myId;
                return (
                  <div key={msg.id || idx} className={`flex flex-col max-w-[80%] ${isMe ? "ml-auto items-end" : "mr-auto items-start"}`}>
                    <div className={`p-4 rounded-2xl text-xs font-bold leading-relaxed text-left ${
                      isMe ? "bg-blue-600 text-white rounded-br-none" : "bg-zinc-150 text-zinc-800 rounded-bl-none border border-zinc-200"
                    }`}>
                      {msg.message}
                      {msg.files && msg.files.map((fileUrl: string, fIdx: number) => (
                        <div key={fIdx} className="mt-2 rounded-lg overflow-hidden max-w-xs cursor-pointer">
                          <img
                            src={fileUrl}
                            alt="attachment"
                            className="w-full h-auto object-cover max-h-40 hover:opacity-90 active:scale-95 transition-all"
                            onClick={() => window.open(fileUrl, "_blank")}
                          />
                        </div>
                      ))}
                    </div>
                    <span className="text-[9px] font-semibold text-zinc-400 mt-1">{formatMsgTime(msg.createdAt)}</span>
                  </div>
                );
              })}
              {remoteTyping && (
                <div className="mr-auto text-xs text-zinc-400 font-semibold italic animate-pulse">
                  Typing...
                </div>
              )}
              <div ref={messageEndRef} />
            </div>

            {/* Input send bar */}
            <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-zinc-150 flex items-center gap-3 shrink-0">
              <div className="flex-1 relative flex items-center">
                <input
                  type="text"
                  value={typedMessage}
                  onChange={(e) => handleTyping(e.target.value)}
                  placeholder="Type something..."
                  className="w-full pl-4 pr-12 py-3 rounded-2xl border border-zinc-200 focus:border-blue-500 outline-none text-xs font-bold bg-zinc-50/50"
                />
                <label className="absolute right-4 text-zinc-400 hover:text-zinc-650 cursor-pointer">
                  <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageSelect} />
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </label>
              </div>

              {/* Previews of selected images to attach */}
              {imagePreviews.length > 0 && (
                <div className="absolute bottom-20 left-4 right-4 bg-white border border-zinc-200 p-3 rounded-2xl flex gap-3 overflow-x-auto shadow-xl z-50">
                  {imagePreviews.map((url, index) => (
                    <div key={index} className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 border">
                      <img src={url} alt="preview" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => removeSelectedImage(index)} className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-4 h-4 flex items-center justify-center text-[9px] font-black">
                        x
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <button
                type="submit"
                className="h-10 w-10 bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center justify-center shadow-md active:scale-[0.98] transition-all shrink-0 cursor-pointer"
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
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[400px] w-full flex flex-col justify-center items-center font-sans">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <ChatContent />
    </Suspense>
  );
}
