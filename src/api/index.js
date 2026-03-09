import { auth } from '../context/firebase';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

/**
 * Gets the current Firebase Auth user's ID token to send with secure API requests.
 */
const getAuthToken = async () => {
  if (auth.currentUser) {
    return await auth.currentUser.getIdToken(true);
  }
  return null;
};

/**
 * Helper function to handle standard fetch requests with JSON parsing and authentication
 */
const fetcher = async (url, options = {}) => {
  const token = await getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${BASE_URL}${url}`, { ...options, headers });
  
  // Try parsing JSON response
  let data;
  try {
      data = await response.json();
  } catch(e) { /* ignored, handle empty responses */ }

  if (!response.ok) {
    const errMsg = (data && data.error) ? data.error : `HTTP Error ${response.status}: ${response.statusText}`;
    console.error('[API Error]', response.status, errMsg, '| URL:', url);
    throw new Error(errMsg);
  }

  return data;
};

// ------------------------------------------------------------------
// USER APIs
// ------------------------------------------------------------------

export const apiGetUserProfile = () => fetcher('/users/me');

export const apiGetUserById = (uid) => fetcher(`/users/${uid}`);

export const apiCreateUserProfile = (userData) => 
  fetcher('/users', { method: 'POST', body: JSON.stringify(userData) });

export const apiUpdateUserProfile = (userData) => 
  fetcher('/users/me', { method: 'PUT', body: JSON.stringify(userData) });

// ------------------------------------------------------------------
// PROPERTY APIs
// ------------------------------------------------------------------

export const apiGetAllProperties = () => fetcher('/properties');

export const apiGetBuilderProperties = () => fetcher('/properties/builder/me');

export const apiGetPropertyById = (id) => fetcher(`/properties/${id}`);

export const apiCreateProperty = (propertyData) => 
  fetcher('/properties', { method: 'POST', body: JSON.stringify(propertyData) });

export const apiUpdateProperty = (id, propertyData) => 
  fetcher(`/properties/${id}`, { method: 'PUT', body: JSON.stringify(propertyData) });

export const apiDeleteProperty = (id) => 
  fetcher(`/properties/${id}`, { method: 'DELETE' });

// ------------------------------------------------------------------
// BADGES APIs
// ------------------------------------------------------------------

export const apiGetBuilderBadges = () => fetcher('/badges/builder/me');

export const apiCreateBadge = (badgeData) => 
    fetcher('/badges', { method: 'POST', body: JSON.stringify(badgeData) });

export const apiUpdateBadge = (id, badgeData) => 
    fetcher(`/badges/${id}`, { method: 'PUT', body: JSON.stringify(badgeData) });

// ------------------------------------------------------------------
// PURCHASES APIs
// ------------------------------------------------------------------

export const apiGetMyPurchases = () => fetcher('/purchases/me');

export const apiCreatePurchase = (purchaseData) => 
    fetcher('/purchases', { method: 'POST', body: JSON.stringify(purchaseData) });


export const apiGetBadgeByProperty = (propertyId) => 
  fetcher(`/badges/property/${propertyId}`);
