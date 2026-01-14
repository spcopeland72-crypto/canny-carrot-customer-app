# Search Page Full Specification
## Based on GeoSearch_Implementation_Spec.txt

### Overview
The Search Page is a comprehensive business discovery interface that allows customers to find businesses, rewards, and campaigns through text-based search and interactive map search.

---

## 1. Page Structure

### 1.1 Main Layout
- **Header**: "Find Rewards Near You" title
- **Mode Toggle**: Switch between "Text Search" and "Map Search" modes
- **Search Container**: Dynamic content based on selected mode
- **Results Area**: Display search results below search form/map

### 1.2 Navigation Integration
- Uses `PageTemplate` component for consistent header/navigation
- Back button returns to previous screen
- Scan button accessible in header

---

## 2. Text Search Mode

### 2.1 Search Form Fields

#### Business Name Field
- **Type**: Autocomplete input
- **Placeholder**: "Enter business name"
- **Behavior**: 
  - Shows suggestions after 2+ characters typed
  - 300ms debounce on input
  - Displays verified and user-submitted suggestions
  - Captures new entries for admin review
- **API**: `GET /api/v1/suggestions/businessName?query={term}`

#### Sector/Type Field
- **Type**: Autocomplete input
- **Placeholder**: "Enter sector or business type"
- **Behavior**: Same as business name
- **API**: `GET /api/v1/suggestions/sector?query={term}`

#### Location Fields (Hierarchical)
All location fields use autocomplete with suggestions:

1. **Country**
   - Placeholder: "Country"
   - API: `GET /api/v1/suggestions/country?query={term}`

2. **Region/County**
   - Placeholder: "Region/County"
   - API: `GET /api/v1/suggestions/region?query={term}`

3. **City**
   - Placeholder: "City"
   - API: `GET /api/v1/suggestions/city?query={term}`

4. **Street**
   - Placeholder: "Street"
   - API: `GET /api/v1/suggestions/street?query={term}`

5. **Postcode**
   - Placeholder: "Postcode"
   - Type: Regular text input (no autocomplete)
   - Auto-capitalize: enabled

### 2.2 Filters Section

#### Rewards Only Toggle
- **Type**: Switch component
- **Label**: "Rewards Only"
- **Behavior**: When enabled, only returns businesses with active rewards programs

#### Campaigns Only Toggle
- **Type**: Switch component
- **Label**: "Campaigns Only"
- **Behavior**: When enabled, only returns businesses with active campaigns

#### Distance Filter (Future)
- **Type**: Dropdown/Selector
- **Options**: All, 1km, 5km, 10km, 25km
- **Behavior**: Filters results by distance from user location
- **Requires**: User location permission

#### Sort Options (Future)
- **Type**: Dropdown/Selector
- **Options**: Distance, Name (A-Z), Relevance
- **Default**: Distance (if location available), else Relevance

### 2.3 Search Button
- **Type**: Primary button
- **Label**: "Search"
- **Action**: Submits search criteria to API
- **API**: `POST /api/v1/search/text`

### 2.4 Search Request Format
```json
{
  "businessName": "string (optional)",
  "sector": "string (optional)",
  "location": {
    "country": "string (optional)",
    "region": "string (optional)",
    "city": "string (optional)",
    "street": "string (optional)",
    "postcode": "string (optional)"
  },
  "rewardsOnly": "boolean (default: false)",
  "campaignsOnly": "boolean (default: false)",
  "distance": "number (optional, in miles)",
  "sortBy": "string (distance | name | relevance, default: distance)",
  "page": "number (default: 1)",
  "pageSize": "number (default: 20)"
}
```

### 2.5 Results Display

#### Results Header
- Shows total count: "{count} {result/results} found"
- Styled with neutral background

#### Result Cards
Each business result displays:
- **Thumbnail Image** (if available)
- **Business Name** (bold, primary text)
- **Sector/Type** (colored, secondary text)
- **Formatted Address** (full address)
- **Distance** (if location provided, e.g., "2.3 miles away")
- **Rewards Count Badge** (if has rewards)
- **Campaigns Count Badge** (if has campaigns)
- **Click Action**: Navigate to business detail page

#### Empty State
- Message: "No businesses found"
- Subtext: "Try expanding your search area or removing some filters"
- Suggestions for adjusting search

#### Loading State
- Activity indicator centered
- "Loading..." text

#### Error State
- Error message displayed
- Retry button option

---

## 3. Map Search Mode

### 3.1 Map Display
- **Component**: Google Maps (react-native-maps)
- **Height**: 300px (or flexible)
- **Features**:
  - User location marker
  - Business markers (color-coded)
  - Info windows on marker click
  - Pan and zoom controls

### 3.2 Map Marker Colors
- **Blue**: Standard businesses
- **Gold**: Businesses with active rewards
- **Red**: Businesses with active campaigns

### 3.3 Map Search Panel
Overlay panel with:
- Business name autocomplete
- Sector autocomplete
- Rewards filter toggle
- "Search This Area" button

### 3.4 Search This Area Button
- **Action**: Searches businesses within current map viewport bounds
- **API**: `POST /api/v1/search/map`
- **Request Format**:
```json
{
  "bounds": {
    "northeast": { "lat": number, "lng": number },
    "southwest": { "lat": number, "lng": number }
  },
  "businessName": "string (optional)",
  "sector": "string (optional)",
  "rewardsOnly": "boolean (default: false)",
  "campaignsOnly": "boolean (default: false)"
}
```

### 3.5 Results Display (Map Mode)
- Results list below map (same format as Text Search)
- Or sidebar panel (optional)
- Markers update as user pans map (if auto-search enabled)

---

## 4. Autocomplete Functionality

### 4.1 Behavior
- **Trigger**: User types 2+ characters
- **Debounce**: 300ms delay before API call
- **Display**: Dropdown below input field
- **Max Height**: 200px, scrollable
- **Styling**: 
  - White background
  - Border and shadow
  - Each suggestion is clickable

### 4.2 Suggestion Display
Each suggestion shows:
- **Label**: Display text (e.g., "Cafe Maison")
- **Badge**: "Pending Review" if user-submitted
- **Type Indicator**: Verified vs user-submitted

### 4.3 Selection
- Clicking suggestion fills input field
- Closes dropdown
- Blurs input

### 4.4 New Entry Capture
- If user enters value not in suggestions
- On blur, checks if value matches any suggestion
- If no match, submits to user submissions API
- **API**: `POST /api/v1/user-submissions`
- **Request Format**:
```json
{
  "fieldType": "businessName | sector | country | region | city | street | postcode",
  "enteredValue": "string",
  "context": {
    "relatedSector": "string (optional)",
    "relatedLocation": "string (optional)"
  },
  "userId": "string",
  "sessionId": "string"
}
```

---

## 5. User Submissions Workflow

### 5.1 Capture
- When user enters value not in autocomplete suggestions
- Automatically captured on field blur
- Submitted to backend for admin review

### 5.2 User Feedback
- Toast/notification: "Thank you! Your submission will be reviewed."
- No interruption to search flow

### 5.3 Admin Review
- Submissions appear in admin dashboard
- Admin can approve, reject, or edit
- Approved entries appear in autocomplete as "verified"

---

## 6. State Management

### 6.1 Search Context
- Uses `SearchContext` for global state
- Manages:
  - Current search mode (Text/Map)
  - Search criteria
  - Results
  - Loading state
  - Error state

### 6.2 Local State
- Form field values
- Autocomplete dropdown visibility
- Selected filters
- User location

---

## 7. API Integration

### 7.1 Required Endpoints

#### Text Search
- **Endpoint**: `POST /api/v1/search/text`
- **Response**: `{ results: Business[], totalCount: number, page: number, hasMore: boolean }`

#### Map Search
- **Endpoint**: `POST /api/v1/search/map`
- **Response**: `{ results: Business[], totalCount: number }`

#### Autocomplete Suggestions
- **Endpoint**: `GET /api/v1/suggestions/{fieldType}?query={term}`
- **Response**: `{ suggestions: AutocompleteSuggestion[] }`
- **Rate Limit**: 60 requests/minute per user

#### User Submissions
- **Endpoint**: `POST /api/v1/user-submissions`
- **Response**: `{ id: string, status: string, message: string }`

### 7.2 Error Handling
- Network errors: Show retry option
- API errors: Display user-friendly message
- Timeout: Show timeout message with retry

---

## 8. Performance Requirements

### 8.1 Response Times
- **Autocomplete**: < 300ms
- **Text Search**: < 2 seconds
- **Map Search**: < 1 second (viewport update)

### 8.2 Optimizations
- Debounce autocomplete input (300ms)
- Cache autocomplete suggestions (5-minute TTL)
- Cache search results (1-hour TTL)
- Lazy load map component
- Virtual scrolling for large result lists

---

## 9. Accessibility

### 9.1 Keyboard Navigation
- All inputs accessible via Tab
- Enter key submits search
- Escape closes dropdowns

### 9.2 Screen Reader
- ARIA labels on all inputs
- ARIA live regions for results count
- Descriptive labels for all buttons

### 9.3 Color Contrast
- Minimum 4.5:1 for normal text
- Minimum 3:1 for large text
- Don't rely on color alone for information

---

## 10. Mobile Optimizations

### 10.1 Touch Targets
- Minimum 44x44px for all interactive elements
- Adequate spacing between buttons

### 10.2 Input Handling
- Appropriate keyboard types for each field
- Auto-capitalize for postcode
- Auto-correct disabled for search fields

### 10.3 Viewport
- Responsive to screen size
- Scrollable form on small screens
- Map adjusts to available height

---

## 11. Implementation Checklist

### Phase 1: Core Text Search
- [ ] Business name autocomplete input
- [ ] Sector autocomplete input
- [ ] Location fields (country, region, city, street, postcode)
- [ ] Search button
- [ ] Results display
- [ ] Empty/loading/error states

### Phase 2: Filters & Sorting
- [ ] Rewards only toggle
- [ ] Campaigns only toggle
- [ ] Distance filter
- [ ] Sort options
- [ ] Filter persistence

### Phase 3: Autocomplete
- [ ] Autocomplete component
- [ ] Debouncing
- [ ] Suggestion display
- [ ] Selection handling
- [ ] New entry capture

### Phase 4: User Submissions
- [ ] Submission API integration
- [ ] User feedback
- [ ] Error handling

### Phase 5: Map Search
- [ ] Map component integration
- [ ] Marker display
- [ ] Info windows
- [ ] Search this area functionality
- [ ] Auto-search on pan (optional)

### Phase 6: Polish
- [ ] Performance optimization
- [ ] Accessibility features
- [ ] Error handling
- [ ] Loading states
- [ ] Responsive design

---

## 12. Example Use Cases

### Use Case 1: "Cafes in Durham with rewards"
1. User selects "Text Search" mode
2. Enters "Cafe" in Sector field (autocomplete suggests "Cafes")
3. Selects "Cafes" from suggestions
4. Enters "Durham" in City field
5. Toggles "Rewards Only" on
6. Clicks "Search"
7. Results show cafes in Durham with active rewards programs

### Use Case 2: "Norton High Street rewards search"
1. User selects "Map Search" mode
2. Map loads with user location
3. User pans to Norton High Street area
4. Clicks "Search This Area" button
5. Toggles "Rewards Only" on
6. Results show businesses on Norton High Street with rewards
7. Markers appear on map

---

## 13. Data Models

### Business Result
```typescript
interface Business {
  id: string;
  name: string;
  sector: string;
  location: {
    country: string;
    region: string;
    city: string;
    street: string;
    postcode: string;
    coordinates: { lat: number; lng: number };
    formattedAddress: string;
  };
  rewardsPrograms: RewardProgram[];
  campaigns: Campaign[];
  thumbnailUrl?: string;
  distanceFromSearch?: number; // in miles
}
```

### Autocomplete Suggestion
```typescript
interface AutocompleteSuggestion {
  value: string;
  label: string;
  type: 'verified' | 'userSubmitted';
  metadata?: Record<string, any>;
}
```

---

## 14. Notes

- All search operations must verify data exists in Redis (per project rules)
- User submissions are queued for admin review
- Autocomplete suggestions prioritize verified entries
- Search results are cached to reduce API calls
- Map integration requires Google Maps API key configuration

---

**Status**: Ready for Implementation
**Last Updated**: January 2026
**Based On**: GeoSearch_Implementation_Spec.txt


