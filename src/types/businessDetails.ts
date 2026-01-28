/**
 * Basic business details for customer app (logo, address, website, socials, contact, rewards, campaigns).
 * Fetched when customer data is pulled from Redis for any business the customer has captured IDs for.
 */

export interface BusinessSocials {
  facebook?: string;
  instagram?: string;
  twitter?: string;
  tiktok?: string;
  linkedin?: string;
}

export interface BusinessDetails {
  id: string;
  name: string;
  logo?: string;
  address?: string;
  website?: string;
  socials?: BusinessSocials;
  phone?: string;
  email?: string;
  whatsapp?: string;
  rewards?: Array<{ id: string; name: string; stampsRequired?: number; isActive?: boolean }>;
  campaigns?: Array<{ id: string; name: string; status?: string }>;
}
