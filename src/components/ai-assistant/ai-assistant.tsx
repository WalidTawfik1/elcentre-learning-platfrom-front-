import React, { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  MessageSquare, 
  Send, 
  Bot, 
  User, 
  Loader2, 
  RefreshCw,
  Trash2,
  Copy,
  Check,
  AlertTriangle,
  ChevronDown
} from "lucide-react";
import { GroqService } from "@/services/groq-service";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
  error?: boolean;
}

interface AIAssistantProps {
  lessonId?: number;
  lessonTitle?: string;
  lessonTranscript?: string;
  isLoadingTranscript?: boolean;
}

export function AIAssistant({ lessonId, lessonTitle, lessonTranscript, isLoadingTranscript }: AIAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [currentLessonId, setCurrentLessonId] = useState<number | undefined>(lessonId);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  // Improved auto-scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, []);

  // Auto-scroll to bottom when new messages arrive with delay for content rendering
  useEffect(() => {
    const timer = setTimeout(scrollToBottom, 100);
    return () => clearTimeout(timer);
  }, [messages, scrollToBottom]);

  // Check if user has scrolled up to show scroll-to-bottom button
  const handleScroll = useCallback(() => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        const { scrollTop, scrollHeight, clientHeight } = scrollElement;
        const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
        setShowScrollButton(!isNearBottom && messages.length > 0);
      }
    }
  }, [messages.length]);

  // Set up scroll event listener
  useEffect(() => {
    const scrollElement = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
    if (scrollElement) {
      scrollElement.addEventListener('scroll', handleScroll);
      return () => scrollElement.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  // Load chat history from localStorage and clear when lesson changes
  useEffect(() => {
    // Check if lesson has actually changed
    if (lessonId !== currentLessonId) {
      // Clear messages immediately when lesson changes
      setMessages([]);
      setCurrentLessonId(lessonId);
      
      // Clear any ongoing loading state
      setIsLoading(false);
      setInputValue("");
    }
    
    // Only proceed if we have a valid lesson ID and title
    if (!lessonId || !lessonTitle) {
      setMessages([]);
      return;
    }
    
    // Use lessonId as the primary key for more reliability
    const chatKey = `ai-chat-lesson-${lessonId}`;
    const savedMessages = localStorage.getItem(chatKey);
    
    if (savedMessages) {
      try {
        const parsed = JSON.parse(savedMessages);
        // Convert timestamp strings back to Date objects and validate structure
        const messagesWithDates = parsed
          .filter((msg: any) => msg && msg.content && msg.sender && msg.timestamp)
          .map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }));
        setMessages(messagesWithDates);
      } catch (error) {
        console.error('Error loading chat history:', error);
        setMessages([]);
      }
    } else {
      // Only add welcome message if there's no saved chat history and we have lesson data
      if (lessonTitle && lessonTranscript) {
        const welcomeMessage: Message = {
          id: `welcome-lesson-${lessonId}`,
          content: `Hi! I'm your AI assistant for this lesson: "${lessonTitle}". I've analyzed the lesson content and I'm ready to help you understand the material. Feel free to ask me any questions about what you've learned!`,
          sender: 'assistant',
          timestamp: new Date()
        };
        setMessages([welcomeMessage]);
      }
    }
  }, [lessonId, lessonTitle, lessonTranscript, currentLessonId]);

  // Save chat history to localStorage
  useEffect(() => {
    if (messages.length > 0 && lessonId && lessonTitle) {
      const chatKey = `ai-chat-lesson-${lessonId}`;
      localStorage.setItem(chatKey, JSON.stringify(messages));
    }
  }, [messages, lessonId, lessonTitle]);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      // Prepare chat history for context
      const chatHistory = messages.map(msg => ({
        role: msg.sender === 'user' ? 'user' as const : 'assistant' as const,
        content: msg.content
      }));

      const result = await GroqService.sendMessage(
        content,
        {
          lessonTitle,
          lessonTranscript,
          chatHistory
        }
      );

      if (result.error) {
        throw new Error(result.error);
      }

      if (!result.response) {
        throw new Error('No response received from AI');
      }

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: result.response,
        sender: 'assistant',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
      
    } catch (error: any) {
      console.error('Error sending message:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `Sorry, I'm having trouble responding right now. ${error.message || 'Please try again.'}`,
        sender: 'assistant',
        timestamp: new Date(),
        error: true
      };
      
      setMessages(prev => [...prev, errorMessage]);
      
      toast({
        title: "AI Assistant Error",
        description: error.message || "Failed to get response from AI assistant. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [messages, lessonTitle, lessonTranscript, toast]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputValue);
    }
  };

  const clearChat = () => {
    setMessages([]);
    if (lessonId) {
      const chatKey = `ai-chat-lesson-${lessonId}`;
      localStorage.removeItem(chatKey);
    }
    toast({
      title: "Chat Cleared",
      description: "Your conversation with the AI assistant has been cleared.",
    });
  };

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({
      title: "Copied",
      description: "Message copied to clipboard.",
    });
  };

  const retryMessage = (messageId: string) => {
    const messageIndex = messages.findIndex(msg => msg.id === messageId);
    if (messageIndex > 0) {
      const previousUserMessage = messages[messageIndex - 1];
      if (previousUserMessage.sender === 'user') {
        // Remove the error message and retry
        setMessages(prev => prev.filter(msg => msg.id !== messageId));
        sendMessage(previousUserMessage.content);
      }
    }
  };

  return (
    <div className="w-full max-w-full space-y-6 overflow-hidden">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Bot className="h-6 w-6 text-blue-600 flex-shrink-0" />
            <span className="truncate">AI Assistant</span>
          </h2>
          <p className="text-sm text-muted-foreground mt-1 truncate">
            Ask questions about the lesson content and get intelligent responses
          </p>
        </div>
      </div>

      {/* AI Assistant Warning */}
      <Alert className="border-amber-200 bg-amber-50">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-800">
          <strong>Please note:</strong> This AI assistant can make mistakes. Always verify important information and use critical thinking when applying the responses to your learning.
        </AlertDescription>
      </Alert>

      {/* Transcript Analysis Status */}
      {isLoadingTranscript && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
            <span className="text-sm text-blue-900">
              Analyzing lesson content for better assistance...
            </span>
          </div>
        </div>
      )}

      {/* Chat Area */}
      <Card className="h-[500px] lg:h-[600px] flex flex-col w-full max-w-full overflow-hidden relative">
        <CardHeader className="pb-3 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg truncate">Ask questions about this lesson</CardTitle>
              {lessonTranscript && (
                <Badge variant="secondary" className="text-xs flex-shrink-0">
                  <Bot className="h-3 w-3 mr-1" />
                  AI Ready
                </Badge>
              )}
            </div>
            {messages.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearChat}
                className="text-red-600 hover:text-red-700 flex-shrink-0"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Clear Chat
              </Button>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col p-0 overflow-hidden min-h-0">
          <ScrollArea 
            ref={scrollAreaRef} 
            className="flex-1 p-4 overflow-hidden"
          >
            <div className="space-y-4 max-w-full">
              {messages.length === 0 && !isLoadingTranscript && (
                <div className="text-center text-muted-foreground py-8">
                  <Bot className="h-12 w-12 mx-auto mb-4 text-blue-600 opacity-50" />
                  <p className="font-medium">Start a conversation</p>
                  <p className="text-sm">Ask me anything about this lesson!</p>
                </div>
              )}
              
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex w-full ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] min-w-0 rounded-lg p-3 break-words ${
                      message.sender === 'user'
                        ? 'bg-blue-600 text-white'
                        : message.error
                        ? 'bg-red-50 border border-red-200 text-red-900'
                        : 'bg-muted'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <div className="flex-shrink-0 mt-1">
                        {message.sender === 'user' ? (
                          <User className="h-4 w-4" />
                        ) : (
                          <Bot className={`h-4 w-4 ${message.error ? 'text-red-600' : 'text-blue-600'}`} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm whitespace-pre-wrap break-words overflow-wrap-anywhere">{message.content}</p>
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-xs opacity-70">
                            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                          <div className="flex gap-1 flex-shrink-0">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 opacity-50 hover:opacity-100"
                              onClick={() => copyMessage(message.content)}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                            {message.error && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 opacity-50 hover:opacity-100"
                                onClick={() => retryMessage(message.id)}
                              >
                                <RefreshCw className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Loading indicator */}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <Bot className="h-4 w-4 text-blue-600" />
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-current rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-current rounded-full animate-bounce delay-100" />
                        <div className="w-2 h-2 bg-current rounded-full animate-bounce delay-200" />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
          
          {/* Scroll to bottom button */}
          {showScrollButton && (
            <div className="absolute bottom-20 right-6 z-10">
              <Button
                variant="secondary"
                size="sm"
                onClick={scrollToBottom}
                className="h-10 w-10 rounded-full p-0 shadow-lg border"
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
            </div>
          )}
          
          {/* Input Area */}
          <div className="p-4 border-t flex-shrink-0">
            <form onSubmit={handleSubmit} className="flex gap-2 w-full">
              <div className="flex-1 relative min-w-0">
                <Textarea
                  ref={textareaRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about this lesson..."
                  disabled={isLoading}
                  className="min-h-[40px] max-h-[120px] resize-none pr-12 w-full"
                  rows={1}
                />
                <Button 
                  type="submit" 
                  disabled={isLoading || !inputValue.trim()}
                  size="sm"
                  className="absolute right-2 bottom-2 h-6 w-6 p-0 flex-shrink-0"
                >
                  {isLoading ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Send className="h-3 w-3" />
                  )}
                </Button>
              </div>
            </form>
            <p className="text-xs text-muted-foreground mt-2">
              Press Enter to send, Shift+Enter for new line
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
