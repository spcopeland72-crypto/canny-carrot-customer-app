# Customer API scope (API + customer app)

Customer record work spans **canny-carrot-api** and **canny-carrot-mobile-app**.

See **canny-carrot-api/docs/API_AND_CUSTOMER_APP_SCOPE.md** for full scope.

## Customer app updates

- **Customer ID:** Use **customer UUID** from API. Do not use email or device id as customer identifier.
- **Storage:** `getCustomerId` / `setCustomerId` / `clearCustomerId` in `localStorage` persist customer UUID (`canny_carrot:customer_uuid`).
- **API client:** `customerApi` — `getByEmail`, `getById`, `sync(id, body)`. Calls api.cannycarrot.com (or `EXPO_PUBLIC_API_URL`).
- **Sync / logout:** `performCustomerFullSync` uses stored UUID (or resolves by `profile.email` via by-email), then `PUT /customers/:id/sync` with `{ ...account, rewards }`. One-blob design; no reward/campaign progress updates to business records.
