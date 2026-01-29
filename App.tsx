import React, {useState, useEffect} from 'react';
import {View, Text, Platform} from 'react-native';

// Suppress React Native Web touch responder warnings and runtime errors (harmless but noisy)
if (Platform.OS === 'web' && typeof console !== 'undefined') {
  const originalWarn = console.warn;
  const originalError = console.error;
  
  console.warn = (...args: any[]) => {
    // Filter out React Native Web touch responder warnings
    if (args[0] && typeof args[0] === 'string' && args[0].includes('recordTouchEnd')) {
      return; // Suppress this specific warning
    }
    originalWarn.apply(console, args);
  };
  
  console.error = (...args: any[]) => {
    // Filter out React Native runtime internal errors
    const errorMsg = args[0]?.toString() || '';
    if (errorMsg.includes('Continuum assignment failed') || 
        errorMsg.includes('[Background] Continuum')) {
      return; // Suppress React Native internal errors
    }
    // Always log [App] prefixed errors (critical app errors)
    if (errorMsg.includes('[App]')) {
      originalError.apply(console, args);
      return;
    }
    originalError.apply(console, args);
  };
}
import HomeScreen from './src/components/HomeScreen';
import {loadRewards, saveRewards, type CustomerReward} from './src/utils/dataStorage';
import {getStoredAuth} from './src/services/authService';
import {getById} from './src/services/customerApi';
import {setCustomerId} from './src/services/localStorage';
import {updateCustomerProfile, hydrateCustomerRecordFromApi, getCustomerRecord, saveCustomerRecord} from './src/services/customerRecord';
import SearchPage from './src/components/SearchPage';
import GeoSearchPage from './src/components/GeoSearch/GeoSearchPage';
import ScanPage from './src/components/ScanPage';
import WalletPage from './src/components/WalletPage';
import MorePage from './src/components/MorePage';
import FindMoreRewardsPage from './src/components/FindMoreRewardsPage';
import AccountPage from './src/components/AccountPage';
import OrdersPage from './src/components/OrdersPage';
import FindShopPage from './src/components/FindShopPage';
import MenuPage from './src/components/MenuPage';
import BusinessPage from './src/components/BusinessPage';
import ContactCustomerCarePage from './src/components/ContactCustomerCarePage';
import WelcomePage from './src/components/WelcomePage';
import FAQsPage from './src/components/FAQsPage';
import AboutPage from './src/components/AboutPage';
import TermsConditionsPage from './src/components/TermsConditionsPage';
import EventLogPage from './src/components/EventLogPage';
import PrivacyPolicyPage from './src/components/PrivacyPolicyPage';
import LearnMorePage from './src/components/LearnMorePage';
import RewardDetailPage from './src/components/RewardDetailPage';
import SeeAllGoodiesPage from './src/components/SeeAllGoodiesPage';
import SeeAllRewardsPage from './src/components/SeeAllRewardsPage';
import FeaturedCampaignsPage from './src/components/FeaturedCampaignsPage';
import CompetitionPage from './src/components/CompetitionPage';
import ShopOnlinePage from './src/components/ShopOnlinePage';
import WriteReviewPage from './src/components/WriteReviewPage';
import ReferEarnPage from './src/components/ReferEarnPage';
import LunchOnTheGoPage from './src/components/LunchOnTheGoPage';
import SeasonalSpecialsPage from './src/components/SeasonalSpecialsPage';
import ScanModal from './src/components/ScanModal';
import LoginPage from './src/components/LoginPage';
import PersonalDetailsPage from './src/components/PersonalDetailsPage';
import CommunicationPreferencesPage from './src/components/CommunicationPreferencesPage';
import YourOrdersPage from './src/components/YourOrdersPage';
import DeleteAccountPage from './src/components/DeleteAccountPage';
import ChatPage from './src/components/ChatPage';
import CarrieChatbot from './src/components/CarrieChatbot';
// Temporarily comment out to debug compilation error
// import CarrieFloatingButton from './src/components/CarrieFloatingButton';

function App(): React.JSX.Element {
  const [currentScreen, setCurrentScreen] = useState('Home');
  const [previousScreen, setPreviousScreen] = useState<string | null>(null);
  const [scanModalVisible, setScanModalVisible] = useState(false);
  const [rewards, setRewards] = useState<CustomerReward[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [viewingBusiness, setViewingBusiness] = useState<{ businessName: string; businessId?: string } | null>(null);
  const [isAuthenticatedState, setIsAuthenticatedState] = useState<boolean | null>(null);
  const [dataRefreshKey, setDataRefreshKey] = useState(0);

  // Auth check on mount — same as business: always show login screen to start
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setIsAuthenticatedState(false);
      } catch (e) {
        console.error('[App] Auth check error:', e);
        setIsAuthenticatedState(false);
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, []);

  // Load rewards on mount and when switching to Home (only when authenticated)
  useEffect(() => {
    if (isAuthenticatedState !== true) return;
    let isMounted = true;
    const loadData = async () => {
      try {
        const loadPromise = loadRewards();
        const timeoutPromise = new Promise<CustomerReward[]>((r) =>
          setTimeout(() => { console.warn('[App] Load rewards timeout'); r([]); }, 3000)
        );
        const loaded = await Promise.race([loadPromise, timeoutPromise]);
        if (isMounted) {
          setRewards(loaded || []);
          setHasError(false);
        }
      } catch (e) {
        console.error('[App] Error loading rewards:', e);
        if (isMounted) { setRewards([]); setHasError(true); }
      }
    };
    loadData();
    return () => { isMounted = false; };
  }, [isAuthenticatedState]);
  
  useEffect(() => {
    if (isAuthenticatedState !== true || currentScreen !== 'Home') return;
    const reload = async () => {
      try {
        const loaded = await loadRewards();
        setRewards(loaded || []);
      } catch (e) {
        console.error('[App] Reload rewards:', e);
      }
    };
    reload();
  }, [isAuthenticatedState, currentScreen]);

  // Handle reward scanned callback
  const handleRewardScanned = async (reward: CustomerReward) => {
    console.log('[App] Reward scanned callback triggered:', reward.name);
    // Reload rewards to get latest state
    const updatedRewards = await loadRewards();
    console.log('[App] Loaded rewards after scan:', updatedRewards.length, 'rewards');
    const foundReward = updatedRewards.find(r => r.id === reward.id);
    if (foundReward) {
      console.log('[App] ✅ Scanned reward found in loaded rewards:', foundReward.name);
      console.log('[App] Reward details:', {
        id: foundReward.id,
        name: foundReward.name,
        createdAt: foundReward.createdAt,
        businessLogo: foundReward.businessLogo ? 'present' : 'missing',
        businessName: foundReward.businessName,
      });
    } else {
      console.warn('[App] ⚠️ Scanned reward NOT found in loaded rewards!');
      console.warn('[App] Available reward IDs:', updatedRewards.map(r => r.id));
    }
    setRewards(updatedRewards);
    setDataRefreshKey((k) => k + 1);
    if (currentScreen === 'Home') {
      setTimeout(() => {
        console.log('[App] Forcing Home screen refresh after reward scan');
      }, 200);
    }
  };

  const handleNavigate = (screen: string) => {
    setPreviousScreen(currentScreen);
    setCurrentScreen(screen);
  };

  const handleViewBusinessPage = (businessName: string, businessId?: string) => {
    setViewingBusiness({ businessName, businessId });
    setPreviousScreen(currentScreen);
    setCurrentScreen('BusinessPage');
  };

  const handleBack = () => {
    if (previousScreen) {
      setCurrentScreen(previousScreen);
      setPreviousScreen(null);
    } else {
      setCurrentScreen('Home');
    }
  };

  const handleScanPress = () => {
    setScanModalVisible(true);
  };

  const handleLoginSuccess = async () => {
    try {
      const auth = await getStoredAuth();
      if (!auth?.customerId) return;
      await setCustomerId(auth.customerId);
      const apiRecord = await getById(auth.customerId);
      if (apiRecord) {
        const name = [apiRecord.firstName, apiRecord.lastName].filter(Boolean).join(' ').trim();
        await updateCustomerProfile({
          id: apiRecord.id,
          name: name || undefined,
          email: apiRecord.email ?? auth.email,
          phone: apiRecord.phone,
        });
        const record = await getCustomerRecord();
        hydrateCustomerRecordFromApi(record, apiRecord);
        await saveCustomerRecord(record, { preserveUpdatedAt: true });

        const rewardsList = Array.isArray(apiRecord.rewards) ? apiRecord.rewards : [];
        const businessIds = [...new Set(
          rewardsList
            .map((r: { businessId?: string }) => r.businessId)
            .filter((id): id is string => !!id && id !== 'default')
        )];
        if (businessIds.length > 0) {
          const { pullBusinessDetailsForCustomer } = await import('./src/services/businessDetailsStorage');
          const { pulled, errors } = await pullBusinessDetailsForCustomer(businessIds);
          if (errors.length > 0) console.warn('[App] Business details pull warnings:', errors);
        }
      }
      const loaded = await loadRewards();
      setRewards(loaded || []);
      setIsAuthenticatedState(true);
    } catch (e) {
      console.error('[App] Login success hydrate error:', e);
      setIsAuthenticatedState(true);
    }
  };

  const handleLogout = () => {
    setIsAuthenticatedState(false);
    setCurrentScreen('Home');
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'Home':
        return (
          <HomeScreen
            currentScreen={currentScreen}
            onNavigate={handleNavigate}
            onScanPress={handleScanPress}
            onViewBusinessPage={handleViewBusinessPage}
            onLogout={handleLogout}
            rewards={rewards}
          />
        );
      case 'Search':
        return (
          <SearchPage
            currentScreen={currentScreen}
            onNavigate={handleNavigate}
            onBack={handleBack}
            onScanPress={handleScanPress}
          />
        );
      case 'GeoSearch':
        return (
          <GeoSearchPage
            currentScreen={currentScreen}
            onNavigate={handleNavigate}
            onBack={handleBack}
            onScanPress={handleScanPress}
          />
        );
      case 'FindMoreRewards':
        return (
          <SearchPage
            currentScreen={currentScreen}
            onNavigate={handleNavigate}
            onBack={handleBack}
            onScanPress={handleScanPress}
          />
        );
      case 'Scan':
        return (
          <ScanPage
            currentScreen={currentScreen}
            onNavigate={handleNavigate}
            onBack={handleBack}
            onScanPress={handleScanPress}
          />
        );
      case 'Wallet':
        return (
          <WalletPage
            currentScreen={currentScreen}
            onNavigate={handleNavigate}
            onBack={handleBack}
            onScanPress={handleScanPress}
          />
        );
      case 'More':
        return (
          <MorePage
            currentScreen={currentScreen}
            onNavigate={handleNavigate}
            onBack={handleBack}
            onScanPress={handleScanPress}
          />
        );
      case 'Account':
        return (
          <AccountPage
            currentScreen={currentScreen}
            onNavigate={handleNavigate}
            onBack={handleBack}
            onScanPress={handleScanPress}
            onSignInSuccess={async () => {
              try {
                const loaded = await loadRewards();
                setRewards(loaded ?? []);
              } catch (e) {
                console.error('[App] Refresh rewards after Account sign-in:', e);
              }
            }}
          />
        );
      case 'Orders':
        return (
          <OrdersPage
            currentScreen={currentScreen}
            onNavigate={handleNavigate}
            onScanPress={handleScanPress}
          />
        );
      case 'FindShop':
        return (
          <FindShopPage
            currentScreen={currentScreen}
            onNavigate={handleNavigate}
            onScanPress={handleScanPress}
          />
        );
      case 'Menu':
        return (
          <MenuPage
            currentScreen={currentScreen}
            onNavigate={handleNavigate}
            onScanPress={handleScanPress}
          />
        );
      case 'BusinessPage':
        return viewingBusiness ? (
          <BusinessPage
            currentScreen={currentScreen}
            onNavigate={handleNavigate}
            onScanPress={handleScanPress}
            onViewBusinessPage={handleViewBusinessPage}
            businessName={viewingBusiness.businessName}
            businessId={viewingBusiness.businessId}
          />
        ) : (
          <HomeScreen
            currentScreen={currentScreen}
            onNavigate={handleNavigate}
            onScanPress={handleScanPress}
            onViewBusinessPage={handleViewBusinessPage}
            onLogout={handleLogout}
            rewards={rewards}
          />
        );
      case 'ContactCustomerCare':
        return (
          <ContactCustomerCarePage
            currentScreen={currentScreen}
            onNavigate={handleNavigate}
            onScanPress={handleScanPress}
          />
        );
      case 'Welcome':
        return (
          <WelcomePage
            currentScreen={currentScreen}
            onNavigate={handleNavigate}
            onScanPress={handleScanPress}
          />
        );
      case 'FAQs':
        return (
          <FAQsPage
            currentScreen={currentScreen}
            onNavigate={handleNavigate}
            onScanPress={handleScanPress}
          />
        );
      case 'About':
        return (
          <AboutPage
            currentScreen={currentScreen}
            onNavigate={handleNavigate}
            onBack={handleBack}
            onScanPress={handleScanPress}
          />
        );
      case 'EventLog':
        return (
          <EventLogPage
            currentScreen={currentScreen}
            onNavigate={handleNavigate}
            onBack={handleBack}
            onScanPress={handleScanPress}
            refreshTrigger={dataRefreshKey}
          />
        );
      case 'TermsConditions':
        return (
          <TermsConditionsPage
            currentScreen={currentScreen}
            onNavigate={handleNavigate}
            onBack={handleBack}
            onScanPress={handleScanPress}
          />
        );
      case 'PrivacyPolicy':
        return (
          <PrivacyPolicyPage
            currentScreen={currentScreen}
            onNavigate={handleNavigate}
            onBack={handleBack}
            onScanPress={handleScanPress}
          />
        );
      case 'LearnMore':
        return (
          <LearnMorePage
            currentScreen={currentScreen}
            onNavigate={handleNavigate}
            onScanPress={handleScanPress}
            onBack={handleBack}
          />
        );
      case 'Reward1':
        return (
          <RewardDetailPage
            currentScreen={currentScreen}
            onNavigate={handleNavigate}
            rewardTitle="Blackwells Butchers"
            rewardId="1"
            onBack={handleBack}
            onScanPress={() => setScanModalVisible(true)}
          />
        );
      case 'Reward2':
        return (
          <RewardDetailPage
            currentScreen={currentScreen}
            onNavigate={handleNavigate}
            rewardTitle="Bluecorn Bakers"
            rewardId="2"
            onBack={handleBack}
            onScanPress={() => setScanModalVisible(true)}
          />
        );
      case 'Reward3':
        return (
          <RewardDetailPage
            currentScreen={currentScreen}
            onNavigate={handleNavigate}
            rewardTitle="The Green Florist"
            rewardId="3"
            onBack={handleBack}
            onScanPress={() => setScanModalVisible(true)}
          />
        );
      case 'Reward4':
        return (
          <RewardDetailPage
            currentScreen={currentScreen}
            onNavigate={handleNavigate}
            rewardTitle="Sweet Treats"
            rewardId="4"
            onBack={handleBack}
            onScanPress={() => setScanModalVisible(true)}
          />
        );
      case 'Reward5':
        return (
          <RewardDetailPage
            currentScreen={currentScreen}
            onNavigate={handleNavigate}
            rewardTitle="Hot Meals"
            rewardId="5"
            onBack={handleBack}
            onScanPress={() => setScanModalVisible(true)}
          />
        );
      case 'Reward6':
        return (
          <RewardDetailPage
            currentScreen={currentScreen}
            onNavigate={handleNavigate}
            rewardTitle="Breakfast"
            rewardId="6"
            onBack={handleBack}
            onScanPress={() => setScanModalVisible(true)}
          />
        );
      case 'SeeAllRewards':
        return (
          <SeeAllRewardsPage
            currentScreen={currentScreen}
            onNavigate={handleNavigate}
            onBack={() => handleNavigate('Home')}
            onViewBusinessPage={handleViewBusinessPage}
          />
        );
      case 'SeeAllGoodies':
        return (
          <SeeAllGoodiesPage
            currentScreen={currentScreen}
            onNavigate={handleNavigate}
            onBack={handleBack}
            onScanPress={handleScanPress}
          />
        );
      case 'FeaturedCampaigns':
        return (
          <FeaturedCampaignsPage
            currentScreen={currentScreen}
            onNavigate={handleNavigate}
            onBack={handleBack}
            onScanPress={handleScanPress}
          />
        );
      case 'Goodie3':
        return (
          <LunchOnTheGoPage
            currentScreen={currentScreen}
            onNavigate={handleNavigate}
            onBack={handleBack}
            onScanPress={handleScanPress}
          />
        );
      case 'Goodie4':
        return (
          <SeasonalSpecialsPage
            currentScreen={currentScreen}
            onNavigate={handleNavigate}
            onBack={handleBack}
            onScanPress={handleScanPress}
          />
        );
      case 'ShopOnline':
        return (
          <ShopOnlinePage
            currentScreen={currentScreen}
            onNavigate={handleNavigate}
            onBack={handleBack}
            onScanPress={handleScanPress}
          />
        );
      case 'ContactUs':
        return (
          <ContactCustomerCarePage
            currentScreen={currentScreen}
            onNavigate={handleNavigate}
            onBack={handleBack}
            onScanPress={handleScanPress}
          />
        );
      case 'Chat':
        return (
          <CarrieChatbot
            currentScreen={currentScreen}
            onNavigate={handleNavigate}
            onBack={handleBack}
            onScanPress={handleScanPress}
          />
        );
      case 'CommunityChat':
        return (
          <ChatPage
            currentScreen={currentScreen}
            onNavigate={handleNavigate}
            onBack={handleBack}
            onScanPress={handleScanPress}
          />
        );
      case 'WriteReview':
        return (
          <WriteReviewPage
            currentScreen={currentScreen}
            onNavigate={handleNavigate}
            onBack={handleBack}
            onScanPress={handleScanPress}
          />
        );
      case 'ReferEarn':
        return (
          <ReferEarnPage
            currentScreen={currentScreen}
            onNavigate={handleNavigate}
            onBack={handleBack}
            onScanPress={handleScanPress}
          />
        );
      case 'Competition':
        return (
          <CompetitionPage
            currentScreen={currentScreen}
            onNavigate={handleNavigate}
            onBack={handleBack}
            onScanPress={handleScanPress}
          />
        );
      case 'Personal details':
        return (
          <PersonalDetailsPage
            currentScreen={currentScreen}
            onNavigate={handleNavigate}
            onBack={handleBack}
            onScanPress={handleScanPress}
          />
        );
      case 'Communication preferences':
        return (
          <CommunicationPreferencesPage
            currentScreen={currentScreen}
            onNavigate={handleNavigate}
            onBack={handleBack}
            onScanPress={handleScanPress}
          />
        );
      case 'Your orders':
        return (
          <YourOrdersPage
            currentScreen={currentScreen}
            onNavigate={handleNavigate}
            onBack={handleBack}
            onScanPress={handleScanPress}
          />
        );
      case 'ManageAccount':
        return (
          <YourOrdersPage
            currentScreen={currentScreen}
            onNavigate={handleNavigate}
            onBack={handleBack}
            onScanPress={handleScanPress}
          />
        );
      case 'Delete your account':
        return (
          <DeleteAccountPage
            currentScreen={currentScreen}
            onNavigate={handleNavigate}
            onBack={handleBack}
            onScanPress={handleScanPress}
          />
        );
      default:
        return (
          <HomeScreen
            currentScreen={currentScreen}
            onNavigate={handleNavigate}
            onScanPress={handleScanPress}
            onViewBusinessPage={handleViewBusinessPage}
            onLogout={handleLogout}
            rewards={rewards}
          />
        );
    }
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff', minHeight: '100vh', padding: 20 }}>
        <Text style={{ fontSize: 18, color: '#000', fontWeight: 'bold', marginBottom: 10 }}>Canny Carrot</Text>
        <Text style={{ fontSize: 16, color: '#666' }}>Loading...</Text>
      </View>
    );
  }

  if (isAuthenticatedState === null || isAuthenticatedState === false) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  if (hasError && rewards.length === 0 && currentScreen === 'Home') {
    console.warn('[App] Showing error fallback - continuing anyway');
  }

  const screenContent = renderScreen();
  if (!screenContent) {
    console.error('[App] renderScreen returned null/undefined, falling back to HomeScreen');
    return (
      <HomeScreen
        currentScreen="Home"
        onNavigate={handleNavigate}
        onScanPress={handleScanPress}
        onViewBusinessPage={handleViewBusinessPage}
        onLogout={handleLogout}
        rewards={rewards}
      />
    );
  }

  return (
    <>
      {screenContent}
      <ScanModal
        visible={scanModalVisible}
        onClose={() => setScanModalVisible(false)}
        onRewardScanned={handleRewardScanned}
      />
      {/* Temporarily comment out to debug compilation error */}
      {/* <CarrieFloatingButton /> */}
    </>
  );
}

export default App;
