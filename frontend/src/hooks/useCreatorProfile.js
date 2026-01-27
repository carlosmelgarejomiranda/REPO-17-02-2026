import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getApiUrl } from '../utils/api';

const API_URL = getApiUrl();

/**
 * Hook to fetch creator profile and handle profile update requirements
 * @param {Object} options
 * @param {boolean} options.redirectOnIncomplete - Whether to redirect to onboarding if profile is incomplete (default: true)
 * @returns {Object} { profile, loading, error, refetch }
 */
export const useCreatorProfile = (options = {}) => {
  const { redirectOnIncomplete = true } = options;
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setLoading(false);
        return null;
      }

      const response = await fetch(`${API_URL}/api/ugc/creators/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        
        // Check if profile needs update
        if (redirectOnIncomplete && data.needs_profile_update) {
          navigate('/ugc/creator/onboarding');
          return null;
        }
        
        setProfile(data);
        return data;
      } else if (response.status === 404) {
        // No profile found
        setProfile(null);
        return null;
      } else {
        throw new Error('Failed to fetch profile');
      }
    } catch (err) {
      console.error('Error fetching creator profile:', err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  return {
    profile,
    loading,
    error,
    refetch: fetchProfile,
    needsUpdate: profile?.needs_profile_update || false
  };
};

export default useCreatorProfile;
