import { useState, useEffect, useRef, useCallback } from "react";
import { useSelector } from "react-redux";
import { AiOutlineSearch } from "react-icons/ai";
import { RiSendPlane2Fill } from "react-icons/ri";
import { FiMenu, FiMoreVertical, FiMessageSquare } from "react-icons/fi";
import { IoImagesOutline } from "react-icons/io5";
import { BsCheck2All } from "react-icons/bs";
import {
  useGetAllChannelsForAdminQuery,
  useGetAllMessageByChannelNameQuery,
} from "../../redux/api/chat";
import useChatSocket from "../../hooks/useChatSocket";

const Chat = () => {
  const { token } = useSelector((state) => state.auth);

  // get senderId from JWT token
  const getSenderId = () => {
    if (!token) return null;

    try {
      const payload = token.split(".")[1];
      if (!payload) return null;

      // decode base64 payload
      const decodedPayload = JSON.parse(atob(payload));

      // return ID from token
      return decodedPayload.id || decodedPayload.userId || decodedPayload._id;
    } catch (error) {
      console.error("Error decoding token:", error);
      return null;
    }
  };

  const currentUserId = getSenderId();
  // console.log("Current userId from token:", currentUserId);

  const {
    data: channelsData,
    isLoading,
    error,
  } = useGetAllChannelsForAdminQuery();

  const transformChannelsToUsers = (channels) => {
    if (!channels || !channels.data) return [];

    return channels.data.map((channel) => {
      const otherPerson =
        channel.person1.id === currentUserId
          ? channel.person2
          : channel.person1;

      return {
        id: channel.id,
        name: otherPerson.fullName,
        message: "No messages yet",
        time: new Date(channel.createdAt).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        avatar:
          otherPerson.profileImage || "https://avatar.iran.liara.run/public/28",
        online: Math.random() > 0.5,
        unread: Math.floor(Math.random() * 4),
        channelName: channel.channelName,
        person1Id: channel.person1Id,
        person2Id: channel.person2Id,
      };
    });
  };

  const users = transformChannelsToUsers(channelsData?.data);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [showSidebar, setShowSidebar] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const fileInputRef = useRef(null);

  // webSocket connection for real-time messaging
  const { messages: socketMessages, sendMessage: sendWebSocketMessage } =
    useChatSocket(selectedUser?.channelName, currentUserId);

  // fetch existing messages when channel is selected
  const {
    data: messagesData,
    isLoading: messagesLoading,
    error: messagesError,
  } = useGetAllMessageByChannelNameQuery(
    {
      channelName: selectedUser?.channelName,
      page: currentPage,
      limit: 20,
    },
    {
      skip: !selectedUser?.channelName,
    },
  );
  console.log(messagesData, "messagesData");

  // reset pagination when channel changes
  useEffect(() => {
    if (selectedUser?.channelName) {
      setCurrentPage(1);
      setMessages([]);
      setHasMore(true);
    }
  }, [selectedUser?.channelName]);

  // update messages when new socket messages arrive
  useEffect(() => {
    if (socketMessages && socketMessages.length > 0) {
      // socket messages to match UI structure
      const transformedSocketMessages = socketMessages.map((msg) => ({
        id: msg.id,
        text: msg.text || msg.message,
        files: msg.files || [],
        sender: msg.senderId === currentUserId ? "me" : "other",
        time: new Date(msg.createdAt).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        senderInfo: msg.sender,
      }));

      // Append new socket messages to existing messages (don't replace)
      setMessages((prev) => {
        // Filter out any existing messages with the same ID to avoid duplicates
        const existingIds = new Set(prev.map((msg) => msg.id));
        const newMessages = transformedSocketMessages.filter(
          (msg) => !existingIds.has(msg.id),
        );
        return [...prev, ...newMessages];
      });
    }
  }, [socketMessages, currentUserId]);

  // API messages to match UI structure
  const transformApiMessages = useCallback((apiMessages) => {
    if (!apiMessages || !Array.isArray(apiMessages)) return [];

    return apiMessages.map((msg) => ({
      id: msg.id,
      text: msg.message,
      files: msg.files || [],
      sender: msg.senderId === currentUserId ? "me" : "other",
      time: new Date(msg.createdAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      senderInfo: msg.sender,
    }));
  }, [currentUserId]);

  // update messages when API data arrives
  useEffect(() => {
    if (messagesData?.data?.data) {
      const transformedMessages = transformApiMessages(messagesData.data.data);

      if (currentPage === 1) {
        // First page - replace all messages
        setMessages(transformedMessages);
      } else {
        // Additional pages - prepend messages (for scroll to top loading)
        setMessages((prev) => [...transformedMessages, ...prev]);
      }

      // Check if there are more pages using meta information
      const meta = messagesData.data.meta;
      if (meta) {
        const total = meta.total || 0;
        const limit = meta.limit || 20;
        const page = meta.page || 1;
        const totalPages = Math.ceil(total / limit);
        setHasMore(page < totalPages);
      }
    }
  }, [messagesData, currentPage, transformApiMessages]);

  // infinite scroll handler
  const handleScroll = (e) => {
    const { scrollTop } = e.target;
    // Load more when scrolling to top (older messages)
    if (scrollTop === 0 && hasMore && !isLoadingMore && !messagesLoading) {
      loadMoreMessages();
    }
  };

  const loadMoreMessages = () => {
    setIsLoadingMore(true);
    setCurrentPage((prev) => prev + 1);
    setIsLoadingMore(false);
  };

  useEffect(() => {
    if (users.length > 0 && !selectedUser) {
      setSelectedUser(users[0]);
    }
  }, [users, selectedUser]);

  const filteredUsers = users.filter((user) =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Loading states
  if (isLoading || messagesLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  // Error states
  if (error || messagesError) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-red-500">
          Error: {error?.message || messagesError?.message}
        </div>
      </div>
    );
  }

  if (!users || users.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">No channels found</div>
      </div>
    );
  }

  const sendMessage = () => {
    if (newMessage.trim() && selectedUser) {
      // Send message via WebSocket
      sendWebSocketMessage(newMessage.trim());

      // Clear input
      setNewMessage("");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
      // add this message to the ui immediately
      const tempMessage = {
        id: `temp-${Date.now()}`,
        text: newMessage.trim(),
        sender: "me",
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        senderInfo: {
          id: currentUserId,
          fullName: "Me",
        },
      };
      setMessages((prev) => [...prev, tempMessage]);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Send file via WebSocket
      sendWebSocketMessage(`📎 ${file.name}`, file);
    }
  };
  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div
          className={`fixed inset-y-0 left-0 z-30 w-80 bg-white shadow-lg transform ${
            showSidebar ? "translate-x-0" : "-translate-x-full"
          } transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0`}
        >
          {/* Search Bar */}
          <div className="p-4 border-b border-gray-200">
            <div className="relative">
              <AiOutlineSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search messages"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-100 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          {/* User List */}
          <div className="h-[calc(100vh-120px)] overflow-y-auto">
            {filteredUsers.map((user) => (
              <div
                key={user.id}
                className={`flex items-center gap-3 p-3 cursor-pointer border-b border-gray-100 transition-colors ${
                  selectedUser?.id === user.id
                    ? "bg-blue-50"
                    : "hover:bg-gray-50"
                }`}
                onClick={() => {
                  setSelectedUser(user);
                  setShowSidebar(false);
                }}
              >
                <div className="relative">
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                  {user.online && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-gray-900 truncate">
                      {user.name}
                    </h3>
                    <span className="text-xs text-gray-400">{user.time}</span>
                  </div>
                  <p className="text-sm text-gray-500 truncate">
                    {user.message}
                  </p>
                </div>
                {user.unread > 0 && (
                  <div className="bg-blue-500 text-white text-xs rounded-full h-5 min-w-5 flex items-center justify-center ml-auto">
                    {user.unread}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden bg-white rounded-lg shadow-sm m-4">
          {selectedUser ? (
            <>
              {/* Chat Header */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-3 shadow-sm">
                <div className="flex items-center gap-4">
                  <button
                    className="md:hidden p-1 hover:bg-white/20 rounded-full"
                    onClick={() => setShowSidebar(!showSidebar)}
                  >
                    <FiMenu className="w-5 h-5" />
                  </button>
                  <div className="relative">
                    <img
                      src={selectedUser.avatar}
                      alt={selectedUser.name}
                      className="h-12 w-12 rounded-full object-cover border-2 border-white/20"
                    />
                    {selectedUser.online && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 border-2 border-white rounded-full"></div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-lg font-semibold">
                      {selectedUser.name}
                    </h2>
                    <p className="text-sm text-blue-100">
                      {selectedUser.online
                        ? "Online"
                        : `Last seen ${selectedUser.time}`}
                    </p>
                  </div>
                  <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
                    <FiMoreVertical className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Messages Area */}
              <div
                ref={messagesContainerRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto bg-gray-50 p-3 space-y-3"
              >
                {/* Loading indicator for older messages */}
                {isLoadingMore && (
                  <div className="flex justify-center py-2">
                    <div className="text-gray-500 text-sm">
                      Loading older messages...
                    </div>
                  </div>
                )}

                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${
                      msg.sender === "me" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl shadow-sm ${
                        msg.sender === "me"
                          ? "bg-blue-600 text-white rounded-br-md"
                          : "bg-white text-gray-800 border rounded-bl-md"
                      }`}
                    >
                      <p className="text-sm leading-relaxed">{msg.text}</p>
                      {msg.files && msg.files.map((fileUrl, fIdx) => (
                        <div key={fIdx} className="mt-2 rounded-lg overflow-hidden max-w-xs cursor-pointer">
                          <img
                            src={fileUrl}
                            alt="attachment"
                            className="w-full h-auto object-cover max-h-40 hover:opacity-90 active:scale-95 transition-all"
                            onClick={() => window.open(fileUrl, "_blank")}
                          />
                        </div>
                      ))}
                      <div className="flex items-center justify-between mt-2 gap-2">
                        <span
                          className={`text-xs ${
                            msg.sender === "me"
                              ? "text-blue-100"
                              : "text-gray-500"
                          }`}
                        >
                          {msg.time}
                        </span>
                        {msg.sender === "me" && (
                          <div className="flex items-center">
                            {msg.status === "sent" && (
                              <div className="w-1 h-1 bg-blue-200 rounded-full"></div>
                            )}
                            {msg.status === "delivered" && (
                              <BsCheck2All className="w-3 h-3 text-blue-200" />
                            )}
                            {msg.status === "read" && (
                              <BsCheck2All className="w-3 h-3 text-white" />
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Typing Indicator */}
                {/* {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-white border rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.1s" }}
                        ></div>
                        <div
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        ></div>
                      </div>
                    </div>
                  </div>
                )} */}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="bg-white border-t border-gray-200 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex-1 relative">
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Type a message..."
                      className="w-full px-4 py-3 pr-12 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none max-h-32"
                      rows="1"
                    />
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      className="hidden"
                      accept="image/*,application/pdf,.doc,.docx"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="p-3 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors cursor-pointer"
                    >
                      <IoImagesOutline className="w-5 h-5" />
                    </button>
                    <button
                      onClick={sendMessage}
                      disabled={!newMessage.trim()}
                      className={`p-3 rounded-full transition-all cursor-pointer ${
                        newMessage.trim()
                          ? "bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
                          : "bg-gray-200 text-gray-400 cursor-not-allowed"
                      }`}
                    >
                      <RiSendPlane2Fill className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-50">
              <div className="text-center text-gray-500">
                <FiMessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium">No conversation selected</p>
                <p className="text-sm mt-2">
                  Choose a conversation from the sidebar to start messaging
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Chat;
