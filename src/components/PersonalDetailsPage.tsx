import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import {Colors} from '../constants/Colors';
import BottomNavigation from './BottomNavigation';

interface PersonalDetailsPageProps {
  currentScreen: string;
  onNavigate: (screen: string) => void;
  onBack?: () => void;
  onScanPress?: () => void;
}

const PersonalDetailsPage: React.FC<PersonalDetailsPageProps> = ({
  currentScreen,
  onNavigate,
  onBack,
  onScanPress,
}) => {
  const [firstName, setFirstName] = useState('Simon');
  const [lastName, setLastName] = useState('Copeland');
  const [email, setEmail] = useState('Copeland_simon@yahoo.co.uk');
  const [phone, setPhone] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [postcode, setPostcode] = useState('');

  const handleSubmit = () => {
    // Handle form submission
    console.log('Form submitted:', {
      firstName,
      lastName,
      email,
      phone,
      dateOfBirth,
      addressLine1,
      addressLine2,
      city,
      postcode,
    });
    // Could navigate back or show success message
    if (onBack) {
      onBack();
    }
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      onNavigate('Account');
    }
  };

  // Generate random banner color
  const getRandomBannerColor = (): string => {
    const colors = [
      '#FF6B6B', // Red
      '#4ECDC4', // Teal
      '#45B7D1', // Blue
      '#96CEB4', // Green
      '#FFEAA7', // Yellow
      '#DDA0DD', // Plum
      '#98D8C8', // Mint
      '#F7DC6F', // Gold
      '#BB8FCE', // Purple
      '#85C1E2', // Sky Blue
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const headerColor = getRandomBannerColor();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={headerColor} />

      {/* Header Banner */}
      <View style={[styles.headerBanner, {backgroundColor: headerColor}]}>
        {onBack && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            activeOpacity={0.7}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.headerTitle}>Personal details</Text>
        {onBack && <View style={styles.backButtonSpacer} />}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <View style={styles.formContainer}>
          {/* Name Fields */}
          <View style={styles.formSection}>
            <Text style={styles.label}>First Name</Text>
            <TextInput
              style={styles.input}
              value={firstName}
              onChangeText={setFirstName}
              placeholder="Enter first name"
              placeholderTextColor={Colors.text.light}
            />
          </View>

          <View style={styles.formSection}>
            <Text style={styles.label}>Last Name</Text>
            <TextInput
              style={styles.input}
              value={lastName}
              onChangeText={setLastName}
              placeholder="Enter last name"
              placeholderTextColor={Colors.text.light}
            />
          </View>

          {/* Contact Fields */}
          <View style={styles.formSection}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="Enter email address"
              placeholderTextColor={Colors.text.light}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.formSection}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="Enter phone number"
              placeholderTextColor={Colors.text.light}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.formSection}>
            <Text style={styles.label}>Date of Birth</Text>
            <TextInput
              style={styles.input}
              value={dateOfBirth}
              onChangeText={setDateOfBirth}
              placeholder="DD/MM/YYYY"
              placeholderTextColor={Colors.text.light}
            />
          </View>

          {/* Address Fields */}
          <View style={styles.formSection}>
            <Text style={styles.label}>Address Line 1</Text>
            <TextInput
              style={styles.input}
              value={addressLine1}
              onChangeText={setAddressLine1}
              placeholder="Enter address"
              placeholderTextColor={Colors.text.light}
            />
          </View>

          <View style={styles.formSection}>
            <Text style={styles.label}>Address Line 2</Text>
            <TextInput
              style={styles.input}
              value={addressLine2}
              onChangeText={setAddressLine2}
              placeholder="Enter address (optional)"
              placeholderTextColor={Colors.text.light}
            />
          </View>

          <View style={styles.formSection}>
            <Text style={styles.label}>City</Text>
            <TextInput
              style={styles.input}
              value={city}
              onChangeText={setCity}
              placeholder="Enter city"
              placeholderTextColor={Colors.text.light}
            />
          </View>

          <View style={styles.formSection}>
            <Text style={styles.label}>Postcode</Text>
            <TextInput
              style={styles.input}
              value={postcode}
              onChangeText={setPostcode}
              placeholder="Enter postcode"
              placeholderTextColor={Colors.text.light}
              autoCapitalize="characters"
            />
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmit}>
            <Text style={styles.submitButtonText}>Submit</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  formContainer: {
    padding: 20,
  },
  formSection: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.neutral[100],
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.text.primary,
    borderWidth: 1,
    borderColor: Colors.neutral[300],
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

export default PersonalDetailsPage;

