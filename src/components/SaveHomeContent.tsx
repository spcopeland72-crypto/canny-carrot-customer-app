/**
 * Save homescreen content – filter bar, get started, section carousels, ad banner, action grid.
 * Used when HomeScreen mode is "Save" and by SustainScreen.
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Colors } from '../constants/Colors';

const SCREEN_WIDTH = Dimensions.get('window').width || 375;
const CARD_WIDTH = 160;
const CARD_MARGIN = 12;

const SaveHomeContent: React.FC = () => {
  const [filter, setFilter] = useState<'all' | 'food' | 'non-food'>('all');
  const [adDismissed, setAdDismissed] = useState(false);

  return (
    <View style={styles.wrapper}>
      {/* Filter bar */}
      <View style={styles.filterBar}>
        <TouchableOpacity
          style={[styles.filterPill, filter === 'all' && styles.filterPillActive]}
          onPress={() => setFilter('all')}>
          <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>All</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterPill, filter === 'food' && styles.filterPillActive]}
          onPress={() => setFilter('food')}>
          <Text style={[styles.filterText, filter === 'food' && styles.filterTextActive]}>Food</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterPill, filter === 'non-food' && styles.filterPillActive]}
          onPress={() => setFilter('non-food')}>
          <Text style={[styles.filterText, filter === 'non-food' && styles.filterTextActive]}>Non-food</Text>
        </TouchableOpacity>
      </View>

      {/* Get started */}
      <Text style={styles.sectionTitle}>Get started</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carouselContent}>
        {[
          { bg: '#FEF3C7', text: 'See something you like?' },
          { bg: '#FEF9C3', text: 'Wait... I can give that away?' },
          { bg: '#FFEDD5', text: '3 things that mig...' },
        ].map((card, i) => (
          <View key={i} style={[styles.getStartedCard, { backgroundColor: card.bg }]}>
            <Text style={styles.getStartedText}>{card.text}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Free food */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitleInline}>Free food</Text>
        <TouchableOpacity><Text style={styles.seeAll}>All &gt;</Text></TouchableOpacity>
      </View>
      <Text style={styles.infoBanner}>No results within 3.1mi. Food from volunteers is added between 8-11pm.</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carouselContent}>
        {[
          { title: 'Whole butternuts.', userName: 'Memory', distance: '4.3mi' },
          { title: 'Fresh green limes', userName: 'Memory', distance: '4.3mi' },
        ].map((item, i) => (
          <View key={i} style={styles.listingCard}>
            <View style={styles.cardImage} />
            <View style={styles.cardTagFree}><Text style={styles.cardTagText}>Free</Text></View>
            <Text style={styles.cardDistance}>📍 {item.distance}</Text>
            <View style={styles.cardBody}>
              <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
              <View style={styles.cardUser}>
                <View style={styles.avatar} />
                <Text style={styles.userName}>{item.userName}</Text>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Reduced food */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitleInline}>Reduced food</Text>
        <TouchableOpacity><Text style={styles.seeAll}>All &gt;</Text></TouchableOpacity>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carouselContent}>
        {[
          { title: 'Iceland British Ski...', location: 'Billingham', brand: 'Iceland', distance: '2.0mi', orig: '£1.65', price: '£0.95', discount: '-42%' },
          { title: 'Bernard Matthews...', location: 'Billingham', brand: 'Iceland', distance: '2.0mi', orig: '£1.65', price: '£0.95', discount: '-42%' },
        ].map((item, i) => (
          <View key={i} style={styles.listingCard}>
            <View style={styles.cardImage} />
            <View style={[styles.cardTagFree, styles.cardTagBrand]}><Text style={styles.cardTagText}>{item.brand}</Text></View>
            <Text style={styles.cardDistance}>📍 {item.distance}</Text>
            <View style={styles.cardBody}>
              <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
              <Text style={styles.cardLocation}>{item.location}</Text>
              <Text style={styles.cardPrice}><Text style={styles.strike}>{item.orig}</Text> {item.price} <Text style={styles.discountGreen}>{item.discount}</Text></Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Non-food */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitleInline}>Non-food</Text>
        <TouchableOpacity><Text style={styles.seeAll}>All &gt;</Text></TouchableOpacity>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carouselContent}>
        {[
          { title: 'Metal and glass str...', userName: 'Shari', distance: '2.1mi' },
          { title: 'Glass water bottle', userName: 'Debbie', distance: '1.9mi' },
        ].map((item, i) => (
          <View key={i} style={styles.listingCard}>
            <View style={styles.cardImage} />
            <View style={styles.cardTagFree}><Text style={styles.cardTagText}>Free</Text></View>
            <Text style={styles.cardDistance}>📍 {item.distance}</Text>
            <View style={styles.cardBody}>
              <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
              <View style={styles.cardUser}>
                <View style={styles.avatar} />
                <Text style={styles.userName}>{item.userName}</Text>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Ad banner */}
      {!adDismissed && (
        <View style={styles.adBanner}>
          <TouchableOpacity style={styles.adDismiss} onPress={() => setAdDismissed(true)}>
            <Text style={styles.adDismissText}>✕</Text>
          </TouchableOpacity>
          <View style={styles.adIcon}><Text style={styles.adIconText}>♥</Text></View>
          <View style={styles.adContent}>
            <Text style={styles.adText}>We show ads to fund the mission – you can remove these by becoming a Supporter.</Text>
            <Text style={styles.adCta}>Become a Supporter</Text>
          </View>
        </View>
      )}

      {/* Lucky Dip bags */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitleInline}>Lucky Dip bags</Text>
        <TouchableOpacity><Text style={styles.seeAll}>All &gt;</Text></TouchableOpacity>
      </View>
      <Text style={styles.infoBanner}>No results within 3.1mi. Listings further away:</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carouselContent}>
        <View style={styles.listingCard}>
          <View style={[styles.cardImage, styles.cardImageWide]}><Text style={styles.placeholderText}>items for £2</Text></View>
          <Text style={styles.cardDistance}>📍 3.2mi</Text>
          <View style={styles.cardBody}>
            <Text style={styles.cardTitle}>Iceland Lucky Dip Bag</Text>
            <Text style={styles.cardLocation}>Yarm Road</Text>
            <Text style={styles.cardPrice}><Text style={styles.strike}>£3.00</Text> £2.00 <Text style={styles.discountGreen}>-35%</Text></Text>
          </View>
        </View>
      </ScrollView>

      {/* Going soon */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitleInline}>Going soon</Text>
        <TouchableOpacity><Text style={styles.seeAll}>All &gt;</Text></TouchableOpacity>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carouselContent}>
        {[
          { title: 'Cups', userName: 'Annabel', distance: '2.7mi' },
          { title: 'Lampshade', userName: 'Lee', distance: '1.3mi' },
        ].map((item, i) => (
          <View key={i} style={styles.listingCard}>
            <View style={styles.cardImage} />
            <View style={styles.cardTagFree}><Text style={styles.cardTagText}>Free</Text></View>
            <Text style={styles.cardDistance}>📍 {item.distance}</Text>
            <View style={styles.cardBody}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <View style={styles.cardUser}>
                <View style={styles.avatar} />
                <Text style={styles.userName}>{item.userName}</Text>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Help a neighbour */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitleInline}>Help a neighbour</Text>
        <TouchableOpacity><Text style={styles.seeAll}>All &gt;</Text></TouchableOpacity>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carouselContent}>
        {[
          { title: 'Loft insulation', userName: 'Maeve', distance: '1.5mi' },
          { title: 'Bed', userName: 'Samina', distance: '1.9mi' },
        ].map((item, i) => (
          <View key={i} style={styles.listingCard}>
            <View style={styles.cardImage} />
            <View style={[styles.cardTagFree, styles.cardTagWanted]}><Text style={styles.cardTagText}>Wanted</Text></View>
            <Text style={styles.cardDistance}>📍 {item.distance}</Text>
            <View style={styles.cardBody}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <View style={styles.cardUser}>
                <View style={styles.avatar} />
                <Text style={styles.userName}>{item.userName}</Text>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Just gone */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitleInline}>Just gone</Text>
        <TouchableOpacity><Text style={styles.seeAll}>All &gt;</Text></TouchableOpacity>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carouselContent}>
        {[
          { title: '1x Cucumber', userName: 'Andrea', distance: '1.0mi' },
          { title: '1x Large sliced rolls', userName: 'Andrea', distance: '1.0mi' },
        ].map((item, i) => (
          <View key={i} style={styles.listingCard}>
            <View style={styles.cardImage} />
            <View style={styles.cardTagFree}><Text style={styles.cardTagText}>Free</Text></View>
            <Text style={styles.cardDistance}>📍 {item.distance}</Text>
            <View style={styles.cardBody}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <View style={styles.cardUser}>
                <View style={styles.avatar} />
                <Text style={styles.userName}>{item.userName}</Text>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Refurbished tech */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitleInline}>Refurbished tech</Text>
        <TouchableOpacity><Text style={styles.seeAll}>All &gt;</Text></TouchableOpacity>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carouselContent}>
        {[
          { title: 'Galaxy S22 5G', storage: '128GB', priceFrom: '£155.33' },
          { title: 'Google Pixel 8 Pro', storage: '128GB', priceFrom: '£237.62' },
        ].map((item, i) => (
          <View key={i} style={[styles.listingCard, styles.techCard]}>
            <View style={styles.techImage}><Text style={styles.placeholderText}>📱</Text></View>
            <View style={[styles.cardTagFree, styles.cardTagOnline]}><Text style={styles.cardTagText}>Online</Text></View>
            <View style={styles.cardBody}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardLocation}>{item.storage}</Text>
              <Text style={styles.cardPrice}>Starting from {item.priceFrom}</Text>
              <Text style={styles.partnerLink}>Partner link &gt;</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Action grid */}
      <View style={styles.actionGrid}>
        {[
          { label: 'Free food', bg: '#dcfce7' },
          { label: 'Free non-food', bg: '#ede9fe' },
          { label: 'Reduced food', bg: '#fef9c3' },
          { label: 'For sale', bg: '#ffedd5' },
          { label: 'Borrow', bg: '#fce7f3' },
          { label: 'Wanted', bg: '#e5e5e5' },
        ].map((btn, i) => (
          <TouchableOpacity key={i} style={[styles.actionButton, { backgroundColor: btn.bg }]} activeOpacity={0.8}>
            <Text style={styles.actionButtonText}>{btn.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.bottomPadding} />
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: { paddingBottom: 24 },
  filterBar: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: Colors.background },
  filterPill: { flex: 1, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 999, backgroundColor: Colors.neutral[100], alignItems: 'center' },
  filterPillActive: { backgroundColor: '#6B21A8' },
  filterText: { fontSize: 14, fontWeight: '600', color: Colors.text.secondary },
  filterTextActive: { color: Colors.background },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.text.primary, marginLeft: 16, marginTop: 16, marginBottom: 8 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginTop: 24, marginBottom: 4 },
  sectionTitleInline: { fontSize: 18, fontWeight: 'bold', color: Colors.text.primary },
  seeAll: { fontSize: 14, color: Colors.text.secondary },
  infoBanner: { fontSize: 13, color: Colors.text.secondary, paddingHorizontal: 16, marginBottom: 8 },
  carouselContent: { paddingHorizontal: 16, paddingVertical: 8, gap: 12 },
  getStartedCard: { width: SCREEN_WIDTH * 0.72, maxWidth: 280, minHeight: 100, borderRadius: 12, padding: 16, justifyContent: 'center', marginRight: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 2, elevation: 2 },
  getStartedText: { fontSize: 14, fontWeight: '600', color: Colors.text.primary, textAlign: 'center' },
  listingCard: { width: CARD_WIDTH, marginRight: CARD_MARGIN, borderRadius: 12, backgroundColor: Colors.background, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 2, elevation: 2 },
  cardImage: { width: '100%', aspectRatio: 1, backgroundColor: Colors.neutral[200] },
  cardImageWide: { aspectRatio: 4 / 3 },
  placeholderText: { fontSize: 12, color: Colors.text.secondary, alignSelf: 'center', marginTop: '30%' },
  cardTagFree: { position: 'absolute', top: 8, left: 8, backgroundColor: '#22C55E', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  cardTagBrand: { backgroundColor: '#EF4444' },
  cardTagWanted: { backgroundColor: '#F97316' },
  cardTagOnline: { backgroundColor: '#6B7280' },
  cardTagText: { fontSize: 11, fontWeight: '600', color: '#FFFFFF' },
  cardDistance: { position: 'absolute', top: 8, right: 8, fontSize: 11, color: Colors.text.primary, backgroundColor: 'rgba(255,255,255,0.9)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  cardBody: { padding: 10 },
  cardTitle: { fontSize: 14, fontWeight: '600', color: Colors.text.primary },
  cardLocation: { fontSize: 12, color: Colors.text.secondary, marginTop: 2 },
  cardPrice: { fontSize: 12, marginTop: 4 },
  strike: { textDecorationLine: 'line-through', color: Colors.text.secondary },
  discountGreen: { color: '#22C55E', fontWeight: '600' },
  cardUser: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  avatar: { width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.neutral[300], marginRight: 6 },
  userName: { fontSize: 12, color: Colors.text.secondary },
  partnerLink: { fontSize: 12, color: '#6B21A8', marginTop: 4 },
  techCard: { width: 140 },
  techImage: { width: '100%', aspectRatio: 3 / 4, backgroundColor: Colors.neutral[100], justifyContent: 'center', alignItems: 'center' },
  adBanner: { flexDirection: 'row', marginHorizontal: 16, marginTop: 24, marginBottom: 8, padding: 16, borderRadius: 12, backgroundColor: '#FFEDD5', alignItems: 'flex-start', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 2, elevation: 2 },
  adDismiss: { position: 'absolute', top: 8, right: 8, zIndex: 1, padding: 4 },
  adDismissText: { fontSize: 16, color: Colors.text.secondary },
  adIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#fed7aa', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  adIconText: { fontSize: 18, color: '#ea580c' },
  adContent: { flex: 1, paddingRight: 24 },
  adText: { fontSize: 14, color: Colors.text.primary },
  adCta: { fontSize: 14, fontWeight: '600', color: Colors.text.primary, marginTop: 8, textDecorationLine: 'underline' },
  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, marginTop: 24, gap: 12 },
  actionButton: { width: (SCREEN_WIDTH - 44) / 2, paddingVertical: 16, paddingHorizontal: 16, borderRadius: 12, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 2, elevation: 2 },
  actionButtonText: { fontSize: 14, fontWeight: '600', color: Colors.text.primary },
  bottomPadding: { height: 80 },
});

export default SaveHomeContent;
