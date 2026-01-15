/**
 * OnboardingFlow - Step-by-step profile completion
 * Shows one question at a time with progress bar
 */

import { useState } from 'react';
import './Onboarding.css';

interface OnboardingFlowProps {
  initialData: {
    name: string;
    email: string;
    avatar_url?: string | null;
    headline?: string | null;
  };
  onComplete: (data: {
    phone: string;
    location: string;
    headline: string;
    about: string;
  }) => Promise<void>;
}

const STEPS = [
  {
    id: 'phone',
    title: 'What\'s your phone number?',
    subtitle: 'Include country code for international contacts',
    placeholder: '+1 (555) 123-4567',
    type: 'tel',
  },
  {
    id: 'location',
    title: 'Where are you based?',
    subtitle: 'Help people know your timezone and area',
    placeholder: 'San Francisco, CA',
    type: 'location',
  },
  {
    id: 'headline',
    title: 'What is the name of your startup?',
    subtitle: 'This will appear as your headline',
    placeholder: 'Acme Inc.',
    type: 'text',
  },
  {
    id: 'about',
    title: 'Tell us about your business',
    subtitle: 'What does your startup do?',
    placeholder: 'Describe what your company does, the problem you solve, and your vision...',
    type: 'textarea',
  },
];

// Common locations for suggestions
const LOCATION_SUGGESTIONS = [
  'San Francisco, CA',
  'New York, NY',
  'Los Angeles, CA',
  'Seattle, WA',
  'Austin, TX',
  'Boston, MA',
  'Chicago, IL',
  'Denver, CO',
  'Miami, FL',
  'Atlanta, GA',
  'Portland, OR',
  'San Diego, CA',
  'Washington, DC',
  'Phoenix, AZ',
  'Dallas, TX',
];

// Country codes with flags
const COUNTRY_CODES = [
  { code: '+1', flag: '🇺🇸', name: 'United States' },
  { code: '+1', flag: '🇨🇦', name: 'Canada' },
  { code: '+44', flag: '🇬🇧', name: 'United Kingdom' },
  { code: '+61', flag: '🇦🇺', name: 'Australia' },
  { code: '+49', flag: '🇩🇪', name: 'Germany' },
  { code: '+33', flag: '🇫🇷', name: 'France' },
  { code: '+81', flag: '🇯🇵', name: 'Japan' },
  { code: '+86', flag: '🇨🇳', name: 'China' },
  { code: '+91', flag: '🇮🇳', name: 'India' },
  { code: '+82', flag: '🇰🇷', name: 'South Korea' },
  { code: '+55', flag: '🇧🇷', name: 'Brazil' },
  { code: '+52', flag: '🇲🇽', name: 'Mexico' },
  { code: '+34', flag: '🇪🇸', name: 'Spain' },
  { code: '+39', flag: '🇮🇹', name: 'Italy' },
  { code: '+31', flag: '🇳🇱', name: 'Netherlands' },
  { code: '+46', flag: '🇸🇪', name: 'Sweden' },
  { code: '+47', flag: '🇳🇴', name: 'Norway' },
  { code: '+45', flag: '🇩🇰', name: 'Denmark' },
  { code: '+41', flag: '🇨🇭', name: 'Switzerland' },
  { code: '+43', flag: '🇦🇹', name: 'Austria' },
  { code: '+48', flag: '🇵🇱', name: 'Poland' },
  { code: '+351', flag: '🇵🇹', name: 'Portugal' },
  { code: '+353', flag: '🇮🇪', name: 'Ireland' },
  { code: '+32', flag: '🇧🇪', name: 'Belgium' },
  { code: '+65', flag: '🇸🇬', name: 'Singapore' },
  { code: '+852', flag: '🇭🇰', name: 'Hong Kong' },
  { code: '+64', flag: '🇳🇿', name: 'New Zealand' },
  { code: '+972', flag: '🇮🇱', name: 'Israel' },
  { code: '+971', flag: '🇦🇪', name: 'UAE' },
  { code: '+966', flag: '🇸🇦', name: 'Saudi Arabia' },
];

export function OnboardingFlow({ initialData, onComplete }: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    phone: '',
    location: '',
    headline: '',
    about: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);

  // Phone input state
  const [selectedCountry, setSelectedCountry] = useState(COUNTRY_CODES[0]);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [phoneDigits, setPhoneDigits] = useState(['', '', '', '', '', '', '', '', '', '']);

  const step = STEPS[currentStep];
  const progress = ((currentStep + 1) / STEPS.length) * 100;
  const isLastStep = currentStep === STEPS.length - 1;

  // Filter location suggestions based on input
  const filteredLocations = LOCATION_SUGGESTIONS.filter(loc =>
    loc.toLowerCase().includes(formData.location.toLowerCase())
  );

  // Build full phone number from country code + digits
  const getFullPhoneNumber = () => {
    const digits = phoneDigits.join('');
    if (digits.length === 0) return '';
    return `${selectedCountry.code} ${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  };

  const handleNext = async () => {
    setError(null);

    // Validate phone number on phone step
    if (step.id === 'phone') {
      const filledDigits = phoneDigits.filter(d => d !== '').length;
      if (filledDigits < 10) {
        setError('Please enter all 10 digits of your phone number');
        return;
      }
    }

    // Validate location
    if (step.id === 'location') {
      if (!formData.location.trim()) {
        setError('Please enter your location');
        return;
      }
    }

    // Validate headline (startup name)
    if (step.id === 'headline') {
      if (!formData.headline.trim()) {
        setError('Please enter your startup name');
        return;
      }
    }

    // Validate about with minimum word count
    if (step.id === 'about') {
      const wordCount = formData.about.trim().split(/\s+/).filter(w => w).length;
      if (wordCount < 10) {
        setError('Please write at least 10 words about yourself');
        return;
      }
    }

    if (isLastStep) {
      setLoading(true);
      try {
        await onComplete({
          ...formData,
          phone: getFullPhoneNumber(),
        });
      } catch (err: unknown) {
        console.error('Onboarding error:', err);
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        if (errorMessage.includes('profiles') || errorMessage.includes('relation')) {
          setError('Database not set up. Please run the SQL schema in Supabase.');
        } else {
          setError(`Failed to save: ${errorMessage}`);
        }
        setLoading(false);
      }
    } else {
      // Save phone to formData when moving to next step
      if (step.id === 'phone') {
        setFormData(prev => ({ ...prev, phone: getFullPhoneNumber() }));
      }
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleDigitChange = (index: number, value: string) => {
    // Only allow single digit
    const digit = value.replace(/\D/g, '').slice(-1);

    const newDigits = [...phoneDigits];
    newDigits[index] = digit;
    setPhoneDigits(newDigits);

    // Auto-focus next input if digit entered
    if (digit && index < 9) {
      const nextInput = document.getElementById(`phone-digit-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleDigitKeyDown = (index: number, e: React.KeyboardEvent) => {
    // Handle backspace to go to previous input
    if (e.key === 'Backspace' && !phoneDigits[index] && index > 0) {
      const prevInput = document.getElementById(`phone-digit-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleDigitPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 10);
    const newDigits = [...phoneDigits];
    for (let i = 0; i < pastedData.length && i < 10; i++) {
      newDigits[i] = pastedData[i];
    }
    setPhoneDigits(newDigits);
  };

  const handleLocationSelect = (location: string) => {
    setFormData(prev => ({ ...prev, location }));
    setShowLocationSuggestions(false);
  };

  const currentValue = formData[step.id as keyof typeof formData];

  // Check if current step is valid for enabling Next button
  const isCurrentStepValid = () => {
    if (step.id === 'phone') {
      return phoneDigits.filter(d => d !== '').length === 10;
    }
    if (step.id === 'location') {
      return formData.location.trim().length > 0;
    }
    if (step.id === 'headline') {
      return formData.headline.trim().length > 0;
    }
    if (step.id === 'about') {
      const wordCount = formData.about.trim().split(/\s+/).filter(w => w).length;
      return wordCount >= 10;
    }
    return true;
  };

  return (
    <div className="onboarding-flow">
      {/* Progress Bar */}
      <div className="onboarding-progress">
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="progress-text">Step {currentStep + 1} of {STEPS.length}</span>
      </div>

      {/* User Info Header */}
      <div className="onboarding-user">
        <div className="user-avatar">
          {initialData.avatar_url ? (
            <img src={initialData.avatar_url} alt={initialData.name} />
          ) : (
            <span>{initialData.name.charAt(0).toUpperCase()}</span>
          )}
        </div>
        <div className="user-info">
          <span className="user-name">{initialData.name}</span>
          {initialData.headline && (
            <span className="user-headline">{initialData.headline}</span>
          )}
        </div>
      </div>

      {/* Question */}
      <div className="onboarding-question">
        <h1 className="question-title">{step.title}</h1>
        <p className="question-subtitle">{step.subtitle}</p>

        {step.type === 'textarea' ? (
          <textarea
            className="onboarding-input textarea"
            value={currentValue}
            onChange={e => setFormData(prev => ({ ...prev, [step.id]: e.target.value }))}
            placeholder={step.placeholder}
            rows={4}
            autoFocus
          />
        ) : step.type === 'tel' ? (
          <div className="phone-input-container">
            {/* Country Code Dropdown */}
            <div className="country-code-wrapper">
              <button
                type="button"
                className="country-code-btn"
                onClick={() => setShowCountryDropdown(!showCountryDropdown)}
              >
                <span className="country-flag">{selectedCountry.flag}</span>
                <span className="country-code">{selectedCountry.code}</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M7 10l5 5 5-5H7z"/>
                </svg>
              </button>
              {showCountryDropdown && (
                <div className="country-dropdown">
                  {COUNTRY_CODES.map((country, idx) => (
                    <button
                      key={`${country.code}-${idx}`}
                      type="button"
                      className="country-option"
                      onClick={() => {
                        setSelectedCountry(country);
                        setShowCountryDropdown(false);
                      }}
                    >
                      <span className="country-flag">{country.flag}</span>
                      <span className="country-name">{country.name}</span>
                      <span className="country-code">{country.code}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Phone Digit Boxes */}
            <div className="phone-digits">
              <div className="digit-group">
                {[0, 1, 2].map(i => (
                  <input
                    key={i}
                    id={`phone-digit-${i}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    className="phone-digit-box"
                    value={phoneDigits[i]}
                    onChange={e => handleDigitChange(i, e.target.value)}
                    onKeyDown={e => handleDigitKeyDown(i, e)}
                    onPaste={i === 0 ? handleDigitPaste : undefined}
                    autoFocus={i === 0}
                  />
                ))}
              </div>
              <span className="digit-separator">-</span>
              <div className="digit-group">
                {[3, 4, 5].map(i => (
                  <input
                    key={i}
                    id={`phone-digit-${i}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    className="phone-digit-box"
                    value={phoneDigits[i]}
                    onChange={e => handleDigitChange(i, e.target.value)}
                    onKeyDown={e => handleDigitKeyDown(i, e)}
                  />
                ))}
              </div>
              <span className="digit-separator">-</span>
              <div className="digit-group">
                {[6, 7, 8, 9].map(i => (
                  <input
                    key={i}
                    id={`phone-digit-${i}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    className="phone-digit-box"
                    value={phoneDigits[i]}
                    onChange={e => handleDigitChange(i, e.target.value)}
                    onKeyDown={e => handleDigitKeyDown(i, e)}
                  />
                ))}
              </div>
            </div>
          </div>
        ) : step.type === 'location' ? (
          <div className="location-input-wrapper">
            <input
              className="onboarding-input"
              type="text"
              value={currentValue}
              onChange={e => {
                setFormData(prev => ({ ...prev, location: e.target.value }));
              }}
              onClick={() => setShowLocationSuggestions(true)}
              onBlur={() => setTimeout(() => setShowLocationSuggestions(false), 150)}
              placeholder={step.placeholder}
              autoFocus
            />
            {showLocationSuggestions && filteredLocations.length > 0 && (
              <div className="location-suggestions">
                {filteredLocations.map(loc => (
                  <button
                    key={loc}
                    type="button"
                    className="location-suggestion-item"
                    onMouseDown={() => handleLocationSelect(loc)}
                  >
                    {loc}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <input
            className="onboarding-input"
            type={step.type}
            value={currentValue}
            onChange={e => setFormData(prev => ({ ...prev, [step.id]: e.target.value }))}
            placeholder={step.placeholder}
            autoFocus
          />
        )}

        {error && <div className="onboarding-error">{error}</div>}
      </div>

      {/* Actions */}
      <div className="onboarding-actions">
        <div className="actions-left">
          {currentStep > 0 && (
            <button className="btn-back" onClick={handleBack}>
              Back
            </button>
          )}
        </div>
        <div className="actions-right">
          <button
            className={`btn-next ${!isCurrentStepValid() ? 'btn-next-disabled' : ''}`}
            onClick={handleNext}
            disabled={loading || !isCurrentStepValid()}
          >
            {loading ? 'Saving...' : isLastStep ? 'Complete' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}
