import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import Nav from "@/components/Nav";
import { useAuth } from "@/hooks/useAuth";
import { useSocket } from "@/hooks/useSocket";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Users } from "lucide-react";

interface ChatMessageType {
  id: string;
  userId: string;
  message: string;
  room: string;
  createdAt: string;
  user?: {
    fullName: string;
    collegeRollNo: string;
  };
}

export default function ChatRoom() {
  const { user } = useAuth();
  const [messageText, setMessageText] = useState("");
  const [room] = useState("general");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { isConnected, messages: socketMessages, onlineCount, sendMessage } = useSocket();

  // Fetch initial messages
  const { data: initialMessages } = useQuery({
    queryKey: ["/api/chat/messages", { room, limit: 50 }],
    staleTime: 30 * 1000, // 30 seconds
  });

  // Combine initial messages with real-time messages
  const allMessages = [...(initialMessages?.messages || []), ...socketMessages];

  // Remove duplicates based on message content and timestamp
  const uniqueMessages = allMessages.filter((message, index, array) => 
    array.findIndex(m => 
      m.message === message.message && 
      Math.abs(new Date(m.createdAt).getTime() - new Date(message.createdAt).getTime()) < 1000
    ) === index
  );

  // Sort messages by creation time
  const sortedMessages = uniqueMessages.sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [sortedMessages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !isConnected) return;

    sendMessage(messageText.trim(), room);
    setMessageText("");
  };

  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';
  };

  const getMessageTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const isMyMessage = (message: ChatMessageType) => {
    return message.userId === user?.id;
  };

  return (
    <div className="min-h-screen bg-background">
      <Nav />
      
      <main className="pt-16 pb-20 md:pt-0 md:pb-0 md:ml-64 min-h-screen">
        <div className="p-4 md:p-6 h-full">
          <div className="max-w-4xl mx-auto h-full flex flex-col">
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-foreground">Chat Room</h2>
                  <p className="text-muted-foreground">General Discussion</p>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className="text-sm text-muted-foreground" data-testid="text-connection-status">
                    {isConnected ? `${onlineCount || 0} online` : 'Disconnected'}
                  </span>
                  <Users className="w-4 h-4 text-muted-foreground" />
                </div>
              </div>
            </div>

            {/* Chat Messages */}
            <Card className="flex-1 flex flex-col">
              <CardContent className="flex-1 flex flex-col p-0">
                <div className="flex-1 p-4 space-y-4 overflow-y-auto max-h-[calc(100vh-300px)]" data-testid="chat-messages">
                  {sortedMessages.length > 0 ? (
                    sortedMessages.map((message: ChatMessageType, index) => (
                      <div
                        key={`${message.id}-${index}`}
                        className={`flex space-x-3 ${isMyMessage(message) ? 'justify-end' : ''}`}
                        data-testid={`message-${index}`}
                      >
                        {!isMyMessage(message) && (
                          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-medium text-primary-foreground">
                              {getInitials(message.user?.fullName || 'Unknown')}
                            </span>
                          </div>
                        )}
                        
                        <div className={`flex-1 ${isMyMessage(message) ? 'max-w-xs' : ''}`}>
                          {!isMyMessage(message) && (
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="font-medium text-foreground text-sm">
                                {message.user?.fullName || 'Unknown User'}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {getMessageTime(message.createdAt)}
                              </span>
                            </div>
                          )}
                          
                          <div className={`p-3 rounded-lg ${
                            isMyMessage(message) 
                              ? 'bg-primary text-primary-foreground ml-auto' 
                              : 'bg-muted text-foreground'
                          }`}>
                            <p className="text-sm">{message.message}</p>
                            {isMyMessage(message) && (
                              <div className="flex justify-end mt-1">
                                <span className="text-xs opacity-70">
                                  {getMessageTime(message.createdAt)}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {isMyMessage(message) && (
                          <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-medium text-secondary-foreground">
                              {getInitials(user?.fullName || 'You')}
                            </span>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8" data-testid="empty-messages">
                      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                        <Send className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <h3 className="font-medium text-foreground mb-2">No messages yet</h3>
                      <p className="text-muted-foreground">Start the conversation by sending a message</p>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Chat Input */}
                <div className="p-4 border-t border-border">
                  <form onSubmit={handleSendMessage} className="flex space-x-3">
                    <Input
                      type="text"
                      placeholder={isConnected ? "Type your message..." : "Connecting..."}
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      disabled={!isConnected}
                      className="flex-1"
                      data-testid="input-message"
                    />
                    <Button 
                      type="submit"
                      disabled={!messageText.trim() || !isConnected}
                      data-testid="button-send-message"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </form>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
