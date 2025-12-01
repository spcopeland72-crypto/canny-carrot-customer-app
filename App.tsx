import React, {useState} from 'react';
import HomeScreen from './src/components/HomeScreen';
import SearchPage from './src/components/SearchPage';
import ScanPage from './src/components/ScanPage';
import WalletPage from './src/components/WalletPage';
import MorePage from './src/components/MorePage';
import AccountPage from './src/components/AccountPage';
import OrdersPage from './src/components/OrdersPage';
import FindShopPage from './src/components/FindShopPage';
import MenuPage from './src/components/MenuPage';
import ContactCustomerCarePage from './src/components/ContactCustomerCarePage';
import WelcomePage from './src/components/WelcomePage';
import FAQsPage from './src/components/FAQsPage';
import AboutPage from './src/components/AboutPage';
import TermsConditionsPage from './src/components/TermsConditionsPage';
import PrivacyPolicyPage from './src/components/PrivacyPolicyPage';
import LearnMorePage from './src/components/LearnMorePage';
import RewardDetailPage from './src/components/RewardDetailPage';
import SeeAllGoodiesPage from './src/components/SeeAllGoodiesPage';
import FeaturedCampaignsPage from './src/components/FeaturedCampaignsPage';
import CompetitionPage from './src/components/CompetitionPage';
import ShopOnlinePage from './src/components/ShopOnlinePage';
import WriteReviewPage from './src/components/WriteReviewPage';
import ReferEarnPage from './src/components/ReferEarnPage';
import LunchOnTheGoPage from './src/components/LunchOnTheGoPage';
import SeasonalSpecialsPage from './src/components/SeasonalSpecialsPage';
import ScanModal from './src/components/ScanModal';
import PersonalDetailsPage from './src/components/PersonalDetailsPage';
import CommunicationPreferencesPage from './src/components/CommunicationPreferencesPage';
import YourOrdersPage from './src/components/YourOrdersPage';
import DeleteAccountPage from './src/components/DeleteAccountPage';
import ChatPage from './src/components/ChatPage';

function App(): React.JSX.Element {
  const [currentScreen, setCurrentScreen] = useState('Home');
  const [previousScreen, setPreviousScreen] = useState<string | null>(null);
  const [scanModalVisible, setScanModalVisible] = useState(false);

  const handleNavigate = (screen: string) => {
    setPreviousScreen(currentScreen);
    setCurrentScreen(screen);
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

  const renderScreen = () => {
    switch (currentScreen) {
      case 'Home':
        return (
          <HomeScreen
            currentScreen={currentScreen}
            onNavigate={handleNavigate}
            onScanPress={handleScanPress}
          />
        );
      case 'Search':
        return (
          <SearchPage
            currentScreen={currentScreen}
            onNavigate={handleNavigate}
            onBack={handleBack}
          />
        );
      case 'Scan':
        return (
          <ScanPage
            currentScreen={currentScreen}
            onNavigate={handleNavigate}
            onBack={handleBack}
          />
        );
      case 'Wallet':
        return (
          <WalletPage
            currentScreen={currentScreen}
            onNavigate={handleNavigate}
            onBack={handleBack}
          />
        );
      case 'More':
        return (
          <MorePage
            currentScreen={currentScreen}
            onNavigate={handleNavigate}
            onBack={handleBack}
          />
        );
      case 'Account':
        return (
          <AccountPage
            currentScreen={currentScreen}
            onNavigate={handleNavigate}
            onBack={handleBack}
          />
        );
      case 'Orders':
        return (
          <OrdersPage
            currentScreen={currentScreen}
            onNavigate={handleNavigate}
          />
        );
      case 'FindShop':
        return (
          <FindShopPage
            currentScreen={currentScreen}
            onNavigate={handleNavigate}
          />
        );
      case 'Menu':
        return (
          <MenuPage
            currentScreen={currentScreen}
            onNavigate={handleNavigate}
          />
        );
      case 'ContactCustomerCare':
        return (
          <ContactCustomerCarePage
            currentScreen={currentScreen}
            onNavigate={handleNavigate}
          />
        );
      case 'Welcome':
        return (
          <WelcomePage
            currentScreen={currentScreen}
            onNavigate={handleNavigate}
          />
        );
      case 'FAQs':
        return (
          <FAQsPage
            currentScreen={currentScreen}
            onNavigate={handleNavigate}
          />
        );
      case 'About':
        return (
          <AboutPage
            currentScreen={currentScreen}
            onNavigate={handleNavigate}
            onBack={handleBack}
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
      case 'SeeAllGoodies':
        return (
          <SeeAllGoodiesPage
            currentScreen={currentScreen}
            onNavigate={handleNavigate}
            onBack={handleBack}
          />
        );
      case 'FeaturedCampaigns':
        return (
          <FeaturedCampaignsPage
            currentScreen={currentScreen}
            onNavigate={handleNavigate}
            onBack={handleBack}
          />
        );
      case 'Goodie3':
        return (
          <LunchOnTheGoPage
            currentScreen={currentScreen}
            onNavigate={handleNavigate}
            onBack={handleBack}
          />
        );
      case 'Goodie4':
        return (
          <SeasonalSpecialsPage
            currentScreen={currentScreen}
            onNavigate={handleNavigate}
            onBack={handleBack}
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
          />
        );
      case 'Chat':
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
          />
        );
      default:
        return (
          <HomeScreen
            currentScreen={currentScreen}
            onNavigate={handleNavigate}
            onScanPress={handleScanPress}
          />
        );
    }
  };

  return (
    <>
      {renderScreen()}
      <ScanModal
        visible={scanModalVisible}
        onClose={() => setScanModalVisible(false)}
      />
    </>
  );
}

export default App;
