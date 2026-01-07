import React, {useState, useRef, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Easing,
} from 'react-native';
import {Colors} from '../constants/Colors';

const SCREEN_WIDTH = Dimensions.get('window').width || 375;
const SCREEN_HEIGHT = Dimensions.get('window').height || 667;

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'carrie';
  timestamp: Date;
}

// Quick reply suggestions
const QUICK_REPLIES = [
  'What is Canny Carrot?',
  'How much does it cost?',
  'How do I collect stamps?',
  'My stamp is missing!',
  'Birthday rewards',
  'Local businesses',
];

// Carrie's knowledge base
const CARRIE_RESPONSES: Record<string, string> = {
  'hello|hi|hey|hiya': `Hiya! 🥕 I'm Carrie Carrot, your friendly AI support assistant! 

I'm here 24/7 to help you with your loyalty programme. What can I help you with today?`,

  'what is canny carrot|what is this|about': `Canny Carrot is a clever digital loyalty platform that puts traditional 'Buy X, Get Y Free' punch cards on your phone! 📱

**For You:**
• No more lost cards or forgotten stamps
• Collect rewards in-store OR online
• Get special offers and birthday surprises 🎂
• Redeem rewards instantly

**Why 'Canny'?**
In the North East, 'canny' means good, great, brilliant! 🥕`,

  'price|cost|how much|pricing|plans': `We keep it simple and fair!

**🌱 Free:** £0/month - 1 reward program, 50 members
**⭐ Starter:** £19.99/month - 3 programs, 500 members  
**🚀 Professional:** £39.99/month - Unlimited everything!

✅ No setup fees
✅ No lock-in contracts
✅ 30-day free trial 🥕`,

  'collect stamp|how do i|earn stamp|get stamp': `Super easy!

**📱 In-Store:**
1. Open app → Find business card
2. Tap 'Collect Stamp'
3. Scan QR code at checkout
4. ✅ Stamp appears instantly!

**🛒 Online:**
Orders auto-apply stamps when you're logged in!

ALL stamps count towards your reward - in-store or online! 🎁`,

  'missing stamp|didn\'t get|stamp not|no stamp': `Let's sort that! 😊

**Quick Fixes:**
1. Check internet connection
2. Close & reopen app
3. Pull down to refresh

**Still missing?**
Ask staff to apply it manually with your email. We want you to get every stamp! 🥕`,

  'birthday|birth day': `Birthday Club is lovely! 🎂

Just add your birthday to your profile and you'll automatically get:
• Happy birthday message 🎉
• Special birthday reward
• Push notification

It's completely automatic! 🥕`,

  'local|high street|nearby|find business': `Supporting local is what we're about! 🏪

**To Find Businesses:**
1. Tap 'Discover' in the app
2. Allow location access
3. See all participating businesses nearby!

Every stamp supports a local business. Together we're building a stronger High Street! 🥕`,

  'redeem|claim|use reward': `Ready to claim? Exciting! 🎁

1. Open app → 'My Cards'
2. Find business with reward ready
3. Tap 'Redeem Reward'
4. Show code to staff
5. Enjoy your free treat!

Congratulations! 🥕`,

  'help|support|contact': `I'm here to help! 🥕

**I can assist with:**
• How Canny Carrot works
• Collecting and redeeming stamps
• Finding local businesses
• App troubleshooting

**Need Human Support?**
📧 support@cannycarrot.com

What can I help you with?`,

  'default': `Hmm, I'm not quite sure about that! 🤔

I can help with:
• How Canny Carrot works
• Collecting stamps
• Redeeming rewards
• Finding local businesses
• App issues

Type 'help' to see all options! 🥕`,
};

const CARRIE_INTRO = `Hiya! 👋 I'm Carrie Carrot! 🥕

Your friendly AI support - here 24/7 to help with your loyalty rewards.

What can I help you with?`;

const CarrieFloatingButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {id: '1', text: CARRIE_INTRO, sender: 'carrie', timestamp: new Date()},
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  
  const scrollViewRef = useRef<ScrollView>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;

  // Pulse animation for the floating button
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  // Bounce animation on new message
  useEffect(() => {
    if (hasUnread && !isOpen) {
      Animated.sequence([
        Animated.timing(bounceAnim, {toValue: -10, duration: 150, useNativeDriver: true}),
        Animated.timing(bounceAnim, {toValue: 0, duration: 150, useNativeDriver: true}),
        Animated.timing(bounceAnim, {toValue: -5, duration: 100, useNativeDriver: true}),
        Animated.timing(bounceAnim, {toValue: 0, duration: 100, useNativeDriver: true}),
      ]).start();
    }
  }, [hasUnread]);

  const getCarrieResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();
    for (const [pattern, response] of Object.entries(CARRIE_RESPONSES)) {
      if (pattern === 'default') continue;
      const keywords = pattern.split('|');
      for (const keyword of keywords) {
        if (lowerMessage.includes(keyword)) return response;
      }
    }
    return CARRIE_RESPONSES['default'];
  };

  const handleSendMessage = (text?: string) => {
    const messageText = text || inputText.trim();
    if (!messageText) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: messageText,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    setTimeout(() => {
      const carrieResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: getCarrieResponse(messageText),
        sender: 'carrie',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, carrieResponse]);
      setIsTyping(false);
      if (!isOpen) setHasUnread(true);
    }, 800 + Math.random() * 700);
  };

  const handleOpen = () => {
    setIsOpen(true);
    setHasUnread(false);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => scrollViewRef.current?.scrollToEnd({animated: true}), 100);
    }
  }, [messages, isOpen]);

  return (
    <>
      {/* Floating Button */}
      <Animated.View 
        style={[
          styles.floatingButton,
          {
            transform: [
              {scale: pulseAnim},
              {translateY: bounceAnim},
            ],
          },
        ]}
      >
        <TouchableOpacity
          style={styles.floatingButtonInner}
          onPress={handleOpen}
          activeOpacity={0.8}
        >
          <Text style={styles.floatingEmoji}>🥕</Text>
          {hasUnread && <View style={styles.unreadBadge} />}
        </TouchableOpacity>
      </Animated.View>

      {/* Chat Modal */}
      <Modal
        visible={isOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={handleClose}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <View style={styles.carrieAvatar}>
                  <Text style={styles.carrieEmoji}>🥕</Text>
                </View>
                <View>
                  <Text style={styles.headerTitle}>Carrie Carrot</Text>
                  <Text style={styles.headerSubtitle}>AI Support • Online</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
                <Text style={styles.closeText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Messages */}
            <KeyboardAvoidingView
              style={styles.chatContainer}
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
              <ScrollView
                ref={scrollViewRef}
                style={styles.messagesContainer}
                contentContainerStyle={styles.messagesContent}
                showsVerticalScrollIndicator={false}
              >
                {messages.map(message => (
                  <View
                    key={message.id}
                    style={[
                      styles.messageBubble,
                      message.sender === 'user' ? styles.userBubble : styles.carrieBubble,
                    ]}
                  >
                    {message.sender === 'carrie' && (
                      <View style={styles.carrieAvatarSmall}>
                        <Text style={styles.carrieEmojiSmall}>🥕</Text>
                      </View>
                    )}
                    <View style={[
                      styles.messageContent,
                      message.sender === 'user' ? styles.userContent : styles.carrieContent,
                    ]}>
                      <Text style={[
                        styles.messageText,
                        message.sender === 'user' && styles.userMessageText,
                      ]}>
                        {message.text}
                      </Text>
                    </View>
                  </View>
                ))}

                {isTyping && (
                  <View style={[styles.messageBubble, styles.carrieBubble]}>
                    <View style={styles.carrieAvatarSmall}>
                      <Text style={styles.carrieEmojiSmall}>🥕</Text>
                    </View>
                    <View style={[styles.messageContent, styles.carrieContent, styles.typingBubble]}>
                      <Text style={styles.typingDots}>● ● ●</Text>
                    </View>
                  </View>
                )}

                {/* Quick Replies - show only at start */}
                {messages.length === 1 && (
                  <View style={styles.quickReplies}>
                    {QUICK_REPLIES.slice(0, 4).map((reply, index) => (
                      <TouchableOpacity
                        key={index}
                        style={styles.quickReplyButton}
                        onPress={() => handleSendMessage(reply)}
                      >
                        <Text style={styles.quickReplyText}>{reply}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </ScrollView>

              {/* Input */}
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Ask Carrie..."
                  placeholderTextColor={Colors.text.light}
                  value={inputText}
                  onChangeText={setInputText}
                  onSubmitEditing={() => handleSendMessage()}
                  returnKeyType="send"
                />
                <TouchableOpacity
                  style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
                  onPress={() => handleSendMessage()}
                  disabled={!inputText.trim()}
                >
                  <Text style={styles.sendButtonText}>→</Text>
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  floatingButton: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    zIndex: 9999,
    elevation: 10,
  },
  floatingButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  floatingEmoji: {
    fontSize: 32,
  },
  unreadBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    borderWidth: 2,
    borderColor: Colors.background,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    height: SCREEN_HEIGHT * 0.75,
    backgroundColor: Colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.secondary,
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  carrieAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  carrieEmoji: {
    fontSize: 26,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: Colors.background,
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.background,
    opacity: 0.9,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    fontSize: 18,
    color: Colors.background,
    fontWeight: 'bold',
  },
  chatContainer: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 8,
  },
  messageBubble: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-end',
  },
  userBubble: {
    justifyContent: 'flex-end',
  },
  carrieBubble: {
    justifyContent: 'flex-start',
  },
  carrieAvatarSmall: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.secondary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  carrieEmojiSmall: {
    fontSize: 16,
  },
  messageContent: {
    maxWidth: SCREEN_WIDTH * 0.65,
    borderRadius: 16,
    padding: 12,
  },
  userContent: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 4,
    marginLeft: 'auto',
  },
  carrieContent: {
    backgroundColor: Colors.neutral[100],
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
    color: Colors.text.primary,
  },
  userMessageText: {
    color: Colors.background,
  },
  typingBubble: {
    paddingVertical: 10,
  },
  typingDots: {
    fontSize: 14,
    color: Colors.text.secondary,
    letterSpacing: 2,
  },
  quickReplies: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
    paddingLeft: 36,
  },
  quickReplyButton: {
    backgroundColor: Colors.secondary + '15',
    borderWidth: 1,
    borderColor: Colors.secondary,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  quickReplyText: {
    fontSize: 13,
    color: Colors.secondary,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral[200],
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: Colors.neutral[50],
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: Colors.text.primary,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    color: Colors.background,
    fontSize: 20,
    fontWeight: 'bold',
  },
});

export default CarrieFloatingButton;




















