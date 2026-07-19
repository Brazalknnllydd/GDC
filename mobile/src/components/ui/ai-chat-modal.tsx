import { useState, useRef, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Bot, Send, X } from "lucide-react-native";
import { colors, fonts, textRoles } from "../../constants/theme";
import { apiClient } from "../../lib/api";

type ChatMessage = {
  id: string;
  role: "user" | "model";
  text: string;
  timestamp: string;
};

type AiChatModalProps = {
  visible: boolean;
  onClose: () => void;
};

export function AiChatModal({ visible, onClose }: AiChatModalProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      role: "model",
      text: "Hello! I am your GDC Admin Assistant. Ask me anything about your sales, products, or customers.",
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (visible) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [visible, messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      text: input.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    try {
      // Pass the previous history excluding the newly added user message
      const history = messages
        .filter((m) => m.id !== "1") // Optionally remove the initial greeting
        .map((m) => ({
          role: m.role,
          text: m.text,
        }));

      const res = await apiClient.post("/chatbot/message", {
        message: userMessage.text,
        history,
      });

      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "model",
        text: res.data.response || "Sorry, I am having trouble connecting.",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "model",
        text: "I encountered an error. Please try again later.",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, botMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.modalOverlay}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <View style={styles.botTitleRow}>
              <View style={styles.botIconBadge}>
                <Bot color={colors.secondary} size={22} strokeWidth={2} />
              </View>
              <View>
                <Text style={styles.modalTitle}>AI Assistant</Text>
                <Text style={styles.modalSubtitle}>GDC Insights Bot</Text>
              </View>
            </View>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <X color={colors.textSecondary} size={20} strokeWidth={2} />
            </Pressable>
          </View>

          <ScrollView
            ref={scrollViewRef}
            contentContainerStyle={styles.messagesList}
            showsVerticalScrollIndicator={false}
          >
            {messages.map((msg) => {
              const isUser = msg.role === "user";
              return (
                <View
                  key={msg.id}
                  style={[
                    styles.messageRow,
                    isUser ? styles.messageRowUser : styles.messageRowBot,
                  ]}
                >
                  <View
                    style={[
                      styles.messageBubble,
                      isUser
                        ? styles.messageBubbleUser
                        : styles.messageBubbleBot,
                    ]}
                  >
                    <Text
                      style={[
                        styles.messageText,
                        isUser ? styles.messageTextUser : styles.messageTextBot,
                      ]}
                    >
                      {msg.text}
                    </Text>
                    <Text
                      style={[
                        styles.messageTime,
                        isUser ? styles.messageTimeUser : styles.messageTimeBot,
                      ]}
                    >
                      {formatTime(msg.timestamp)}
                    </Text>
                  </View>
                </View>
              );
            })}
            {isTyping && (
              <View style={[styles.messageRow, styles.messageRowBot]}>
                <View style={[styles.messageBubble, styles.messageBubbleBot]}>
                  <View style={styles.loadingIndicatorRow}>
                    <ActivityIndicator size="small" color={colors.secondary} />
                    <Text style={styles.loadingText}>Thinking...</Text>
                  </View>
                </View>
              </View>
            )}
          </ScrollView>

          <View style={styles.inputArea}>
            <TextInput
              style={styles.chatInput}
              placeholder="Ask about sales or products..."
              placeholderTextColor={colors.textSubtle}
              value={input}
              onChangeText={setInput}
              onSubmitEditing={handleSend}
              returnKeyType="send"
            />
            <Pressable
              style={[
                styles.sendButton,
                !input.trim() && styles.sendButtonDisabled,
              ]}
              onPress={handleSend}
              disabled={!input.trim() || isTyping}
            >
              <Send color={colors.white} size={18} strokeWidth={2} />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(19, 25, 39, 0.45)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: "75%",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  modalHeader: {
    alignItems: "center",
    borderBottomColor: colors.borderSoft,
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  botTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  botIconBadge: {
    backgroundColor: colors.surfaceBrandMuted,
    borderRadius: 12,
    padding: 8,
  },
  modalTitle: {
    color: colors.textStrong,
    ...textRoles.value,
    fontSize: 16,
  },
  modalSubtitle: {
    color: colors.success,
    ...textRoles.label,
    fontSize: 12,
    marginTop: 1,
  },
  closeButton: {
    backgroundColor: colors.surfaceNeutral,
    borderRadius: 20,
    padding: 6,
  },
  messagesList: {
    padding: 16,
    gap: 12,
  },
  messageRow: {
    flexDirection: "row",
    width: "100%",
    marginVertical: 4,
  },
  messageRowUser: {
    justifyContent: "flex-end",
  },
  messageRowBot: {
    justifyContent: "flex-start",
  },
  messageBubble: {
    borderRadius: 18,
    maxWidth: "82%",
    paddingHorizontal: 16,
    paddingVertical: 11,
    flexShrink: 1,
  },
  messageBubbleUser: {
    backgroundColor: colors.secondary,
    borderBottomRightRadius: 4,
  },
  messageBubbleBot: {
    backgroundColor: colors.surfaceInfo,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    ...textRoles.body,
    fontSize: 14,
    lineHeight: 20,
  },
  messageTextUser: {
    color: colors.white,
  },
  messageTextBot: {
    color: colors.textDark,
  },
  messageTime: {
    ...textRoles.label,
    fontSize: 9,
    marginTop: 4,
    alignSelf: "flex-end",
  },
  messageTimeUser: {
    color: colors.textOnSecondaryMuted,
  },
  messageTimeBot: {
    color: colors.textSubtle,
  },
  loadingIndicatorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 6,
    paddingVertical: 8,
  },
  loadingText: {
    color: colors.textSubtle,
    ...textRoles.label,
    fontSize: 12,
  },
  inputArea: {
    alignItems: "center",
    borderTopColor: colors.borderSoft,
    borderTopWidth: 1,
    flexDirection: "row",
    gap: 10,
    paddingBottom: Platform.OS === "ios" ? 24 : 16,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  chatInput: {
    backgroundColor: colors.surfaceNeutral,
    borderRadius: 24,
    color: colors.textStrong,
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 14,
    minHeight: 44,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  sendButton: {
    backgroundColor: colors.secondary,
    borderRadius: 22,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
    width: 44,
  },
  sendButtonDisabled: {
    backgroundColor: colors.surfaceOverlayMuted,
  },
});
