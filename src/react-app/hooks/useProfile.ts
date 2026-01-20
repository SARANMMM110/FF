import { useState, useEffect } from "react";
import { useAuth } from "@/react-app/contexts/AuthContext";
import { apiFetch } from "@/react-app/utils/api";

export interface UserProfile {
  id: number;
  user_id: string;
  display_name: string | null;
  bio: string | null;
  phone: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postal_code: string | null;
  profile_photo_url: string | null;
  website_url: string | null;
  timezone: string | null;
  date_of_birth: string | null;
  occupation: string | null;
  company: string | null;
  created_at: string;
  updated_at: string;
}

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await apiFetch("api/profile");

      if (response.ok) {
        const profileData = await response.json();
        setProfile(profileData);
        setError(null);
      } else {
        setProfile(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch profile");
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    try {
      const response = await apiFetch("api/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        const updatedProfile = await response.json();
        setProfile(updatedProfile);
        return updatedProfile;
      } else {
        throw new Error("Failed to update profile");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile");
      throw err;
    }
  };

  const uploadPhoto = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append("photo", file);

      const response = await apiFetch("api/profile/photo", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        // Update the profile with new photo URL
        if (profile) {
          const updatedProfile = { ...profile, profile_photo_url: result.url };
          setProfile(updatedProfile);
        }
        return result.url;
      } else {
        throw new Error("Failed to upload photo");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload photo");
      throw err;
    }
  };

  useEffect(() => {
    if (user) {
      fetchProfile();
    } else {
      setProfile(null);
      setLoading(false);
    }
  }, [user]);

  return {
    profile,
    loading,
    error,
    updateProfile,
    uploadPhoto,
    refetch: fetchProfile,
  };
}
