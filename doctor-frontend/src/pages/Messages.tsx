import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Send, MessageCircle, Users, Circle } from "lucide-react";
import { io, Socket } from "socket.io-client";

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

type PatientInfo = {
  _id: string;
  name: string;
  email: string;
  phone: string;
  subscriptionPlan: string;
  status: string;
};

export default function Messages() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [patients, setPatients] = useState<PatientInfo[]>([]);
  const [showPatientList, setShowPatientList] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Get doctor info from localStorage
  const doctorStr = localStorage.getItem("doctor");
  const doctor = doctorStr ? JSON.parse(doctorStr) : null;
  const doctorId = doctor?._id || doctor?.id || "";
  const doctorName = doctor?.name || "Doctor";

  // Initialize Socket.IO
  useEffect(() => {
    const socket = io(API_URL, { transports: ["websocket", "polling"] });
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("✅ Doctor socket connected");
      socket.emit("user_online", { userId: doctorId, role: "doctor" });
    });

    socket.on("online_users", (users: string[]) => {
      setOnlineUsers(users);
    });

    socket.on("new_message", (message: ChatMessage) => {
      setMessages((prev) => {
        if (prev.some((m) => m._id === message._id)) return prev;
        return [...prev, message];
      });
      // Update conversation list
      setConversations((prev) =>
        prev.map((c) =>
          c._id === message.conversationId
            ? { ...c, lastMessage: message.text, lastMessageAt: message.createdAt }
            : c
        )
      );
    });

    socket.on("message_notification", (data: { conversationId: string; senderName: string; text: string }) => {
      // Could show a toast notification here
      console.log(`📩 New message from ${data.senderName}: ${data.text}`);
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
  }, [doctorId]);

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    if (!doctorId) return;
    try {
      const res = await fetch(`${API_URL}/api/conversations?userId=${doctorId}&role=doctor`);
      const data = await res.json();
      if (data.status === "ok") {
        setConversations(data.conversations);
      }
    } catch (err) {
      console.error("Failed to fetch conversations:", err);
    }
  }, [doctorId]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

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

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Fetch patients for new conversations
  const fetchPatients = async () => {
    try {
      const res = await fetch(`${API_URL}/api/chat/patients`);
      const data = await res.json();
      if (data.status === "ok") {
        setPatients(data.patients);
      }
    } catch (err) {
      console.error("Failed to fetch patients:", err);
    }
  };

  // Start new conversation with a patient
  const startConversation = async (patient: PatientInfo) => {
    try {
      const res = await fetch(`${API_URL}/api/conversations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: patient._id,
          patientName: patient.name,
          doctorId,
          doctorName,
        }),
      });
      const data = await res.json();
      if (data.status === "ok") {
        setActiveConversation(data.conversation);
        setShowPatientList(false);
        fetchConversations();
      }
    } catch (err) {
      console.error("Failed to create conversation:", err);
    }
  };

  // Send message
  const sendMessage = () => {
    if (!newMessage.trim() || !activeConversation) return;

    const patientParticipant = activeConversation.participants?.find((p) => p.role === "patient");

    socketRef.current?.emit("send_message", {
      conversationId: activeConversation._id,
      senderId: doctorId,
      senderName: doctorName,
      senderRole: "doctor",
      receiverId: activeConversation.patientId,
      receiverName: patientParticipant?.name || "Patient",
      text: newMessage.trim(),
    });

    socketRef.current?.emit("stop_typing", {
      conversationId: activeConversation._id,
      userId: doctorId,
    });

    setNewMessage("");
  };

  // Handle typing indicator
  const handleTyping = () => {
    if (!activeConversation) return;

    socketRef.current?.emit("typing", {
      conversationId: activeConversation._id,
      userId: doctorId,
      userName: doctorName,
    });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current?.emit("stop_typing", {
        conversationId: activeConversation._id,
        userId: doctorId,
      });
    }, 2000);
  };

  const getPatientName = (conv: Conversation) => {
    const patient = conv.participants?.find((p) => p.role === "patient");
    return patient?.name || "Patient";
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

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

  const filteredConversations = conversations.filter((c) =>
    getPatientName(c).toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Messages</h1>
          <p className="text-muted-foreground">Communicate with your patients in real-time</p>
        </div>
        <Button
          onClick={() => {
            setShowPatientList(!showPatientList);
            if (!showPatientList) fetchPatients();
          }}
          className="gap-2"
        >
          <Users className="h-4 w-4" />
          New Chat
        </Button>
      </div>

      {/* Patient Selection Modal */}
      {showPatientList && (
        <Card className="border-primary/30 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Start conversation with a patient
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[300px] overflow-y-auto">
              {patients.map((p) => (
                <button
                  key={p._id}
                  onClick={() => startConversation(p)}
                  className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent hover:border-primary/50 transition-all text-left"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {getInitials(p.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{p.email}</p>
                    <Badge variant="outline" className="mt-1 text-xs">
                      {p.subscriptionPlan}
                    </Badge>
                  </div>
                  {onlineUsers.includes(p._id) && (
                    <Circle className="h-3 w-3 fill-green-500 text-green-500 flex-shrink-0" />
                  )}
                </button>
              ))}
              {patients.length === 0 && (
                <p className="text-muted-foreground text-sm col-span-full text-center py-4">
                  No patients found
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-260px)]">
        {/* Conversations List */}
        <Card className="lg:col-span-1 flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Conversations</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search conversations..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto space-y-1 p-3">
            {filteredConversations.length > 0 ? (
              filteredConversations.map((conv) => {
                const patientName = getPatientName(conv);
                const isActive = activeConversation?._id === conv._id;
                const isOnline = onlineUsers.includes(conv.patientId);

                return (
                  <button
                    key={conv._id}
                    onClick={() => setActiveConversation(conv)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left ${
                      isActive
                        ? "bg-primary/10 border border-primary/30 shadow-sm"
                        : "hover:bg-accent border border-transparent"
                    }`}
                  >
                    <div className="relative">
                      <Avatar className="h-11 w-11">
                        <AvatarFallback
                          className={`font-semibold text-sm ${
                            isActive
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-foreground"
                          }`}
                        >
                          {getInitials(patientName)}
                        </AvatarFallback>
                      </Avatar>
                      {isOnline && (
                        <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-green-500 border-2 border-background" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-sm truncate">{patientName}</p>
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
              <div className="flex flex-col items-center justify-center h-full text-center py-8">
                <MessageCircle className="h-12 w-12 text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">No conversations yet.</p>
                <p className="text-xs text-muted-foreground mt-1">Click "New Chat" to start</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Chat Area */}
        <Card className="lg:col-span-2 flex flex-col">
          {activeConversation ? (
            <>
              {/* Chat Header */}
              <CardHeader className="pb-3 border-b">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                        {getInitials(getPatientName(activeConversation))}
                      </AvatarFallback>
                    </Avatar>
                    {onlineUsers.includes(activeConversation.patientId) && (
                      <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-500 border-2 border-background" />
                    )}
                  </div>
                  <div>
                    <CardTitle className="text-base">
                      {getPatientName(activeConversation)}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {onlineUsers.includes(activeConversation.patientId)
                        ? "🟢 Online"
                        : "⚪ Offline"}
                    </p>
                  </div>
                </div>
              </CardHeader>

              {/* Messages */}
              <CardContent className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <MessageCircle className="h-16 w-16 text-muted-foreground/20 mb-3" />
                    <p className="text-muted-foreground text-sm">
                      Start the conversation by sending a message
                    </p>
                  </div>
                )}
                {messages.map((msg) => {
                  const isDoctor = msg.senderRole === "doctor";
                  return (
                    <div
                      key={msg._id}
                      className={`flex ${isDoctor ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                          isDoctor
                            ? "bg-primary text-primary-foreground rounded-br-md"
                            : "bg-muted text-foreground rounded-bl-md"
                        }`}
                      >
                        {!isDoctor && (
                          <p className="text-[10px] font-semibold opacity-70 mb-0.5">
                            {msg.senderName}
                          </p>
                        )}
                        <p className="text-sm leading-relaxed">{msg.text}</p>
                        <p
                          className={`text-[10px] mt-1 ${
                            isDoctor ? "text-primary-foreground/60" : "text-muted-foreground"
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
              </CardContent>

              {/* Message Input */}
              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <Input
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
                    className="flex-1"
                  />
                  <Button onClick={sendMessage} disabled={!newMessage.trim()} size="icon">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <CardContent className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <MessageCircle className="h-10 w-10 text-primary/50" />
              </div>
              <h2 className="text-xl font-semibold text-muted-foreground mb-2">
                Select a conversation
              </h2>
              <p className="text-sm text-muted-foreground max-w-md">
                Choose a patient from the left panel or start a new chat to begin messaging.
              </p>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}
