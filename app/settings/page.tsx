"use client";

import { useEffect, useState } from "react";
import { Bell, Mail, Tag, Clock, Save, Loader2 } from "lucide-react";

interface NotificationPreferences {
  email_new_listings: boolean;
  email_price_drops: boolean;
  email_status_changes: boolean;
  price_drop_threshold: number;
  digest_mode: "immediate" | "daily" | "weekly";
}

export default function SettingsPage() {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    email_new_listings: true,
    email_price_drops: true,
    email_status_changes: true,
    price_drop_threshold: 5,
    digest_mode: "immediate",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      const response = await fetch("/api/notification-preferences");
      if (response.ok) {
        const data = await response.json();
        setPreferences(data);
      }
    } catch (error) {
      console.error("Error fetching preferences:", error);
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch("/api/notification-preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(preferences),
      });

      if (response.ok) {
        setMessage({ type: "success", text: "Preferences saved successfully!" });
      } else {
        const error = await response.json();
        setMessage({ type: "error", text: error.error || "Failed to save preferences" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Failed to save preferences" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Notification Settings</h1>

        {message && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.type === "success"
                ? "bg-green-50 text-green-800 border border-green-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="bg-white shadow rounded-lg divide-y divide-gray-200">
          {/* Email Notifications Section */}
          <div className="p-6">
            <div className="flex items-center mb-4">
              <Mail className="w-5 h-5 text-brand mr-3" />
              <h2 className="text-lg font-medium text-gray-900">Email Notifications</h2>
            </div>
            <p className="text-sm text-gray-500 mb-6">
              Choose which types of email alerts you want to receive.
            </p>

            <div className="space-y-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={preferences.email_new_listings}
                  onChange={(e) =>
                    setPreferences({ ...preferences, email_new_listings: e.target.checked })
                  }
                  className="w-4 h-4 text-brand border-gray-300 rounded focus:ring-brand"
                />
                <span className="ml-3 text-gray-700">
                  New listings matching my saved searches
                </span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={preferences.email_price_drops}
                  onChange={(e) =>
                    setPreferences({ ...preferences, email_price_drops: e.target.checked })
                  }
                  className="w-4 h-4 text-brand border-gray-300 rounded focus:ring-brand"
                />
                <span className="ml-3 text-gray-700">
                  Price drops on my favorited properties
                </span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={preferences.email_status_changes}
                  onChange={(e) =>
                    setPreferences({ ...preferences, email_status_changes: e.target.checked })
                  }
                  className="w-4 h-4 text-brand border-gray-300 rounded focus:ring-brand"
                />
                <span className="ml-3 text-gray-700">
                  Status changes on my favorited properties
                </span>
              </label>
            </div>
          </div>

          {/* Price Drop Threshold Section */}
          <div className="p-6">
            <div className="flex items-center mb-4">
              <Tag className="w-5 h-5 text-brand mr-3" />
              <h2 className="text-lg font-medium text-gray-900">Price Drop Threshold</h2>
            </div>
            <p className="text-sm text-gray-500 mb-6">
              Only notify me when the price drops by at least this percentage.
            </p>

            <div className="flex items-center space-x-4">
              <input
                type="range"
                min="1"
                max="50"
                value={preferences.price_drop_threshold}
                onChange={(e) =>
                  setPreferences({
                    ...preferences,
                    price_drop_threshold: parseInt(e.target.value),
                  })
                }
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-brand"
              />
              <span className="text-lg font-medium text-gray-900 w-16 text-right">
                {preferences.price_drop_threshold}%
              </span>
            </div>
          </div>

          {/* Digest Mode Section */}
          <div className="p-6">
            <div className="flex items-center mb-4">
              <Clock className="w-5 h-5 text-brand mr-3" />
              <h2 className="text-lg font-medium text-gray-900">Notification Frequency</h2>
            </div>
            <p className="text-sm text-gray-500 mb-6">
              Choose how often you want to receive email notifications.
            </p>

            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="digest_mode"
                  value="immediate"
                  checked={preferences.digest_mode === "immediate"}
                  onChange={(e) =>
                    setPreferences({
                      ...preferences,
                      digest_mode: e.target.value as "immediate" | "daily" | "weekly",
                    })
                  }
                  className="w-4 h-4 text-brand border-gray-300 focus:ring-brand"
                />
                <span className="ml-3 text-gray-700">
                  <span className="font-medium">Immediate</span> - Send alerts as soon as they happen
                </span>
              </label>

              <label className="flex items-center">
                <input
                  type="radio"
                  name="digest_mode"
                  value="daily"
                  checked={preferences.digest_mode === "daily"}
                  onChange={(e) =>
                    setPreferences({
                      ...preferences,
                      digest_mode: e.target.value as "immediate" | "daily" | "weekly",
                    })
                  }
                  className="w-4 h-4 text-brand border-gray-300 focus:ring-brand"
                />
                <span className="ml-3 text-gray-700">
                  <span className="font-medium">Daily Digest</span> - Send a summary once per day
                </span>
              </label>

              <label className="flex items-center">
                <input
                  type="radio"
                  name="digest_mode"
                  value="weekly"
                  checked={preferences.digest_mode === "weekly"}
                  onChange={(e) =>
                    setPreferences({
                      ...preferences,
                      digest_mode: e.target.value as "immediate" | "daily" | "weekly",
                    })
                  }
                  className="w-4 h-4 text-brand border-gray-300 focus:ring-brand"
                />
                <span className="ml-3 text-gray-700">
                  <span className="font-medium">Weekly Digest</span> - Send a summary once per week
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={savePreferences}
            disabled={saving}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-brand hover:bg-brand/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-5 h-5 mr-2" />
                Save Preferences
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
