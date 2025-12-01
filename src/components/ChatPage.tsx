import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  FlatList,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import {Colors} from '../constants/Colors';
import BottomNavigation from './BottomNavigation';

interface ChatPageProps {
  currentScreen: string;
  onNavigate: (screen: string) => void;
  onBack?: () => void;
  onScanPress?: () => void;
}

const SCREEN_WIDTH = Dimensions.get('window').width || 375;
const SCREEN_HEIGHT = Dimensions.get('window').height || 667;

// Placeholder topics for autofill
const TOPIC_SUGGESTIONS = [
  'Norton',
  'Stockton',
  'Wynyard',
  'Bakers',
  'Groomers',
  'Car wash',
  'Window cleaners',
  'Florists',
];

// Generate 20 placeholder avatars
const generateAvatars = () => {
  return Array.from({length: 20}, (_, i) => ({
    id: `avatar-${i + 1}`,
    name: `User ${i + 1}`,
    emoji: ['👤', '👨', '👩', '🧑', '👧', '👦'][i % 6],
  }));
};

const ChatPage: React.FC<ChatPageProps> = ({
  currentScreen,
  onNavigate,
  onBack,
  onScanPress,
}) => {
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [topicSearch, setTopicSearch] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [contactSearch, setContactSearch] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<Array<{id: string; text: string; sender: string}>>([
    {id: '1', text: 'Welcome to Canny Chat!', sender: 'System'},
  ]);

  const avatars = generateAvatars();

  const filteredSuggestions = TOPIC_SUGGESTIONS.filter(
    topic =>
      topic.toLowerCase().includes(topicSearch.toLowerCase()) &&
      !selectedTopics.includes(topic),
  );

  const handleAddTopic = (topic: string) => {
    if (!selectedTopics.includes(topic)) {
      setSelectedTopics([...selectedTopics, topic]);
      setTopicSearch('');
      setShowSuggestions(false);
    }
  };

  const handleRemoveTopic = (topic: string) => {
    setSelectedTopics(selectedTopics.filter(t => t !== topic));
  };

  const handleSendMessage = () => {
    if (chatInput.trim()) {
      setMessages([
        ...messages,
        {id: Date.now().toString(), text: chatInput, sender: 'You'},
      ]);
      setChatInput('');
    }
  };

  const headerColor = '#4ECDC4'; // Random color for header

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={headerColor} />

      {/* Header Banner */}
      <View style={[styles.headerBanner, {backgroundColor: headerColor}]}>
        {onBack && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.7}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.headerTitle}>Join in the Canny Chat</Text>
        {onBack && <View style={styles.backButtonSpacer} />}
      </View>

      {/* Top Section - Who's Online and Topics */}
      <View style={styles.topSection}>
        {/* Who's Online Section */}
        <View style={styles.whosOnlineSection}>
          <Text style={styles.whosOnlineTitle}>Who's online</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.avatarCarousel}>
            {avatars.map(avatar => (
              <View key={avatar.id} style={styles.avatarContainer}>
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarEmoji}>{avatar.emoji}</Text>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Topics Section */}
        <View style={styles.topicsSection}>
          <View style={styles.selectedTopicsContainer}>
            {selectedTopics.map(topic => (
              <View key={topic} style={styles.topicChip}>
                <Text style={styles.topicText}>{topic}</Text>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleRemoveTopic(topic)}>
                  <Text style={styles.deleteButtonText}>×</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>

          {/* Topic Search */}
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search for topics..."
              value={topicSearch}
              onChangeText={text => {
                setTopicSearch(text);
                setShowSuggestions(text.length > 0);
              }}
              onFocus={() => setShowSuggestions(topicSearch.length > 0)}
            />
            {showSuggestions && filteredSuggestions.length > 0 && (
              <View style={styles.suggestionsDropdown}>
                <FlatList
                  data={filteredSuggestions}
                  keyExtractor={item => item}
                  renderItem={({item}) => (
                    <TouchableOpacity
                      style={styles.suggestionItem}
                      onPress={() => handleAddTopic(item)}>
                      <Text style={styles.suggestionText}>{item}</Text>
                    </TouchableOpacity>
                  )}
                />
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Chat Area - fills remaining space with 10px margins */}
      <View style={styles.chatArea}>
        <ScrollView
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}>
          {messages.map(message => (
            <View
              key={message.id}
              style={[
                styles.messageBubble,
                message.sender === 'You' && styles.messageBubbleRight,
              ]}>
              <Text style={styles.messageText}>{message.text}</Text>
              <Text style={styles.messageSender}>{message.sender}</Text>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Bottom 20% - Search and Input */}
      <View style={styles.bottomSection}>
        <TextInput
          style={styles.contactSearchInput}
          placeholder="Search for contacts..."
          value={contactSearch}
          onChangeText={setContactSearch}
        />
        <View style={styles.chatInputContainer}>
          <TextInput
            style={styles.chatInput}
            placeholder="Type a message..."
            value={chatInput}
            onChangeText={setChatInput}
            multiline
          />
          <TouchableOpacity
            style={styles.sendButton}
            onPress={handleSendMessage}>
            <Text style={styles.sendButtonText}>Send</Text>
          </TouchableOpacity>
        </View>
      </View>

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
  headerBanner: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  backArrow: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.background,
  },
  backButtonSpacer: {
    width: 40,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.background,
    flex: 1,
    textAlign: 'center',
  },
  topSection: {
    paddingHorizontal: 10,
    paddingTop: 16,
  },
  whosOnlineSection: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[200],
  },
  whosOnlineTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 12,
    paddingHorizontal: 6,
  },
  avatarCarousel: {
    paddingHorizontal: 6,
  },
  avatarContainer: {
    marginRight: 12,
    alignItems: 'center',
  },
  avatarCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.neutral[100],
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  avatarEmoji: {
    fontSize: 24,
  },
  topicsSection: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[200],
  },
  selectedTopicsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
    paddingHorizontal: 6,
  },
  topicChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.secondary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  topicText: {
    fontSize: 14,
    color: Colors.background,
    fontWeight: '600',
    marginRight: 6,
  },
  deleteButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.secondary,
  },
  searchContainer: {
    paddingHorizontal: 6,
    position: 'relative',
  },
  searchInput: {
    backgroundColor: Colors.neutral[100],
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    borderWidth: 1,
    borderColor: Colors.neutral[300],
  },
  suggestionsDropdown: {
    position: 'absolute',
    top: 50,
    left: 6,
    right: 6,
    backgroundColor: Colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.neutral[300],
    maxHeight: 200,
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  suggestionItem: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[200],
  },
  suggestionText: {
    fontSize: 16,
    color: Colors.text.primary,
  },
  chatArea: {
    flex: 1,
    marginHorizontal: 10,
    marginTop: 16,
    marginBottom: 16,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    paddingVertical: 16,
  },
  messageBubble: {
    backgroundColor: Colors.neutral[100],
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    maxWidth: '80%',
    alignSelf: 'flex-start',
  },
  messageBubbleRight: {
    backgroundColor: Colors.secondary,
    alignSelf: 'flex-end',
  },
  messageText: {
    fontSize: 16,
    color: Colors.text.primary,
    marginBottom: 4,
  },
  messageSender: {
    fontSize: 12,
    color: Colors.text.secondary,
    fontWeight: '600',
  },
  bottomSection: {
    height: SCREEN_HEIGHT * 0.2,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral[200],
    padding: 16,
    paddingBottom: 100, // Space for bottom navigation
    position: 'absolute',
    bottom: 82, // Above bottom navigation, raised by 2px
    left: 0,
    right: 0,
  },
  contactSearchInput: {
    backgroundColor: Colors.neutral[100],
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.neutral[300],
  },
  chatInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  chatInput: {
    flex: 1,
    backgroundColor: Colors.neutral[100],
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: Colors.neutral[300],
    marginRight: 8,
  },
  sendButton: {
    backgroundColor: Colors.secondary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.background,
  },
});

export default ChatPage;

