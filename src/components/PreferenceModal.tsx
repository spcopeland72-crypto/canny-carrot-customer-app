import React, {useState} from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  Alert,
} from 'react-native';
import {Colors} from '../constants/Colors';

interface PreferenceModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;
const MODAL_MARGIN = 10;

const PreferenceModal: React.FC<PreferenceModalProps> = ({
  visible,
  onClose,
  title,
}) => {
  const [marketingPreference, setMarketingPreference] = useState<string>('opt-in');
  const [messagingPreference, setMessagingPreference] = useState<string>('opt-in');

  const handleSubmit = async () => {
    try {
      // IMMEDIATELY save preferences to local customer repository
      const { updateCustomerProfile } = await import('../services/customerRecord');
      
      await updateCustomerProfile({
        preferences: {
          notifications: messagingPreference === 'opt-in',
          emailMarketing: marketingPreference === 'opt-in',
          smsMarketing: messagingPreference === 'opt-in',
        },
      });
      
      console.log('✅ [PreferenceModal] Customer preferences saved to local repository');
      
      // Close modal after submission
      onClose();
    } catch (error) {
      console.error('[PreferenceModal] Error saving preferences:', error);
      Alert.alert('Error', 'Failed to save preferences. Please try again.');
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Close Button */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>×</Text>
          </TouchableOpacity>

          {/* Content */}
          <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
            <Text style={styles.title}>{title}</Text>

            {/* Marketing Preferences */}
            <View style={styles.preferenceSection}>
              <Text style={styles.sectionTitle}>Marketing Preferences</Text>
              
              <TouchableOpacity
                style={styles.radioOption}
                onPress={() => setMarketingPreference('opt-in')}>
                <View style={styles.radioButton}>
                  {marketingPreference === 'opt-in' && (
                    <View style={styles.radioButtonInner} />
                  )}
                </View>
                <Text style={styles.radioLabel}>Opt In</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.radioOption}
                onPress={() => setMarketingPreference('opt-out')}>
                <View style={styles.radioButton}>
                  {marketingPreference === 'opt-out' && (
                    <View style={styles.radioButtonInner} />
                  )}
                </View>
                <Text style={styles.radioLabel}>Opt Out</Text>
              </TouchableOpacity>
            </View>

            {/* Messaging Preferences */}
            <View style={styles.preferenceSection}>
              <Text style={styles.sectionTitle}>Messaging Preferences</Text>
              
              <TouchableOpacity
                style={styles.radioOption}
                onPress={() => setMessagingPreference('opt-in')}>
                <View style={styles.radioButton}>
                  {messagingPreference === 'opt-in' && (
                    <View style={styles.radioButtonInner} />
                  )}
                </View>
                <Text style={styles.radioLabel}>Opt In</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.radioOption}
                onPress={() => setMessagingPreference('opt-out')}>
                <View style={styles.radioButton}>
                  {messagingPreference === 'opt-out' && (
                    <View style={styles.radioButtonInner} />
                  )}
                </View>
                <Text style={styles.radioLabel}>Opt Out</Text>
              </TouchableOpacity>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmit}>
              <Text style={styles.submitButtonText}>Submit</Text>
            </TouchableOpacity>
          </ScrollView>
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
    width: SCREEN_WIDTH - MODAL_MARGIN * 2,
    height: SCREEN_HEIGHT - MODAL_MARGIN * 2,
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
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingTop: 50,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 24,
    textAlign: 'center',
  },
  preferenceSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 16,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 8,
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
  },
  radioLabel: {
    fontSize: 16,
    color: Colors.text.primary,
  },
  submitButton: {
    backgroundColor: Colors.secondary,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.background,
  },
});

export default PreferenceModal;


