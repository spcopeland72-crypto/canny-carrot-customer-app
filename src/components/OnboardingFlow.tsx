import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import {Colors} from '../constants/Colors';
import {memberApi, discoveryApi} from '../services/api';

interface OnboardingFlowProps {
  onComplete: (memberId: string) => void;
  onSkip?: () => void;
}

type Step = 'welcome' | 'signup' | 'preferences' | 'discover' | 'complete';

const OnboardingFlow: React.FC<OnboardingFlowProps> = ({onComplete, onSkip}) => {
  const [currentStep, setCurrentStep] = useState<Step>('welcome');
  const [isLoading, setIsLoading] = useState(false);
  const [memberId, setMemberId] = useState<string>('');
  
  // User Info
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  
  // Preferences
  const [notifications, setNotifications] = useState(true);
  const [marketing, setMarketing] = useState(true);
  const [favoriteCategories, setFavoriteCategories] = useState<string[]>(['cafe']);
  
  // Discovered businesses
  const [nearbyBusinesses, setNearbyBusinesses] = useState<any[]>([]);
  const [selectedBusinesses, setSelectedBusinesses] = useState<string[]>([]);
  
  const categories = [
    {id: 'cafe', label: 'Coffee & Cafes', icon: '☕'},
    {id: 'restaurant', label: 'Restaurants', icon: '🍽️'},
    {id: 'beauty-salon', label: 'Beauty & Wellness', icon: '💅'},
    {id: 'pub', label: 'Pubs & Bars', icon: '🍺'},
    {id: 'retail', label: 'Shopping', icon: '🛍️'},
    {id: 'takeaway', label: 'Takeaway', icon: '🥡'},
    {id: 'gym', label: 'Fitness', icon: '💪'},
    {id: 'barber', label: 'Barbers', icon: '💈'},
  ];
  
  const toggleCategory = (catId: string) => {
    if (favoriteCategories.includes(catId)) {
      setFavoriteCategories(favoriteCategories.filter(c => c !== catId));
    } else {
      setFavoriteCategories([...favoriteCategories, catId]);
    }
  };
  
  const handleSignup = async () => {
    if (!firstName || !email) {
      Alert.alert('Missing Information', 'Please enter your name and email');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const result = await memberApi.register({
        firstName,
        lastName,
        email,
        phone,
        preferences: {
          notifications,
          marketing,
        },
      });
      
      if (result.success && result.data) {
        setMemberId(result.data.id);
        setCurrentStep('preferences');
      } else {
        Alert.alert('Error', result.error || 'Failed to create account');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleLoadBusinesses = async () => {
    setIsLoading(true);
    
    try {
      const result = await discoveryApi.findNearby();
      
      if (result.success && result.data) {
        setNearbyBusinesses(result.data);
        setCurrentStep('discover');
      } else {
        // Continue even if no businesses found
        setCurrentStep('discover');
      }
    } catch (error) {
      setCurrentStep('discover');
    } finally {
      setIsLoading(false);
    }
  };
  
  const toggleBusinessSelection = (businessId: string) => {
    if (selectedBusinesses.includes(businessId)) {
      setSelectedBusinesses(selectedBusinesses.filter(b => b !== businessId));
    } else {
      setSelectedBusinesses([...selectedBusinesses, businessId]);
    }
  };
  
  const renderWelcome = () => (
    <View style={styles.stepContainer}>
      <View style={styles.logoContainer}>
        <Text style={styles.logoEmoji}>🥕</Text>
        <Text style={styles.logoText}>Canny Carrot</Text>
      </View>
      
      <Text style={styles.welcomeTitle}>Get Rewarded for Being Local</Text>
      <Text style={styles.welcomeSubtitle}>
        Collect stamps, earn rewards, and support Tees Valley businesses you love
      </Text>
      
      <View style={styles.featureList}>
        <View style={styles.featureItem}>
          <Text style={styles.featureEmoji}>📱</Text>
          <Text style={styles.featureText}>All your stamp cards in one app</Text>
        </View>
        <View style={styles.featureItem}>
          <Text style={styles.featureEmoji}>🎁</Text>
          <Text style={styles.featureText}>Earn rewards at 100+ local shops</Text>
        </View>
        <View style={styles.featureItem}>
          <Text style={styles.featureEmoji}>📍</Text>
          <Text style={styles.featureText}>Discover new places near you</Text>
        </View>
        <View style={styles.featureItem}>
          <Text style={styles.featureEmoji}>🏆</Text>
          <Text style={styles.featureText}>Compete on leaderboards & win</Text>
        </View>
      </View>
      
      <TouchableOpacity
        style={styles.primaryButton}
        onPress={() => setCurrentStep('signup')}>
        <Text style={styles.primaryButtonText}>Let's Go!</Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={onSkip}>
        <Text style={styles.secondaryButtonText}>I'll browse first</Text>
      </TouchableOpacity>
    </View>
  );
  
  const renderSignup = () => (
    <ScrollView style={styles.stepContainer} showsVerticalScrollIndicator={false}>
      <Text style={styles.stepTitle}>Create Your Account</Text>
      <Text style={styles.stepSubtitle}>Quick and easy - no password needed!</Text>
      
      <View style={styles.inputRow}>
        <View style={[styles.inputGroup, {flex: 1, marginRight: 8}]}>
          <Text style={styles.label}>First Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="John"
            value={firstName}
            onChangeText={setFirstName}
            placeholderTextColor={Colors.text.light}
            autoCapitalize="words"
          />
        </View>
        <View style={[styles.inputGroup, {flex: 1, marginLeft: 8}]}>
          <Text style={styles.label}>Last Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Smith"
            value={lastName}
            onChangeText={setLastName}
            placeholderTextColor={Colors.text.light}
            autoCapitalize="words"
          />
        </View>
      </View>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Email *</Text>
        <TextInput
          style={styles.input}
          placeholder="john@example.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholderTextColor={Colors.text.light}
        />
      </View>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Mobile (for SMS rewards)</Text>
        <TextInput
          style={styles.input}
          placeholder="07123 456789"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          placeholderTextColor={Colors.text.light}
        />
      </View>
      
      <View style={styles.toggleRow}>
        <TouchableOpacity
          style={styles.toggle}
          onPress={() => setNotifications(!notifications)}>
          <View style={[styles.toggleBox, notifications && styles.toggleBoxActive]}>
            {notifications && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={styles.toggleLabel}>Notify me about new rewards</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.toggleRow}>
        <TouchableOpacity
          style={styles.toggle}
          onPress={() => setMarketing(!marketing)}>
          <View style={[styles.toggleBox, marketing && styles.toggleBoxActive]}>
            {marketing && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={styles.toggleLabel}>Send me exclusive offers</Text>
        </TouchableOpacity>
      </View>
      
      <TouchableOpacity
        style={styles.primaryButton}
        onPress={handleSignup}
        disabled={isLoading}>
        {isLoading ? (
          <ActivityIndicator color={Colors.background} />
        ) : (
          <Text style={styles.primaryButtonText}>Create Account</Text>
        )}
      </TouchableOpacity>
      
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => setCurrentStep('welcome')}>
        <Text style={styles.backButtonText}>← Back</Text>
      </TouchableOpacity>
    </ScrollView>
  );
  
  const renderPreferences = () => (
    <ScrollView style={styles.stepContainer} showsVerticalScrollIndicator={false}>
      <Text style={styles.successEmoji}>👋</Text>
      <Text style={styles.stepTitle}>Welcome, {firstName}!</Text>
      <Text style={styles.stepSubtitle}>What kind of places do you love?</Text>
      
      <View style={styles.categoryGrid}>
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={[
              styles.categoryCard,
              favoriteCategories.includes(cat.id) && styles.categoryCardActive,
            ]}
            onPress={() => toggleCategory(cat.id)}>
            <Text style={styles.categoryEmoji}>{cat.icon}</Text>
            <Text style={[
              styles.categoryText,
              favoriteCategories.includes(cat.id) && styles.categoryTextActive,
            ]}>
              {cat.label}
            </Text>
            {favoriteCategories.includes(cat.id) && (
              <View style={styles.categoryCheck}>
                <Text style={styles.categoryCheckText}>✓</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
      
      <TouchableOpacity
        style={styles.primaryButton}
        onPress={handleLoadBusinesses}
        disabled={isLoading}>
        {isLoading ? (
          <ActivityIndicator color={Colors.background} />
        ) : (
          <Text style={styles.primaryButtonText}>Find Places Near Me</Text>
        )}
      </TouchableOpacity>
      
      <TouchableOpacity
        style={styles.skipButton}
        onPress={() => setCurrentStep('complete')}>
        <Text style={styles.skipButtonText}>Skip this step</Text>
      </TouchableOpacity>
    </ScrollView>
  );
  
  const renderDiscover = () => (
    <ScrollView style={styles.stepContainer} showsVerticalScrollIndicator={false}>
      <Text style={styles.stepTitle}>Places Near You</Text>
      <Text style={styles.stepSubtitle}>
        {nearbyBusinesses.length > 0 
          ? 'Tap to follow and get notified about their rewards'
          : 'No businesses found yet - check back soon!'}
      </Text>
      
      {nearbyBusinesses.length > 0 ? (
        <View style={styles.businessList}>
          {nearbyBusinesses.map((business) => (
            <TouchableOpacity
              key={business.id}
              style={[
                styles.businessCard,
                selectedBusinesses.includes(business.id) && styles.businessCardActive,
              ]}
              onPress={() => toggleBusinessSelection(business.id)}>
              <View style={styles.businessLogo}>
                <Text style={styles.businessLogoText}>
                  {business.name.charAt(0)}
                </Text>
              </View>
              <View style={styles.businessInfo}>
                <Text style={styles.businessName}>{business.name}</Text>
                <Text style={styles.businessCategory}>{business.category}</Text>
                {business.distance && (
                  <Text style={styles.businessDistance}>{business.distance} km away</Text>
                )}
              </View>
              <View style={[
                styles.followButton,
                selectedBusinesses.includes(business.id) && styles.followButtonActive,
              ]}>
                <Text style={[
                  styles.followButtonText,
                  selectedBusinesses.includes(business.id) && styles.followButtonTextActive,
                ]}>
                  {selectedBusinesses.includes(business.id) ? '✓ Following' : '+ Follow'}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>🏪</Text>
          <Text style={styles.emptyText}>
            More Tees Valley businesses are joining every week!
          </Text>
        </View>
      )}
      
      <TouchableOpacity
        style={styles.primaryButton}
        onPress={() => setCurrentStep('complete')}>
        <Text style={styles.primaryButtonText}>Continue</Text>
      </TouchableOpacity>
    </ScrollView>
  );
  
  const renderComplete = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.celebrationEmoji}>🎉</Text>
      <Text style={styles.title}>You're Ready!</Text>
      <Text style={styles.subtitle}>
        Start collecting stamps and earning rewards
      </Text>
      
      <View style={styles.howItWorks}>
        <Text style={styles.howItWorksTitle}>How It Works</Text>
        
        <View style={styles.howItWorksStep}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>1</Text>
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepLabel}>Visit a local business</Text>
            <Text style={styles.stepDesc}>Look for the Canny Carrot sticker</Text>
          </View>
        </View>
        
        <View style={styles.howItWorksStep}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>2</Text>
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepLabel}>Show your QR code</Text>
            <Text style={styles.stepDesc}>Open the app and tap "My Card"</Text>
          </View>
        </View>
        
        <View style={styles.howItWorksStep}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>3</Text>
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepLabel}>Collect stamps</Text>
            <Text style={styles.stepDesc}>Staff will scan to add your stamp</Text>
          </View>
        </View>
        
        <View style={styles.howItWorksStep}>
          <View style={[styles.stepNumber, {backgroundColor: Colors.secondary}]}>
            <Text style={styles.stepNumberText}>🎁</Text>
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepLabel}>Redeem rewards</Text>
            <Text style={styles.stepDesc}>Claim free stuff when you hit the target!</Text>
          </View>
        </View>
      </View>
      
      <TouchableOpacity
        style={styles.primaryButton}
        onPress={() => onComplete(memberId)}>
        <Text style={styles.primaryButtonText}>Start Collecting!</Text>
      </TouchableOpacity>
    </View>
  );
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      
      {/* Progress dots */}
      {currentStep !== 'welcome' && (
        <View style={styles.progressDots}>
          {['signup', 'preferences', 'discover', 'complete'].map((step, idx) => (
            <View
              key={step}
              style={[
                styles.dot,
                (currentStep === step || 
                 ['signup', 'preferences', 'discover', 'complete'].indexOf(currentStep) > idx)
                  && styles.dotActive,
              ]}
            />
          ))}
        </View>
      )}
      
      {currentStep === 'welcome' && renderWelcome()}
      {currentStep === 'signup' && renderSignup()}
      {currentStep === 'preferences' && renderPreferences()}
      {currentStep === 'discover' && renderDiscover()}
      {currentStep === 'complete' && renderComplete()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  progressDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.neutral[200],
  },
  dotActive: {
    backgroundColor: Colors.secondary,
    width: 24,
  },
  stepContainer: {
    flex: 1,
    padding: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 32,
  },
  logoEmoji: {
    fontSize: 72,
    marginBottom: 12,
  },
  logoText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  welcomeTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: 12,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  featureList: {
    marginBottom: 32,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  featureEmoji: {
    fontSize: 28,
    marginRight: 16,
    width: 40,
    textAlign: 'center',
  },
  featureText: {
    fontSize: 16,
    color: Colors.text.primary,
    flex: 1,
  },
  successEmoji: {
    fontSize: 60,
    textAlign: 'center',
    marginBottom: 16,
  },
  celebrationEmoji: {
    fontSize: 80,
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.primary,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: 32,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 15,
    color: Colors.text.secondary,
    marginBottom: 24,
  },
  inputRow: {
    flexDirection: 'row',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.neutral[50],
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.text.primary,
  },
  toggleRow: {
    marginBottom: 12,
  },
  toggle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toggleBox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.neutral[300],
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleBoxActive: {
    backgroundColor: Colors.secondary,
    borderColor: Colors.secondary,
  },
  checkmark: {
    color: Colors.background,
    fontWeight: 'bold',
  },
  toggleLabel: {
    fontSize: 15,
    color: Colors.text.primary,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
    marginBottom: 24,
  },
  categoryCard: {
    width: '47%',
    margin: '1.5%',
    backgroundColor: Colors.neutral[50],
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.neutral[100],
    position: 'relative',
  },
  categoryCardActive: {
    borderColor: Colors.secondary,
    backgroundColor: Colors.secondary + '15',
  },
  categoryEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  categoryText: {
    fontSize: 13,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  categoryTextActive: {
    color: Colors.secondary,
    fontWeight: '600',
  },
  categoryCheck: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryCheckText: {
    color: Colors.background,
    fontSize: 12,
    fontWeight: 'bold',
  },
  businessList: {
    marginBottom: 24,
  },
  businessCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.neutral[50],
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: Colors.neutral[100],
  },
  businessCardActive: {
    borderColor: Colors.secondary,
  },
  businessLogo: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  businessLogoText: {
    color: Colors.background,
    fontSize: 20,
    fontWeight: 'bold',
  },
  businessInfo: {
    flex: 1,
  },
  businessName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  businessCategory: {
    fontSize: 13,
    color: Colors.text.secondary,
  },
  businessDistance: {
    fontSize: 12,
    color: Colors.text.light,
  },
  followButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: Colors.neutral[200],
  },
  followButtonActive: {
    backgroundColor: Colors.secondary,
  },
  followButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
  followButtonTextActive: {
    color: Colors.background,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyEmoji: {
    fontSize: 60,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  howItWorks: {
    backgroundColor: Colors.neutral[50],
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
  },
  howItWorksTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 20,
    textAlign: 'center',
  },
  howItWorksStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  stepNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  stepNumberText: {
    color: Colors.background,
    fontSize: 16,
    fontWeight: 'bold',
  },
  stepContent: {
    flex: 1,
    paddingTop: 2,
  },
  stepLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 2,
  },
  stepDesc: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: Colors.background,
    fontSize: 18,
    fontWeight: 'bold',
  },
  secondaryButton: {
    padding: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  secondaryButtonText: {
    color: Colors.text.secondary,
    fontSize: 16,
  },
  backButton: {
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  backButtonText: {
    color: Colors.text.secondary,
    fontSize: 16,
  },
  skipButton: {
    padding: 16,
    alignItems: 'center',
  },
  skipButtonText: {
    color: Colors.text.light,
    fontSize: 14,
  },
});

export default OnboardingFlow;




















