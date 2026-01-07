import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  TextInput,
  RefreshControl,
  Dimensions,
} from 'react-native';
import {Colors} from '../constants/Colors';
import {discoveryApi} from '../services/api';

interface Business {
  id: string;
  name: string;
  category: string;
  description?: string;
  address: {
    line1: string;
    city: string;
    postcode: string;
  };
  distance?: number;
  featured?: boolean;
  reward?: {
    name: string;
    stampsRequired: number;
  };
  rating?: number;
  reviewCount?: number;
}

interface DiscoverPageProps {
  memberId?: string;
  onBusinessPress?: (business: Business) => void;
  onBack?: () => void;
}

const {width: SCREEN_WIDTH} = Dimensions.get('window');

const CATEGORIES = [
  {id: 'all', label: 'All', icon: '🔍'},
  {id: 'cafe', label: 'Cafes', icon: '☕'},
  {id: 'restaurant', label: 'Food', icon: '🍽️'},
  {id: 'beauty-salon', label: 'Beauty', icon: '💅'},
  {id: 'pub', label: 'Pubs', icon: '🍺'},
  {id: 'retail', label: 'Shops', icon: '🛍️'},
  {id: 'gym', label: 'Fitness', icon: '💪'},
];

const DiscoverPage: React.FC<DiscoverPageProps> = ({
  memberId,
  onBusinessPress,
  onBack,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [featuredBusinesses, setFeaturedBusinesses] = useState<Business[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Demo data - would come from API
  const demoBusinesses: Business[] = [
    {
      id: '1',
      name: 'Cafe Maison',
      category: 'cafe',
      description: 'Artisan coffee and homemade pastries',
      address: {line1: '12 High Street', city: 'Middlesbrough', postcode: 'TS1 2AB'},
      distance: 0.3,
      featured: true,
      reward: {name: 'Free Coffee', stampsRequired: 10},
      rating: 4.8,
      reviewCount: 124,
    },
    {
      id: '2',
      name: 'The Stables',
      category: 'restaurant',
      description: 'British cuisine with a modern twist',
      address: {line1: '45 Baker Street', city: 'Stockton', postcode: 'TS18 1AA'},
      distance: 1.2,
      featured: true,
      reward: {name: 'Free Dessert', stampsRequired: 8},
      rating: 4.6,
      reviewCount: 89,
    },
    {
      id: '3',
      name: 'Glow Beauty',
      category: 'beauty-salon',
      description: 'Luxury treatments and expert stylists',
      address: {line1: '8 Queen Street', city: 'Darlington', postcode: 'DL1 3BC'},
      distance: 0.8,
      reward: {name: 'Free Facial', stampsRequired: 10},
      rating: 4.9,
      reviewCount: 156,
    },
    {
      id: '4',
      name: 'Fit Factory',
      category: 'gym',
      description: '24/7 gym with personal training',
      address: {line1: '100 Linthorpe Road', city: 'Middlesbrough', postcode: 'TS1 4AG'},
      distance: 0.5,
      reward: {name: 'Free Month', stampsRequired: 15},
      rating: 4.4,
      reviewCount: 67,
    },
    {
      id: '5',
      name: 'Toby Carvery Wolviston',
      category: 'restaurant',
      description: 'All-you-can-eat carvery',
      address: {line1: 'Wolviston Road', city: 'Billingham', postcode: 'TS22 5PY'},
      distance: 3.2,
      featured: true,
      reward: {name: 'Free Main', stampsRequired: 10},
      rating: 4.3,
      reviewCount: 203,
    },
    {
      id: '6',
      name: 'The Head of Steam',
      category: 'pub',
      description: 'Craft beer and live music',
      address: {line1: 'Station Road', city: 'Darlington', postcode: 'DL3 7AB'},
      distance: 2.1,
      reward: {name: 'Free Pint', stampsRequired: 8},
      rating: 4.5,
      reviewCount: 112,
    },
    {
      id: '7',
      name: 'Style Cuts',
      category: 'barber',
      description: 'Traditional barbering with modern styles',
      address: {line1: '23 Newport Road', city: 'Middlesbrough', postcode: 'TS1 5JA'},
      distance: 0.4,
      reward: {name: 'Free Haircut', stampsRequired: 10},
      rating: 4.7,
      reviewCount: 78,
    },
    {
      id: '8',
      name: 'Twisted Burger',
      category: 'restaurant',
      description: 'Gourmet burgers and loaded fries',
      address: {line1: '5 Albert Road', city: 'Middlesbrough', postcode: 'TS1 1PE'},
      distance: 0.2,
      reward: {name: 'Free Burger', stampsRequired: 12},
      rating: 4.8,
      reviewCount: 145,
    },
  ];
  
  useEffect(() => {
    loadBusinesses();
  }, [selectedCategory]);
  
  const loadBusinesses = async () => {
    setIsLoading(true);
    try {
      let result;
      if (selectedCategory === 'all') {
        result = await discoveryApi.findNearby();
      } else {
        result = await discoveryApi.getByCategory(selectedCategory);
      }
      
      if (result.success && result.data) {
        setBusinesses(result.data);
        setFeaturedBusinesses(result.data.filter((b: Business) => b.featured));
      } else {
        // Use demo data
        const filtered = selectedCategory === 'all' 
          ? demoBusinesses 
          : demoBusinesses.filter(b => b.category === selectedCategory);
        setBusinesses(filtered);
        setFeaturedBusinesses(filtered.filter(b => b.featured));
      }
    } catch (error) {
      const filtered = selectedCategory === 'all' 
        ? demoBusinesses 
        : demoBusinesses.filter(b => b.category === selectedCategory);
      setBusinesses(filtered);
      setFeaturedBusinesses(filtered.filter(b => b.featured));
    } finally {
      setIsLoading(false);
    }
  };
  
  const onRefresh = async () => {
    setRefreshing(true);
    await loadBusinesses();
    setRefreshing(false);
  };
  
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length > 2) {
      const result = await discoveryApi.search(query);
      if (result.success && result.data) {
        setBusinesses(result.data);
      }
    } else if (query.length === 0) {
      loadBusinesses();
    }
  };
  
  const getCategoryIcon = (category: string) => {
    const cat = CATEGORIES.find(c => c.id === category);
    return cat?.icon || '📍';
  };
  
  const renderFeaturedCard = (business: Business) => (
    <TouchableOpacity
      key={business.id}
      style={styles.featuredCard}
      onPress={() => onBusinessPress?.(business)}
      activeOpacity={0.9}>
      <View style={styles.featuredImagePlaceholder}>
        <Text style={styles.featuredIcon}>{getCategoryIcon(business.category)}</Text>
        {business.featured && (
          <View style={styles.featuredBadge}>
            <Text style={styles.featuredBadgeText}>⭐ FEATURED</Text>
          </View>
        )}
      </View>
      <View style={styles.featuredContent}>
        <Text style={styles.featuredName}>{business.name}</Text>
        <Text style={styles.featuredDescription} numberOfLines={1}>
          {business.description}
        </Text>
        <View style={styles.featuredMeta}>
          <Text style={styles.featuredDistance}>📍 {business.distance} km</Text>
          {business.rating && (
            <Text style={styles.featuredRating}>
              ⭐ {business.rating} ({business.reviewCount})
            </Text>
          )}
        </View>
        {business.reward && (
          <View style={styles.featuredReward}>
            <Text style={styles.featuredRewardText}>
              🎁 {business.reward.name} • {business.reward.stampsRequired} stamps
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
  
  const renderBusinessCard = (business: Business) => (
    <TouchableOpacity
      key={business.id}
      style={styles.businessCard}
      onPress={() => onBusinessPress?.(business)}
      activeOpacity={0.9}>
      <View style={styles.businessIcon}>
        <Text style={styles.businessIconText}>{getCategoryIcon(business.category)}</Text>
      </View>
      <View style={styles.businessInfo}>
        <Text style={styles.businessName}>{business.name}</Text>
        <Text style={styles.businessLocation}>
          {business.address.city} • {business.distance} km
        </Text>
        {business.reward && (
          <Text style={styles.businessReward}>
            🎁 {business.reward.name}
          </Text>
        )}
      </View>
      <View style={styles.businessMeta}>
        {business.rating && (
          <View style={styles.ratingBadge}>
            <Text style={styles.ratingText}>⭐ {business.rating}</Text>
          </View>
        )}
        <Text style={styles.arrowIcon}>→</Text>
      </View>
    </TouchableOpacity>
  );
  
  const filteredBusinesses = businesses.filter(b => 
    b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      
      {/* Header */}
      <View style={styles.header}>
        {onBack && (
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.title}>Discover</Text>
      </View>
      
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search businesses..."
          value={searchQuery}
          onChangeText={handleSearch}
          placeholderTextColor={Colors.text.light}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => handleSearch('')}>
            <Text style={styles.clearButton}>✕</Text>
          </TouchableOpacity>
        )}
      </View>
      
      {/* Category Pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesContainer}
        contentContainerStyle={styles.categoriesContent}>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={[
              styles.categoryPill,
              selectedCategory === cat.id && styles.categoryPillActive,
            ]}
            onPress={() => setSelectedCategory(cat.id)}>
            <Text style={styles.categoryIcon}>{cat.icon}</Text>
            <Text style={[
              styles.categoryLabel,
              selectedCategory === cat.id && styles.categoryLabelActive,
            ]}>
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }>
        
        {/* Featured Section */}
        {featuredBusinesses.length > 0 && !searchQuery && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>✨ Featured This Week</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.featuredScroll}>
              {featuredBusinesses.map(renderFeaturedCard)}
            </ScrollView>
          </View>
        )}
        
        {/* Nearby Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {searchQuery ? `Results for "${searchQuery}"` : '📍 Nearby'}
          </Text>
          {filteredBusinesses.length > 0 ? (
            filteredBusinesses.map(renderBusinessCard)
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>🔍</Text>
              <Text style={styles.emptyText}>
                No businesses found. Try a different search or category.
              </Text>
            </View>
          )}
        </View>
        
        {/* Local Love CTA */}
        <View style={styles.localLoveCTA}>
          <Text style={styles.localLoveEmoji}>🥕</Text>
          <Text style={styles.localLoveTitle}>Support Local</Text>
          <Text style={styles.localLoveText}>
            Every stamp supports a Tees Valley business. 
            Together we're building a stronger local economy!
          </Text>
        </View>
        
        <View style={{height: 100}} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  backButton: {
    marginRight: 12,
  },
  backButtonText: {
    fontSize: 24,
    color: Colors.text.primary,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.neutral[50],
    borderRadius: 12,
    marginHorizontal: 16,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.text.primary,
  },
  clearButton: {
    fontSize: 18,
    color: Colors.text.light,
    padding: 4,
  },
  categoriesContainer: {
    maxHeight: 50,
    marginBottom: 8,
  },
  categoriesContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.neutral[50],
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
  },
  categoryPillActive: {
    backgroundColor: Colors.primary,
  },
  categoryIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  categoryLabel: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  categoryLabelActive: {
    color: Colors.background,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 12,
  },
  featuredScroll: {
    paddingRight: 16,
  },
  featuredCard: {
    width: SCREEN_WIDTH * 0.7,
    backgroundColor: Colors.background,
    borderRadius: 16,
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  featuredImagePlaceholder: {
    height: 120,
    backgroundColor: Colors.secondary + '30',
    justifyContent: 'center',
    alignItems: 'center',
  },
  featuredIcon: {
    fontSize: 48,
  },
  featuredBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FFD700',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  featuredBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#333',
  },
  featuredContent: {
    padding: 12,
  },
  featuredName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text.primary,
  },
  featuredDescription: {
    fontSize: 13,
    color: Colors.text.secondary,
    marginTop: 4,
  },
  featuredMeta: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 12,
  },
  featuredDistance: {
    fontSize: 12,
    color: Colors.text.light,
  },
  featuredRating: {
    fontSize: 12,
    color: Colors.text.light,
  },
  featuredReward: {
    backgroundColor: Colors.secondary + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  featuredRewardText: {
    fontSize: 12,
    color: Colors.secondary,
    fontWeight: '500',
  },
  businessCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.neutral[100],
  },
  businessIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.neutral[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  businessIconText: {
    fontSize: 24,
  },
  businessInfo: {
    flex: 1,
  },
  businessName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  businessLocation: {
    fontSize: 13,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  businessReward: {
    fontSize: 12,
    color: Colors.secondary,
    marginTop: 4,
  },
  businessMeta: {
    alignItems: 'flex-end',
  },
  ratingBadge: {
    backgroundColor: Colors.neutral[50],
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 8,
  },
  ratingText: {
    fontSize: 12,
    color: Colors.text.primary,
    fontWeight: '500',
  },
  arrowIcon: {
    fontSize: 20,
    color: Colors.text.light,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 15,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  localLoveCTA: {
    backgroundColor: Colors.primary + '10',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.primary + '20',
  },
  localLoveEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  localLoveTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 8,
  },
  localLoveText: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default DiscoverPage;




















