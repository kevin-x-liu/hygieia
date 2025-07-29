/**
 * Profile Page Component - Renders the /profile route
 * 
 * This page allows users to set and edit their:
 * - Health Goal (primary fitness objective)
 * - Dietary Preferences (dietary restrictions and preferences)
 */
'use client';

import React, { useState, useEffect } from 'react';
import { UserIcon } from '../components/Icons';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { FiTarget, FiEdit, FiLoader, FiKey, FiCheck, FiAlertTriangle, FiActivity } from 'react-icons/fi';
import { FaAppleAlt } from "react-icons/fa";
import { FiSave } from 'react-icons/fi';

// TypeScript interface to define the shape of user profile
interface UserProfile {
  healthGoal: string;
  dietaryPreferences: string[];
  fitnessLevel: string;
  hasApiKey: boolean;
}

export default function ProfilePage() {
  // State management
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [profile, setProfile] = useState<UserProfile>({
    healthGoal: '',
    dietaryPreferences: [],
    fitnessLevel: '',
    hasApiKey: false
  });

  // Available health goals and dietary options
  const healthGoals = [
    'Lose Weight',
    'Build Muscle',
    'Maintain Weight',
    'Improve Endurance',
    'Increase Strength',
    'Improve Flexibility'
  ];

  const fitnessLevels = [
    'Beginner (New to exercise)',
    'Light Activity (Occasional exercise)',
    'Moderate (Regular light exercise)',
    'Active (Regular moderate exercise)',
    'Very Active (Intense exercise 4-5x/week)',
    'Athlete (Competitive or elite level)'
  ];

  const dietaryOptions = [
    'Vegetarian',
    'Vegan',
    'Gluten-Free',
    'Dairy-Free',
    'Keto',
    'Paleo',
    'Low-Carb',
    'Mediterranean',
    'Pescatarian',
    'Nut-Free'
  ];

  // Handle health goal change
  const handleHealthGoalChange = (goal: string) => {
    setProfile(prev => ({
      ...prev,
      healthGoal: goal
    }));
  };

  // Handle fitness level change
  const handleFitnessLevelChange = (level: string) => {
    setProfile(prev => ({
      ...prev,
      fitnessLevel: level
    }));
  };

  // Handle dietary preference change
  const handleDietaryChange = (option: string) => {
    setProfile(prev => ({
      ...prev,
      dietaryPreferences: prev.dietaryPreferences.includes(option)
        ? prev.dietaryPreferences.filter(item => item !== option)
        : [...prev.dietaryPreferences, option]
    }));
  };

  // Fetch profile data from API
  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/profile');
      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }
      
      const data = await response.json();
      setProfile({
        healthGoal: data.healthGoal || '',
        dietaryPreferences: data.dietaryPreferences || [],
        fitnessLevel: data.fitnessLevel || '',
        hasApiKey: data.hasApiKey || false
      });
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Failed to load profile data');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle saving profile
  const handleSaveProfile = async () => {
    try {
      setIsSaving(true);
      setError(null);
      
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          healthGoal: profile.healthGoal,
          dietaryPreferences: profile.dietaryPreferences,
          fitnessLevel: profile.fitnessLevel,
          apiKey: apiKey
        }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to save profile');
      }
      
      const data = await response.json();
      setProfile({
        healthGoal: data.healthGoal || '',
        dietaryPreferences: data.dietaryPreferences || [],
        fitnessLevel: data.fitnessLevel || '',
        hasApiKey: data.hasApiKey || false
      });
      
      setApiKey(''); // Clear the API key input after saving
      setIsEditing(false);
    } catch (err) {
      console.error('Error saving profile:', err);
      setError('Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  // Load profile data on component mount
  useEffect(() => {
    fetchProfile();
  }, []);

  return (
    <div className="min-h-screen">
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        {/* Page header with icon and title */}
        <header className="mb-8 text-center">
          <div className="inline-block rounded-full bg-green-500 p-4">
            <UserIcon className="h-12 w-12 text-white" />
          </div>
          <h1 className="mt-4 text-5xl font-extrabold text-zinc-900">
            Your Profile
          </h1>
          <p className="mt-2 text-lg text-neutral-600">
            Personalize your AI trainer experience
          </p>
        </header>

        <main className="mx-auto max-w-2xl">
          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <FiLoader className="mr-2 h-6 w-6 animate-spin text-green-600" />
              <span className="text-lg text-green-600">Loading profile...</span>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="text-red-800">{error}</p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={fetchProfile}
                className="mt-2"
              >
                Try Again
              </Button>
            </div>
          )}

          {/* Main Content - only show when not loading */}
          {!isLoading && (
            <>
              {/* Health Goal Card */}
          <Card className="mb-6">
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center">
                <div className="mr-3 rounded-full bg-green-100 p-2">
                  <FiTarget className="h-5 w-5 text-green-700" />
                </div>
                <h2 className="text-xl font-semibold">Health Goal</h2>
              </div>
              {!isEditing && (
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => setIsEditing(true)}
                  className="h-8 w-8 text-green-700"
                >
                  <FiEdit className="h-4 w-4" />
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <div className="space-y-2">
                  {healthGoals.map((goal) => (
                    <label 
                      key={goal} 
                      className="flex items-center space-x-2 rounded-md p-2 hover:bg-green-50"
                    >
                      <input
                        type="radio"
                        name="healthGoal"
                        value={goal}
                        checked={profile.healthGoal === goal}
                        onChange={() => handleHealthGoalChange(goal)}
                        className="h-4 w-4 text-green-700 focus:ring-green-500"
                      />
                      <span className="text-zinc-800">{goal}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="rounded-md bg-green-50 border border-green-200 p-4">
                  {profile.healthGoal ? (
                    <>
                      <p className="font-medium text-green-800">{profile.healthGoal}</p>
                      <p className="mt-1 text-sm text-green-600">Your primary fitness objective</p>
                    </>
                  ) : (
                    <p className="italic text-neutral-500">No health goal selected</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Dietary Preferences Card */}
          <Card className="mb-6">
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center">
                <div className="mr-3 rounded-full bg-green-100 p-2">
                  <FaAppleAlt className="h-5 w-5 text-green-700" />
                </div>
                <h2 className="text-xl font-semibold">Dietary Preferences</h2>
              </div>
              {!isEditing && (
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => setIsEditing(true)}
                  className="h-8 w-8 text-green-700"
                >
                  <FiEdit className="h-4 w-4" />
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <div className="max-h-60 space-y-2 overflow-y-auto">
                  {dietaryOptions.map((option) => (
                    <label 
                      key={option} 
                      className="flex items-center space-x-2 rounded-md p-2 hover:bg-green-50"
                    >
                      <input
                        type="checkbox"
                        checked={profile.dietaryPreferences.includes(option)}
                        onChange={() => handleDietaryChange(option)}
                        className="h-4 w-4 rounded text-green-700 focus:ring-green-500"
                      />
                      <span className="text-zinc-800">{option}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <div>
                  {profile.dietaryPreferences.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {profile.dietaryPreferences.map((pref) => (
                        <span 
                          key={pref}
                          className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800"
                        >
                          {pref}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="italic text-neutral-500">No dietary preferences selected</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Fitness Level Card */}
          <Card className="mb-6">
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center">
                <div className="mr-3 rounded-full bg-blue-100 p-2">
                  <FiActivity className="h-5 w-5 text-blue-700" />
                </div>
                <h2 className="text-xl font-semibold">Fitness Level</h2>
              </div>
              {!isEditing && (
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => setIsEditing(true)}
                  className="h-8 w-8 text-blue-700"
                >
                  <FiEdit className="h-4 w-4" />
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <div className="max-h-60 space-y-2 overflow-y-auto">
                  {fitnessLevels.map((level) => (
                    <label 
                      key={level} 
                      className="flex items-center space-x-2 rounded-md p-2 hover:bg-blue-50"
                    >
                      <input
                        type="radio"
                        name="fitnessLevel"
                        value={level}
                        checked={profile.fitnessLevel === level}
                        onChange={() => handleFitnessLevelChange(level)}
                        className="h-4 w-4 text-blue-700 focus:ring-blue-500"
                      />
                      <span className="text-zinc-800">{level}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="rounded-md bg-blue-50 border border-blue-200 p-4">
                  {profile.fitnessLevel ? (
                    <>
                      <p className="font-medium text-blue-800">{profile.fitnessLevel}</p>
                      <p className="mt-1 text-sm text-blue-600">Your current activity level</p>
                    </>
                  ) : (
                    <p className="italic text-neutral-500">No fitness level selected</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* OpenAI API Key Card */}
          <Card className="mb-6">
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center">
                <div className="mr-3 rounded-full bg-blue-100 p-2">
                  <FiKey className="h-5 w-5 text-blue-700" />
                </div>
                <h2 className="text-xl font-semibold">OpenAI API Key</h2>
              </div>
              {!isEditing && (
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => setIsEditing(true)}
                  className="h-8 w-8 text-blue-700"
                >
                  <FiEdit className="h-4 w-4" />
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-zinc-800 mb-2">
                      Enter your OpenAI API Key
                    </label>
                    <input
                      type="password"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="sk-..."
                      className="w-full px-3 py-2 border border-neutral-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      autoComplete="off"
                      spellCheck={false}
                    />
                    <p className="mt-1 text-xs text-neutral-600">
                      Your API key is encrypted and stored securely. It cannot be viewed once saved.
                    </p>
                  </div>
                  {apiKey && apiKey.startsWith('sk-') && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                      <p className="text-sm text-green-800">
                        <FiCheck className="inline h-4 w-4 mr-1" />
                        Valid OpenAI API key format detected
                      </p>
                    </div>
                  )}
                  {apiKey && !apiKey.startsWith('sk-') && (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                      <p className="text-sm text-yellow-800">
                        <FiAlertTriangle className="inline h-4 w-4 mr-1" />
                        OpenAI API keys should start with &quot;sk-&quot;
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-md bg-blue-50 border border-blue-200 p-4">
                  {profile.hasApiKey ? (
                    <>
                      <div className="flex items-center">
                        <FiCheck className="h-5 w-5 text-green-600 mr-2" />
                        <p className="font-medium text-blue-800">API Key Configured</p>
                      </div>
                      <p className="mt-1 text-sm text-blue-600">Your OpenAI API key is securely stored</p>
                      <p className="mt-2 text-xs text-neutral-500">
                        Key: sk-••••••••••••••••••••••••••••••••••••••••
                      </p>
                    </>
                  ) : (
                    <div className="flex items-center">
                      <FiAlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
                      <div>
                        <p className="font-medium text-yellow-800">No API Key Set</p>
                        <p className="text-sm text-yellow-600">You need an OpenAI API key to use the AI chat feature</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons when in edit mode */}
          {isEditing && (
            <div className="mt-6 flex justify-center space-x-4">
              <Button
                variant="outline"
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </Button>
              <Button
                variant="default"
                onClick={handleSaveProfile}
                disabled={isSaving}
                className="flex items-center space-x-2"
              >
                {isSaving ? (
                  <FiLoader className="h-4 w-4 animate-spin" />
                ) : (
                  <FiSave className="h-4 w-4" />
                )}
                <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
              </Button>
            </div>
          )}

              {/* Disclaimer */}
              <div className="mt-8 rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-center">
                <p className="text-yellow-800">
                  <strong>Disclaimer:</strong> This AI trainer provides general guidance only. 
                  Always consult with healthcare professionals before making significant changes to your diet or exercise routine.
                </p>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
} 