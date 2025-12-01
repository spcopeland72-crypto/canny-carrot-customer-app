import React, {useState} from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  TextInput,
  FlatList,
} from 'react-native';
import {Colors} from '../constants/Colors';

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
}

interface NotificationsModalProps {
  visible: boolean;
  onClose: () => void;
  hasUnread?: boolean;
}

const MODAL_MARGIN = 20;

const NotificationsModal: React.FC<NotificationsModalProps> = ({
  visible,
  onClose,
  hasUnread = false,
}) => {
  const getScreenDimensions = () => {
    try {
      const {width, height} = Dimensions.get('window');
      return {width: width || 375, height: height || 667};
    } catch {
      return {width: 375, height: 667};
    }
  };

  const screenDimensions = getScreenDimensions();
  const SCREEN_WIDTH = screenDimensions.width;
  const SCREEN_HEIGHT = screenDimensions.height;

  const [messageText, setMessageText] = useState('');
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      title: 'Welcome to Canny Carrot!',
      message: 'Thank you for joining our rewards programme.',
      time: '2 hours ago',
      read: false,
    },
    {
      id: '2',
      title: 'New Reward Available',
      message: 'You have a new reward waiting for you at Blackwells Butchers.',
      time: '5 hours ago',
      read: false,
    },
    {
      id: '3',
      title: 'Special Offer',
      message: 'Get 20% off your next purchase at Bluecorn Bakers.',
      time: '1 day ago',
      read: true,
    },
    {
      id: '4',
      title: 'Reward Expiring Soon',
      message: 'Your reward at The Green Florist expires in 3 days.',
      time: '2 days ago',
      read: true,
    },
  ]);

  const handleSend = () => {
    if (messageText.trim()) {
      // In a real app, this would send the message
      console.log('Sending message:', messageText);
      setMessageText('');
    }
  };

  const renderNotification = ({item}: {item: Notification}) => (
    <View
      style={[
        styles.notificationItem,
        !item.read && styles.notificationItemUnread,
      ]}>
      <View style={styles.notificationContent}>
        <Text style={styles.notificationTitle}>{item.title}</Text>
        <Text style={styles.notificationMessage}>{item.message}</Text>
        <Text style={styles.notificationTime}>{item.time}</Text>
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.modalContainer, {
          width: SCREEN_WIDTH - MODAL_MARGIN * 2,
          height: SCREEN_HEIGHT - MODAL_MARGIN * 2,
        }]}>
          {/* Close Button */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>×</Text>
          </TouchableOpacity>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Notifications</Text>
          </View>

          {/* Messages List */}
          <FlatList
            data={notifications}
            renderItem={renderNotification}
            keyExtractor={item => item.id}
            style={styles.messagesList}
            contentContainerStyle={styles.messagesContent}
          />

          {/* Input Area */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Type a message..."
              placeholderTextColor={Colors.text.light}
              value={messageText}
              onChangeText={setMessageText}
              multiline
            />
            <TouchableOpacity
              style={styles.sendButton}
              onPress={handleSend}
              disabled={!messageText.trim()}>
              <Text
                style={[
                  styles.sendButtonText,
                  !messageText.trim() && styles.sendButtonTextDisabled,
                ]}>
                Send
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  closeButtonText: {
    fontSize: 24,
    color: Colors.background,
    fontWeight: 'bold',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[200],
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
  },
  notificationItem: {
    padding: 16,
    marginBottom: 12,
    backgroundColor: Colors.neutral[50],
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
  },
  notificationItemUnread: {
    backgroundColor: Colors.background,
    borderColor: Colors.primary,
    borderWidth: 2,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: 8,
    lineHeight: 20,
  },
  notificationTime: {
    fontSize: 12,
    color: Colors.text.light,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral[200],
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    backgroundColor: Colors.neutral[100],
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    color: Colors.text.primary,
    maxHeight: 100,
    marginRight: 12,
  },
  sendButton: {
    backgroundColor: Colors.secondary,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.background,
  },
  sendButtonTextDisabled: {
    color: Colors.text.light,
  },
});

export default NotificationsModal;

