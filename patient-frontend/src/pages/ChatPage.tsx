import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/AuthContext";
import HeaderNav from "@/components/HeaderNav";
import { io, Socket } from "socket.io-client";
import { Send, MessageCircle, ArrowLeft, Circle } from "lucide-react";

const API_URL = import.meta.env.DEV ? "http://localhost:10001" : "https://patient-backend-olyv.onrender.com";

type Conversation = {
  _id: string;
  participants: { id: string; name: string; role: string }[];
  lastMessage: string;
  lastMessageAt: string;
  patientId: string;
  doctorId: string;
};

type ChatMessage = {
  _id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  receiverId: string;
  text: string;
  read: boolean;
  createdAt: string;
};

export default function ChatPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const patientId = user?.id || "";
  const patientName = user?.name || "Patient";

  // Initialize Socket.IO
  useEffect(() => {
    if (!patientId) return;

    const socket = io(API_URL, { transports: ["websocket", "polling"] });
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("✅ Patient socket connected");
      socket.emit("user_online", { userId: patientId, role: "patient" });
    });

    socket.on("online_users", (users: string[]) => {
      setOnlineUsers(users);
    });

    socket.on("new_message", (message: ChatMessage) => {
      setMessages((prev) => {
        if (prev.some((m) => m._id === message._id)) return prev;
        return [...prev, message];
      });
      setConversations((prev) =>
        prev.map((c) =>
          c._id === message.conversationId
            ? { ...c, lastMessage: message.text, lastMessageAt: message.createdAt }
            : c
        )
      );
    });

    socket.on("user_typing", ({ userName }: { userId: string; userName: string }) => {
      setTypingUser(userName);
    });

    socket.on("user_stop_typing", () => {
      setTypingUser(null);
    });

    return () => {
      socket.disconnect();
    };
  }, [patientId]);

  // Fetch conversations
  useEffect(() => {
    if (!patientId) return;

    const fetchConversations = async () => {
      try {
        const res = await fetch(`${API_URL}/api/conversations?userId=${patientId}&role=patient`);
        const data = await res.json();
        if (data.status === "ok") {
          setConversations(data.conversations);
        }
      } catch (err) {
        console.error("Failed to fetch conversations:", err);
      }
    };

    fetchConversations();
  }, [patientId]);

  // Fetch messages when conversation changes
  useEffect(() => {
    if (!activeConversation) return;

    const fetchMessages = async () => {
      try {
        const res = await fetch(`${API_URL}/api/messages/${activeConversation._id}`);
        const data = await res.json();
        if (data.status === "ok") {
          setMessages(data.messages);
        }
      } catch (err) {
        console.error("Failed to fetch messages:", err);
      }
    };

    fetchMessages();
    socketRef.current?.emit("join_conversation", activeConversation._id);

    return () => {
      socketRef.current?.emit("leave_conversation", activeConversation._id);
    };
  }, [activeConversation]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send message
  const sendMessage = () => {
    if (!newMessage.trim() || !activeConversation) return;

    const doctorParticipant = activeConversation.participants?.find((p) => p.role === "doctor");

    socketRef.current?.emit("send_message", {
      conversationId: activeConversation._id,
      senderId: patientId,
      senderName: patientName,
      senderRole: "patient",
      receiverId: activeConversation.doctorId,
      receiverName: doctorParticipant?.name || "Doctor",
      text: newMessage.trim(),
    });

    socketRef.current?.emit("stop_typing", {
      conversationId: activeConversation._id,
      userId: patientId,
    });

    setNewMessage("");
  };

  // Typing indicator
  const handleTyping = () => {
    if (!activeConversation) return;

    socketRef.current?.emit("typing", {
      conversationId: activeConversation._id,
      userId: patientId,
      userName: patientName,
    });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current?.emit("stop_typing", {
        conversationId: activeConversation._id,
        userId: patientId,
      });
    }, 2000);
  };

  const getDoctorName = (conv: Conversation) => {
    const doc = conv.participants?.find((p) => p.role === "doctor");
    return doc?.name || "Doctor";
  };

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  const formatTime = (dateStr: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    return d.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-secondary/30 pb-20">
      <HeaderNav />
      <div className="container mx-auto px-4 py-6 max-w-5xl">
        <div className="mb-6">
          <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight mb-1">💬 Messages</h1>
          <p className="text-muted-foreground">Chat with your doctor in real-time</p>
        </div>

        {/* Mobile: Show conversation list OR chat, not both */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4" style={{ height: "calc(100vh - 250px)" }}>
          {/* Conversations List */}
          <div
            className={`bg-card border-2 border-border rounded-2xl flex flex-col overflow-hidden ${
              activeConversation ? "hidden lg:flex" : "flex"
            }`}
          >
            <div className="p-4 border-b">
              <h2 className="text-lg font-bold mb-1">Conversations</h2>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {conversations.length > 0 ? (
                conversations.map((conv) => {
                  const docName = getDoctorName(conv);
                  const isActive = activeConversation?._id === conv._id;
                  const isOnline = onlineUsers.includes(conv.doctorId);

                  return (
                    <button
                      key={conv._id}
                      onClick={() => setActiveConversation(conv)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left ${
                        isActive
                          ? "bg-emerald-500/10 border border-emerald-500/30 shadow-sm"
                          : "hover:bg-muted border border-transparent"
                      }`}
                    >
                      <div className="relative">
                        <div
                          className={`w-11 h-11 rounded-full flex items-center justify-center font-semibold text-sm ${
                            isActive
                              ? "bg-emerald-600 text-white"
                              : "bg-muted text-foreground"
                          }`}
                        >
                          {getInitials(docName)}
                        </div>
                        {isOnline && (
                          <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-green-500 border-2 border-card" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-sm truncate">{docName}</p>
                          <span className="text-[10px] text-muted-foreground flex-shrink-0">
                            {formatTime(conv.lastMessageAt)}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {conv.lastMessage || "No messages yet"}
                        </p>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center py-12">
                  <MessageCircle className="w-12 h-12 text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground">No conversations yet</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Your doctor will start a conversation with you
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div
            className={`lg:col-span-2 bg-card border-2 border-border rounded-2xl flex flex-col overflow-hidden ${
              activeConversation ? "flex" : "hidden lg:flex"
            }`}
          >
            {activeConversation ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b flex items-center gap-3">
                  <button
                    onClick={() => setActiveConversation(null)}
                    className="lg:hidden p-2 rounded-lg hover:bg-muted transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-semibold text-sm">
                      {getInitials(getDoctorName(activeConversation))}
                    </div>
                    {onlineUsers.includes(activeConversation.doctorId) && (
                      <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-500 border-2 border-card" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-base">{getDoctorName(activeConversation)}</h3>
                    <p className="text-xs text-muted-foreground">
                      {onlineUsers.includes(activeConversation.doctorId)
                        ? "🟢 Online"
                        : "⚪ Offline"}
                    </p>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <MessageCircle className="h-16 w-16 text-muted-foreground/20 mb-3" />
                      <p className="text-muted-foreground text-sm">
                        Start the conversation by sending a message
                      </p>
                    </div>
                  )}
                  {messages.map((msg) => {
                    const isPatient = msg.senderRole === "patient";
                    return (
                      <div
                        key={msg._id}
                        className={`flex ${isPatient ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                            isPatient
                              ? "bg-emerald-600 text-white rounded-br-md"
                              : "bg-muted text-foreground rounded-bl-md"
                          }`}
                        >
                          {!isPatient && (
                            <p className="text-[10px] font-semibold opacity-70 mb-0.5">
                              {msg.senderName}
                            </p>
                          )}
                          <p className="text-sm leading-relaxed">{msg.text}</p>
                          <p
                            className={`text-[10px] mt-1 ${
                              isPatient ? "text-white/60" : "text-muted-foreground"
                            }`}
                          >
                            {new Date(msg.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  {typingUser && (
                    <div className="flex justify-start">
                      <div className="bg-muted rounded-2xl px-4 py-2.5 rounded-bl-md">
                        <p className="text-xs text-muted-foreground animate-pulse">
                          {typingUser} is typing...
                        </p>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-4 border-t">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => {
                        setNewMessage(e.target.value);
                        handleTyping();
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                      className="flex-1 px-4 py-3 rounded-xl border-2 border-border bg-background focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                    />
                    <button
                      onClick={sendMessage}
                      disabled={!newMessage.trim()}
                      className="px-4 py-3 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4">
                  <MessageCircle className="h-10 w-10 text-emerald-500/50" />
                </div>
                <h2 className="text-xl font-semibold text-muted-foreground mb-2">
                  Select a conversation
                </h2>
                <p className="text-sm text-muted-foreground max-w-md">
                  Choose a conversation from the left to start chatting with your doctor.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
