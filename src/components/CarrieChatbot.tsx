import React, {useState, useRef, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import {Colors} from '../constants/Colors';
import BottomNavigation from './BottomNavigation';

interface CarrieChatbotProps {
  currentScreen: string;
  onNavigate: (screen: string) => void;
  onBack?: () => void;
  onScanPress?: () => void;
}

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'carrie';
  timestamp: Date;
}

const SCREEN_WIDTH = Dimensions.get('window').width || 375;

// Quick reply suggestions
const QUICK_REPLIES = [
  'What is Canny Carrot?',
  'How much does it cost?',
  'How do I collect stamps?',
  'My stamp is missing!',
  'Birthday rewards',
  'Local businesses',
];

// Carrie's knowledge base - key phrases to responses
const CARRIE_RESPONSES: Record<string, string> = {
  // Greetings
  'hello|hi|hey|hiya': `Hiya! 🥕 I'm Carrie Carrot, your friendly AI support assistant for Canny Carrot! 

I'm here 24/7 to help you get the most out of your loyalty programme. Whether you're wondering about collecting stamps, redeeming rewards, or finding local businesses - I've got you sorted!

What can I help you with today?`,

  // What is Canny Carrot
  'what is canny carrot|what is this|about': `Canny Carrot is a clever digital loyalty platform that puts traditional 'Buy X, Get Y Free' punch cards on your phone! 📱

**For You as a Customer:**
• No more lost cards or forgotten stamps
• Collect rewards in-store OR online - it all counts!
• Get special offers and birthday surprises 🎂
• Redeem rewards instantly

**Why 'Canny'?**
In the North East, 'canny' means good, great, brilliant! So Canny Carrot = Good Carrot. Perfect for supporting our local High Street heroes! 🥕`,

  // Pricing
  'price|cost|how much|pricing|plans': `We keep it simple and fair! Here's what's on offer:

**🌱 Free:** £0/month
• 1 reward program, up to 50 members
• Basic analytics, QR code scanning

**⭐ Starter:** £19.99/month
• 3 reward programs, 500 members
• Full analytics, email campaigns

**🚀 Professional:** £39.99/month
• Unlimited everything!
• Push notifications, geofencing, priority support

**Key Points:**
✅ No setup fees
✅ No lock-in contracts
✅ 30-day free trial

Want to start your free trial? Visit merchant.cannycarrot.com! 🥕`,

  // How to collect stamps
  'collect stamp|how do i|earn stamp|get stamp': `Super easy! Here's how to collect stamps:

**📱 In-Store with QR Code:**
1. Open your Canny Carrot app
2. Find the business's card in 'My Cards'
3. Tap 'Collect Stamp'
4. Scan the QR code at checkout
5. ✅ Stamp appears instantly!

**🛒 Online Orders:**
1. Shop on their website
2. Log in with your Canny Carrot account
3. Complete purchase
4. Stamp auto-applies!

**The Brilliant Bit:**
ALL your stamps are in ONE account. Shop in-store today, order online tomorrow - they all count towards your reward! 🎁`,

  // Missing stamp
  'missing stamp|didn\'t get|stamp not|no stamp|where is my stamp': `Oh no! Let's sort that out! 😊

**Quick Checks:**
1. Do you have internet? (Stamps need connection to sync)
2. Did you scan the QR code properly?
3. How long ago? (Sometimes 10-30 second delay)

**If still missing after 2 minutes:**
• Close the app completely and reopen
• Pull down on 'My Cards' to refresh

**Still nothing?**
Just ask the staff! They can apply your stamp manually using your email or phone number. Always happy to help - we want you to get every stamp you deserve! 🥕`,

  // Birthday
  'birthday|birth day': `Birthday Club is one of our most loved features! 🎂

**How It Works:**
1. Make sure your birthday is in your profile
2. On your birthday, you'll automatically get:
   • Happy birthday message 🎉
   • A special birthday reward
   • Push notification

**It's completely automatic!** You don't need to do anything - just check your app on your special day.

**Pro Tip:** Birthday rewards are usually extra generous - businesses love treating their loyal customers on their big day! 🥕`,

  // Local businesses / high street
  'local|high street|nearby|find business|discover': `Supporting local businesses is what we're all about! 🏪

**To Find Local Businesses:**
1. Open the Canny Carrot app
2. Tap 'Discover' or 'Explore'
3. Allow location access
4. See all participating businesses near you!

**Filter by:**
• Category (cafes, restaurants, salons...)
• Distance
• Rewards available

**Tees Valley Pride:**
We're especially focused on the North East! Look for businesses in Middlesbrough, Stockton, Darlington, and beyond.

Every stamp supports a local business. Together we're building a stronger High Street! 🥕`,

  // Redeem reward
  'redeem|claim|use reward|get my reward': `Ready to claim your reward? Exciting! 🎁

**How to Redeem:**
1. Open your Canny Carrot app
2. Go to 'My Cards'
3. Find the business with your reward ready
4. Tap 'Redeem Reward'
5. Show the redemption code to staff
6. Enjoy your free treat!

**Pro Tips:**
• Rewards don't expire immediately - check the validity period
• You can redeem in-store OR online (if the business offers it)
• Staff will confirm the redemption on their end

Congratulations on earning your reward! 🥕`,

  // Help / support
  'help|support|contact|speak to someone': `I'm here to help! 🥕

**I can assist with:**
• Understanding how Canny Carrot works
• Collecting and redeeming stamps
• Finding local businesses
• Troubleshooting app issues
• Birthday rewards and special offers

**Need Human Support?**
For complex issues, billing questions, or account security:
📧 Email: support@cannycarrot.com
📱 They'll get back to you within 24 hours

Is there something specific I can help you with right now?`,

  // App issues
  'app not working|app issue|can\'t find|problem with app': `Let's troubleshoot! 🔧

**Common Fixes:**

**Can't find a business?**
• Check your location is enabled
• Try searching by exact business name
• Ask the business for their join code

**App slow or frozen?**
• Close and reopen the app
• Check your internet connection
• Update to the latest version

**Can't log in?**
• Use 'Forgot Password' to reset
• Check you're using the right email

**Still stuck?**
Tell me what's happening and I'll do my best to help! Or email support@cannycarrot.com 🥕`,

  // Gamification / leaderboard
  'leaderboard|points|achievements|badges|compete': `Gamification makes loyalty fun! 🏆

**Leaderboards:**
See how you rank against other loyal customers! Top stampers earn bragging rights and sometimes special rewards.

**Achievements:**
Unlock badges as you hit milestones:
• 🎯 First Steps - Your first stamp
• ⭐ Regular - 10 stamps collected
• 🌟 Loyal Customer - 50 stamps
• 💎 Super Fan - 100 stamps
• 🤝 Connector - Refer a friend
• 📣 Social Butterfly - Share on social media

**Referrals:**
Invite friends and earn bonus stamps when they join! Check your referral code in the app. 🥕`,

  // Default response
  'default': `Hmm, I'm not quite sure about that one! 🤔

Here are some things I can definitely help with:
• How Canny Carrot works
• Collecting and redeeming stamps
• Finding local businesses
• Missing stamps or app issues
• Birthday rewards
• Pricing and plans

Try asking about one of these, or type 'help' to see all options!

If you need to speak to a human, email support@cannycarrot.com and they'll sort you out proper! 🥕`,
};

// Carrie's introduction message
const CARRIE_INTRO = `Hiya! 👋 I'm Carrie Carrot! 🥕

I'm your friendly AI support assistant for Canny Carrot. I'm here 24/7 to help you get the most out of your loyalty programme.

I speak fluent British (and understand a bit of Geordie when we're in the North East!), and I'm dead keen on helping you earn those rewards!

What can I help you with today?`;

const CarrieChatbot: React.FC<CarrieChatbotProps> = ({
  currentScreen,
  onNavigate,
  onBack,
  onScanPress,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: CARRIE_INTRO,
      sender: 'carrie',
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const typingAnim = useRef(new Animated.Value(0)).current;

  // Typing animation
  useEffect(() => {
    if (isTyping) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(typingAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(typingAnim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      typingAnim.setValue(0);
    }
  }, [isTyping]);

  // Get Carrie's response based on user input
  const getCarrieResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();

    for (const [pattern, response] of Object.entries(CARRIE_RESPONSES)) {
      if (pattern === 'default') continue;
      
      const keywords = pattern.split('|');
      for (const keyword of keywords) {
        if (lowerMessage.includes(keyword)) {
          return response;
        }
      }
    }

    return CARRIE_RESPONSES['default'];
  };

  const handleSendMessage = (text?: string) => {
    const messageText = text || inputText.trim();
    if (!messageText) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text: messageText,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    // Simulate typing delay for Carrie
    setTimeout(() => {
      const carrieResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: getCarrieResponse(messageText),
        sender: 'carrie',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, carrieResponse]);
      setIsTyping(false);
    }, 1000 + Math.random() * 1000);
  };

  const handleQuickReply = (reply: string) => {
    handleSendMessage(reply);
  };

  // Auto scroll to bottom on new messages
  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({animated: true});
    }, 100);
  }, [messages, isTyping]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.secondary} />

      {/* Header */}
      <View style={styles.header}>
        {onBack && (
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
        )}
        <View style={styles.headerContent}>
          <View style={styles.carrieAvatar}>
            <Text style={styles.carrieEmoji}>🥕</Text>
          </View>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Carrie Carrot</Text>
            <Text style={styles.headerSubtitle}>AI Support • Always here to help</Text>
          </View>
        </View>
        {onBack && <View style={styles.backButtonSpacer} />}
      </View>

      {/* Chat Messages */}
      <KeyboardAvoidingView 
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={100}
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

          {/* Typing Indicator */}
          {isTyping && (
            <View style={[styles.messageBubble, styles.carrieBubble]}>
              <View style={styles.carrieAvatarSmall}>
                <Text style={styles.carrieEmojiSmall}>🥕</Text>
              </View>
              <View style={[styles.messageContent, styles.carrieContent, styles.typingBubble]}>
                <Animated.Text style={[styles.typingDots, {opacity: typingAnim}]}>
                  ● ● ●
                </Animated.Text>
              </View>
            </View>
          )}

          {/* Quick Replies */}
          {messages.length === 1 && (
            <View style={styles.quickRepliesContainer}>
              <Text style={styles.quickRepliesTitle}>Quick Questions:</Text>
              <View style={styles.quickReplies}>
                {QUICK_REPLIES.map((reply, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.quickReplyButton}
                    onPress={() => handleQuickReply(reply)}
                  >
                    <Text style={styles.quickReplyText}>{reply}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </ScrollView>

        {/* Input Area */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Ask Carrie anything..."
            placeholderTextColor={Colors.text.light}
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={() => handleSendMessage()}
            returnKeyType="send"
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
            onPress={() => handleSendMessage()}
            disabled={!inputText.trim()}
          >
            <Text style={styles.sendButtonText}>Send</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Bottom Navigation */}
      <BottomNavigation
        currentScreen={currentScreen}
        onNavigate={onNavigate}
        onScanPress={onScanPress}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    backgroundColor: Colors.secondary,
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backArrow: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.background,
  },
  backButtonSpacer: {
    width: 40,
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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
    fontSize: 28,
  },
  headerText: {
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.background,
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.background,
    opacity: 0.9,
  },
  chatContainer: {
    flex: 1,
    marginBottom: 80,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 20,
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
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.secondary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  carrieEmojiSmall: {
    fontSize: 18,
  },
  messageContent: {
    maxWidth: SCREEN_WIDTH * 0.75,
    borderRadius: 18,
    padding: 14,
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
    fontSize: 15,
    lineHeight: 22,
    color: Colors.text.primary,
  },
  userMessageText: {
    color: Colors.background,
  },
  typingBubble: {
    paddingVertical: 12,
  },
  typingDots: {
    fontSize: 16,
    color: Colors.text.secondary,
    letterSpacing: 2,
  },
  quickRepliesContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral[200],
  },
  quickRepliesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.secondary,
    marginBottom: 12,
  },
  quickReplies: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickReplyButton: {
    backgroundColor: Colors.secondary + '15',
    borderWidth: 1,
    borderColor: Colors.secondary,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  quickReplyText: {
    fontSize: 14,
    color: Colors.secondary,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    paddingBottom: 16,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral[200],
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    backgroundColor: Colors.neutral[50],
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.text.primary,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
  },
  sendButton: {
    backgroundColor: Colors.secondary,
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginLeft: 8,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    color: Colors.background,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CarrieChatbot;




















