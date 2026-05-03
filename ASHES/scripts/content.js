'use strict';

// Stripe Helper Script with Start/Stop and Email Button
(function () {
  if (window.stripeHelperInjected) return;
  window.stripeHelperInjected = true;

  // Production logging control
  const DEBUG = false;
  if (!DEBUG) {
    try { console.log = function () {}; } catch (e) {}
  }

  // Prevent multiple instances - cleanup any existing ones
  if (window.stripeHelper) {
    console.log('Stripe Helper already exists, cleaning up...');
    if (window.stripeHelper.cleanup) {
      window.stripeHelper.cleanup();
    }
    // Remove any existing UI elements
    const existingContainer = document.querySelector('[data-stripe-helper-container]');
    if (existingContainer) {
      existingContainer.remove();
    }
    const existingStatsPopup = document.querySelector('#floating-success-count')?.closest('div');
    if (existingStatsPopup) {
      existingStatsPopup.remove();
    }
    // Clear the reference
    window.stripeHelper = null;
  }

  const config = {
    // Function to generate random names
    generateRandomName: () => {
      const firstNames = ['Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Avery', 'Quinn', 'Sage', 'Parker',
        'Sam', 'Jamie', 'Drew', 'Blake', 'Charlie', 'Skylar', 'Robin', 'Ashley', 'Leslie', 'Tracy'];
      const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
        'Anderson', 'Taylor', 'Thomas', 'Moore', 'Jackson', 'Martin', 'Lee', 'Thompson', 'White', 'Harris'];
      const randomFirst = firstNames[Math.floor(Math.random() * firstNames.length)];
      const randomLast = lastNames[Math.floor(Math.random() * lastNames.length)];
      return `${randomFirst} ${randomLast}`;
    },
    urls: [
      'cs_live',
      'buy.stripe.com',
      'api.stripe.com',
      'invoice.stripe.com',
      'checkout.stripe.com',
      'checkout.',
      'billing.',
      'invoice.',
      'payment.',
      'pay.',
      'secure.'
    ],
    fields: {
      billingName: 'input[name="billingName"], input[name="name"], input[autocomplete*="name"]',
      addressLine1: 'input[name="billingAddressLine1"], input[name="addressLine1"], input[autocomplete*="address-line1"]',
      addressLine2: 'input[name="billingAddressLine2"], input[name="addressLine2"], input[autocomplete*="address-line2"]',
      city: 'input[name="billingLocality"], input[name="city"], input[autocomplete*="city"]',
      country: 'select[name="billingCountry"], select[name="country"], select[autocomplete*="country"]',
      state: 'input[name="billingAdministrativeArea"], select[name="state"], select[autocomplete*="state"]',
      postalCode: 'input[name="billingPostalCode"], input[name="postalCode"], input[autocomplete*="postal-code"]',
      cardNumber: 'input[name="cardNumber"], input[name*="card"], input[data-elements-stable-field-name*="cardNumber"], input[aria-label*="card"], input[placeholder*="card"], iframe[name*="card"], [data-fieldtype="number"]',
      cardExpiry: 'input[name="cardExpiry"], input[name*="expir"], input[data-elements-stable-field-name*="cardExpiry"], input[aria-label*="expir"], input[placeholder*="MM"], iframe[name*="expir"], [data-fieldtype="expiry"]',
      cardCvc: 'input[name="cardCvc"], input[name*="cvc"], input[name*="cvv"], input[data-elements-stable-field-name*="cardCvc"], input[aria-label*="CVC"], input[placeholder*="CVC"], iframe[name*="cvc"], [data-fieldtype="cvc"]',
      email: 'input[type="email"], input[name="email"], input[autocomplete*="email"]'
    },
    addresses: {
      macau: {
        get name() { return config.generateRandomName(); }, // Use getter for dynamic name generation
        addressLine1: '123 Main Street',
        addressLine2: 'OK',
        city: 'Macao',
        country: 'MO',
        state: 'Macau',
        postalCode: '999078',
        cardNumber: '0000000000000000',
        cardExpiry: '12/32',
        cardCvc: '000',
        email: 'randommail@gmail.com'
      },
      usa: {
        get name() { return config.generateRandomName(); },
        addressLine1: '1234 Oak Street',
        addressLine2: 'Apt 5B',
        city: 'New York',
        country: 'US',
        state: 'NY',
        postalCode: '10001',
        cardNumber: '0000000000000000',
        cardExpiry: '12/32',
        cardCvc: '000',
        email: 'randommail@gmail.com'
      },
      uk: {
        get name() { return config.generateRandomName(); },
        addressLine1: '42 Baker Street',
        addressLine2: 'Flat 2A',
        city: 'London',
        country: 'GB',
        state: 'England',
        postalCode: 'NW1 6XE',
        cardNumber: '0000000000000000',
        cardExpiry: '12/32',
        cardCvc: '000',
        email: 'randommail@gmail.com'
      },
      canada: {
        get name() { return config.generateRandomName(); },
        addressLine1: '789 Maple Avenue',
        addressLine2: 'Unit 12',
        city: 'Toronto',
        country: 'CA',
        state: 'ON',
        postalCode: 'M5V 3A8',
        cardNumber: '0000000000000000',
        cardExpiry: '12/32',
        cardCvc: '000',
        email: 'randommail@gmail.com'
      },
      australia: {
        get name() { return config.generateRandomName(); },
        addressLine1: '456 Collins Street',
        addressLine2: 'Level 15',
        city: 'Melbourne',
        country: 'AU',
        state: 'VIC',
        postalCode: '3000',
        cardNumber: '0000000000000000',
        cardExpiry: '12/32',
        cardCvc: '000',
        email: 'randommail@gmail.com'
      },
      germany: {
        get name() { return config.generateRandomName(); },
        addressLine1: 'Hauptstraße 123',
        addressLine2: 'Wohnung 4',
        city: 'Berlin',
        country: 'DE',
        state: 'Berlin',
        postalCode: '10115',
        cardNumber: '0000000000000000',
        cardExpiry: '12/32',
        cardCvc: '000',
        email: 'randommail@gmail.com'
      },
      france: {
        get name() { return config.generateRandomName(); },
        addressLine1: '15 Rue de la Paix',
        addressLine2: 'Appartement 3',
        city: 'Paris',
        country: 'FR',
        state: 'Île-de-France',
        postalCode: '75001',
        cardNumber: '0000000000000000',
        cardExpiry: '12/32',
        cardCvc: '000',
        email: 'randommail@gmail.com'
      },
      japan: {
        get name() { return config.generateRandomName(); },
        addressLine1: '1-2-3 Shibuya',
        addressLine2: 'Building A, Room 101',
        city: 'Tokyo',
        country: 'JP',
        state: 'Tokyo',
        postalCode: '150-0002',
        cardNumber: '0000000000000000',
        cardExpiry: '12/32',
        cardCvc: '000',
        email: 'randommail@gmail.com'
      },
      singapore: {
        get name() { return config.generateRandomName(); },
        addressLine1: '123 Orchard Road',
        addressLine2: '#12-34',
        city: 'Singapore',
        country: 'SG',
        state: 'Singapore',
        postalCode: '238863',
        cardNumber: '0000000000000000',
        cardExpiry: '12/32',
        cardCvc: '000',
        email: 'randommail@gmail.com'
      },
      brazil: {
        get name() { return config.generateRandomName(); },
        addressLine1: 'Rua das Flores, 456',
        addressLine2: 'Apto 78',
        city: 'São Paulo',
        country: 'BR',
        state: 'SP',
        postalCode: '01234-567',
        cardNumber: '0000000000000000',
        cardExpiry: '12/32',
        cardCvc: '000',
        email: 'randommail@gmail.com'
      }
    }
  };

  class StripeHelper {
    constructor() {
      this.isVisible = false;
      this.isRunning = false;
      this.binInput = '';
      this.emailInput = '';
      this.retryInterval = null;
      this.currentAddress = 'macau';
      this.statsPopup = null;
      this.settings = {
        hitSoundEnabled: true,
        retryDelay: 2000,
        successMessage: '✅ 𝐇𝐈𝐓 𝐃𝐄𝐓𝐄𝐂𝐓𝐄𝐃',
        declinedMessage: 'Card Declined',
        retryMessage: 'Retry #{count}',
        customNotifications: false
      };
      this.errorRecoveryCount = 0;
      this.maxRecoveryAttempts = 3;
      this.loadSettings();
      this.init();
    }

    async loadStorage() {
      return new Promise((resolve) => {
        chrome.storage.local.get(['bin', 'email', 'hitSoundEnabled'], (result) => {
          this.binInput = result.bin || '';
          this.emailInput = result.email || '';
          this.settings.hitSoundEnabled = result.hitSoundEnabled !== false; // Default to true
          console.log('Content script loaded settings:', { hitSoundEnabled: this.settings.hitSoundEnabled, result });
          resolve();
        });
      });
    }

    async loadSettings() {
      return new Promise((resolve) => {
        chrome.storage.local.get(['settings', 'hitSoundEnabled'], (result) => {
          if (result.settings) {
            this.settings = { ...this.settings, ...result.settings };
          }

          // Ensure hitSoundEnabled is loaded from storage
          if (typeof result.hitSoundEnabled === 'boolean') {
            this.settings.hitSoundEnabled = result.hitSoundEnabled;
          }

          // Mobile-specific default for removePaymentAgentEnabled
          const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                          window.innerWidth <= 768 ||
                          ('ontouchstart' in window);

          if (isMobile && this.settings.removePaymentAgentEnabled === undefined) {
            // Set default to true on mobile if not explicitly set by user
            this.settings.removePaymentAgentEnabled = true;
            console.log('Mobile detected: Setting default removePaymentAgentEnabled to true to prevent tokenization errors');
          }

          console.log('Settings loaded:', {
            settings: this.settings,
            isMobile,
            removePaymentAgentEnabled: this.settings.removePaymentAgentEnabled,
            hitSoundEnabled: this.settings.hitSoundEnabled
          });
          resolve();
        });
      });
    }

    async saveSettings() {
      return new Promise((resolve) => {
        chrome.storage.local.set({ settings: this.settings }, () => {
          resolve();
        });
      });
    }

    toggleStartStop() {
      this.isRunning = !this.isRunning;

      if (this.isRunning) {
        this.fillFields();
        this.unlockFields();
        this.startAutoRetry();
        this.showToast('✓ Started: 😉');
      } else {
        this.stopAutoRetry();
        this.showToast('✓ Stopped: Auto-retry disabled');
      }

      this.updateStartStopButton();
    }

    updateStartStopButton() {
      if (this.startStopButton) {
        this.startStopButton.innerHTML = `${this.isRunning ? '⏹️' : '▶️'} ${this.isRunning ? 'Stop' : 'Start'}`;
      }
    }

    autoFillCC() {
      // Automatically fill CC details when page loads (without starting auto-retry)
      if (this.binInput) {
        console.log('Auto-filling CC details...');
        // Add a small delay to ensure page is fully loaded
        setTimeout(() => {
          this.fillFields();
          this.unlockFields();
          this.showToast('✓ CC details filled automatically');
        }, 2000);
      }
    }

    fillFields() {
      const address = config.addresses[this.currentAddress] || {};
      let filledCount = 0;

      // Generate a new random name for each fill
      const randomName = config.generateRandomName();

      // First, bypass any address restrictions
      this.bypassAddressRestrictions();

      // Then, force unlock all fields
      this.unlockFields();

      // Wait a bit for DOM to update
      setTimeout(() => {
        this.forceFillAddressFields(address, randomName);
      }, 100);

      const iframes = document.querySelectorAll('iframe[name*="card"], iframe[name*="expir"], iframe[name*="cvc"]');
      iframes.forEach(iframe => {
        try {
          const input = iframe.contentDocument.querySelector('input');
          if (input) {
            if (iframe.name.includes('card')) input.value = address.cardNumber || '0';
            if (iframe.name.includes('expir')) input.value = address.cardExpiry || '0';
            if (iframe.name.includes('cvc')) input.value = address.cardCvc || '0';
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));
            filledCount++;
          }
        } catch (e) {
          // Silent fail for cross-origin iframes
        }
      });

      Object.entries(config.fields).forEach(([key, selector]) => {
        const field = document.querySelector(selector);
        if (field) {
          // Use the same random name for name fields, address values for others
          field.value = key === 'billingName' ? randomName : (address[key] || '');
          field.dispatchEvent(new Event('input', { bubbles: true }));
          field.dispatchEvent(new Event('change', { bubbles: true }));
          filledCount++;
        }
      });

      if (this.emailInput) {
        const emailField = document.querySelector(config.fields.email);
        if (emailField) {
          emailField.value = this.emailInput;
          emailField.dispatchEvent(new Event('input', { bubbles: true }));
          emailField.dispatchEvent(new Event('change', { bubbles: true }));
          filledCount++;
        }
      }

    }

    forceFillAddressFields(address, randomName) {
      // Comprehensive address field selectors
      const addressFieldMappings = [
        { key: 'billingName', selectors: [
          'input[name*="name"]', 'input[placeholder*="name"]', 'input[aria-label*="name"]',
          'input[data-testid*="name"]', 'input[id*="name"]'
        ]},
        { key: 'addressLine1', selectors: [
          'input[name*="address1"]', 'input[name*="address_line1"]', 'input[placeholder*="address"]',
          'input[aria-label*="address"]', 'input[data-testid*="address"]', 'input[id*="address"]'
        ]},
        { key: 'addressLine2', selectors: [
          'input[name*="address2"]', 'input[name*="address_line2"]', 'input[placeholder*="apartment"]',
          'input[aria-label*="apartment"]', 'input[data-testid*="apartment"]'
        ]},
        { key: 'city', selectors: [
          'input[name*="city"]', 'input[placeholder*="city"]', 'input[aria-label*="city"]',
          'input[data-testid*="city"]', 'input[id*="city"]'
        ]},
        { key: 'state', selectors: [
          'input[name*="state"]', 'select[name*="state"]', 'input[placeholder*="state"]',
          'input[aria-label*="state"]', 'input[data-testid*="state"]', 'input[id*="state"]'
        ]},
        { key: 'postalCode', selectors: [
          'input[name*="postal"]', 'input[name*="zip"]', 'input[placeholder*="postal"]',
          'input[placeholder*="zip"]', 'input[aria-label*="postal"]', 'input[aria-label*="zip"]',
          'input[data-testid*="postal"]', 'input[data-testid*="zip"]', 'input[id*="postal"]', 'input[id*="zip"]'
        ]},
        { key: 'country', selectors: [
          'select[name*="country"]', 'input[name*="country"]', 'input[placeholder*="country"]',
          'input[aria-label*="country"]', 'input[data-testid*="country"]', 'input[id*="country"]'
        ]}
      ];

      addressFieldMappings.forEach(({ key, selectors }) => {
        const value = key === 'billingName' ? randomName : (address[key] || '');
        if (!value) return;

        selectors.forEach(selector => {
          const elements = document.querySelectorAll(selector);
          elements.forEach(element => {
            // Force unlock the element
            element.removeAttribute('disabled');
            element.removeAttribute('readonly');
            element.disabled = false;
            element.readOnly = false;
            element.style.pointerEvents = 'auto';
            element.style.opacity = '1';

            // Remove any parent container restrictions
            let parent = element.parentElement;
            while (parent && parent !== document.body) {
              parent.classList.remove('disabled', 'locked', 'readonly');
              parent.style.pointerEvents = 'auto';
              parent.style.opacity = '1';
              parent = parent.parentElement;
            }

            // Set the value
            element.value = value;

            // Trigger events
            element.dispatchEvent(new Event('input', { bubbles: true }));
            element.dispatchEvent(new Event('change', { bubbles: true }));
            element.dispatchEvent(new Event('blur', { bubbles: true }));
          });
        });
      });

      // Force click any "Edit" or "Change" buttons for address
      const editButtons = document.querySelectorAll('button[aria-label*="edit"], button[aria-label*="change"], button[class*="edit"], button[class*="change"]');
      editButtons.forEach(button => {
        if (button.textContent.toLowerCase().includes('address') ||
            button.textContent.toLowerCase().includes('billing') ||
            button.textContent.toLowerCase().includes('edit') ||
            button.textContent.toLowerCase().includes('change')) {
          button.click();
        }
      });

      // Remove any "locked" or "disabled" styling
      const lockedElements = document.querySelectorAll('[class*="locked"], [class*="disabled"], [class*="readonly"]');
      lockedElements.forEach(element => {
        element.classList.remove('locked', 'disabled', 'readonly');
        element.style.pointerEvents = 'auto';
        element.style.opacity = '1';
      });

      // Additional comprehensive search for any remaining address fields
      const allInputs = document.querySelectorAll('input, select, textarea');
      allInputs.forEach(input => {
        const name = (input.name || '').toLowerCase();
        const placeholder = (input.placeholder || '').toLowerCase();
        const id = (input.id || '').toLowerCase();
        const className = (input.className || '').toLowerCase();

        // Check if this looks like an address field
        const isAddressField = name.includes('address') || name.includes('billing') ||
                              name.includes('city') || name.includes('state') ||
                              name.includes('postal') || name.includes('zip') ||
                              name.includes('country') || name.includes('name') ||
                              placeholder.includes('address') || placeholder.includes('city') ||
                              placeholder.includes('state') || placeholder.includes('zip') ||
                              placeholder.includes('country') || placeholder.includes('name') ||
                              id.includes('address') || id.includes('billing') ||
                              className.includes('address') || className.includes('billing');

        if (isAddressField && (!input.value || input.disabled || input.readOnly)) {
          // Force unlock
          input.removeAttribute('disabled');
          input.removeAttribute('readonly');
          input.disabled = false;
          input.readOnly = false;
          input.style.pointerEvents = 'auto';
          input.style.opacity = '1';

          // Try to fill with appropriate data based on field type
          if (name.includes('name') || placeholder.includes('name')) {
            input.value = randomName;
          } else if (name.includes('address') || placeholder.includes('address')) {
            input.value = address.addressLine1 || '';
          } else if (name.includes('city') || placeholder.includes('city')) {
            input.value = address.city || '';
          } else if (name.includes('state') || placeholder.includes('state')) {
            input.value = address.state || '';
          } else if (name.includes('postal') || name.includes('zip') || placeholder.includes('zip')) {
            input.value = address.postalCode || '';
          } else if (name.includes('country') || placeholder.includes('country')) {
            input.value = address.country || '';
          }

          // Trigger events
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
        }
      });
    }

    unlockFields() {
      try {
        // Remove disabled and readonly attributes from all form fields
        const fields = document.querySelectorAll('input[disabled], select[disabled], input[readonly], select[readonly], textarea[disabled], textarea[readonly]');
      fields.forEach(field => {
          try {
            // Only unlock if it's not a critical system field
            if (field.name && !field.name.includes('password') && !field.name.includes('confirm')) {
        field.removeAttribute('disabled');
        field.removeAttribute('readonly');
              field.disabled = false;
              field.readOnly = false;
            }
          } catch (e) {
            console.log('Error unlocking field:', e);
          }
        });
      } catch (e) {
        console.log('Error in unlockFields:', e);
      }

      // Force unlock address fields specifically
      const addressSelectors = [
        'input[name*="address"]',
        'input[name*="billing"]',
        'input[name*="city"]',
        'input[name*="state"]',
        'input[name*="postal"]',
        'input[name*="zip"]',
        'input[name*="country"]',
        'select[name*="address"]',
        'select[name*="billing"]',
        'select[name*="city"]',
        'select[name*="state"]',
        'select[name*="postal"]',
        'select[name*="zip"]',
        'select[name*="country"]'
      ];

      addressSelectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => {
          element.removeAttribute('disabled');
          element.removeAttribute('readonly');
          element.disabled = false;
          element.readOnly = false;
          element.style.pointerEvents = 'auto';
          element.style.opacity = '1';
        });
      });

      // Remove any overlay elements that might be blocking interaction
      const overlays = document.querySelectorAll('[style*="pointer-events: none"], [style*="pointer-events:none"]');
      overlays.forEach(overlay => {
        overlay.style.pointerEvents = 'auto';
        overlay.style.display = 'none';
      });

      // Force enable any parent containers that might be disabled
      const containers = document.querySelectorAll('[data-testid*="address"], [class*="address"], [id*="address"]');
      containers.forEach(container => {
        const inputs = container.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
          input.removeAttribute('disabled');
          input.removeAttribute('readonly');
          input.disabled = false;
          input.readOnly = false;
        });
      });

    }

    startAutoRetry() {
      this.retryInterval = setInterval(() => {
        const submitBtn = document.querySelector('.SubmitButton, button[type="submit"], input[type="submit"]');
        if (submitBtn) submitBtn.click();
      }, 2000);
    }

    stopAutoRetry() {
      if (this.retryInterval) {
        clearInterval(this.retryInterval);
        this.retryInterval = null;
      }
    }

    showToast(message) {
      const toast = document.createElement('div');
      Object.assign(toast.style, {
        position: 'fixed',
        top: '70px',
        right: '20px',
        background: 'rgba(10, 10, 15, 0.95)',
        color: '#fff',
        padding: '6px 10px',
        borderRadius: '4px',
        fontSize: '10px',
        zIndex: '1000000',
        boxShadow: '0 0 10px rgba(0, 0, 0, 0.3)',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      });
      toast.textContent = message;
      if (document.body) {
      document.body.appendChild(toast);
        setTimeout(() => {
          if (toast.parentNode) {
            toast.remove();
          }
        }, 1500);
      }
    }

    createStyles() {
      return {
        container: {
          position: 'fixed',
          top: '20px',
          right: this.isVisible ? '0' : '-140px',
          zIndex: '999999',
          backgroundColor: 'rgba(10, 10, 15, 0.95)',
          padding: '10px',
          borderRadius: '10px 0 0 10px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRight: 'none',
          backdropFilter: 'blur(5px)',
          transition: 'right 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          width: '140px'
        },
        button: {
          width: '100%',
          padding: '8px',
          margin: '4px 0',
          background: 'linear-gradient(145deg, #1e1e2d 0%, #2a2a3a 100%)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '6px',
          color: '#fff',
          cursor: 'pointer',
          fontSize: '12px',
          fontWeight: '500',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
          userSelect: 'none',
          outline: 'none',
          position: 'relative',
          overflow: 'hidden'
        },
        toggleBtn: {
          position: 'absolute',
          left: '-20px',
          top: '50%',
          transform: 'translateY(-50%)',
          background: 'linear-gradient(145deg, #1e1e2d 0%, #2a2a3a 100%)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '4px 0 0 4px',
          color: '#fff',
          cursor: 'pointer',
          fontSize: '14px',
          padding: '8px 4px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          userSelect: 'none',
          outline: 'none'
        },
      };
    }

    createButton(text, onClick, icon = '') {
      const button = document.createElement('button');
      Object.assign(button.style, this.createStyles().button);
      button.style.boxShadow = '0 0 5px rgba(255, 255, 255, 0.2), 0 2px 4px rgba(0, 0, 0, 0.2)';
      button.innerHTML = `<span style="display: flex; align-items: center; gap: 6px;">${icon} ${text}</span>`;

      button.addEventListener('mouseover', () => {
        button.style.background = 'linear-gradient(145deg, #2a2a3a 0%, #1e1e2d 100%)';
        button.style.transform = 'translateY(-1px)';
        button.style.boxShadow = '0 0 10px rgba(255, 255, 255, 0.3), 0 4px 8px rgba(0, 0, 0, 0.3)';
      });

      button.addEventListener('mouseout', () => {
        button.style.background = 'linear-gradient(145deg, #1e1e2d 0%, #2a2a3a 100%)';
        button.style.transform = 'translateY(0)';
        button.style.boxShadow = '0 0 5px rgba(255, 255, 255, 0.2), 0 2px 4px rgba(0, 0, 0, 0.2)';
      });

      button.addEventListener('mousedown', () => {
        button.style.transform = 'translateY(1px)';
        button.style.boxShadow = '0 0 3px rgba(255, 255, 255, 0.1), 0 1px 2px rgba(0, 0, 0, 0.2)';
      });

      button.addEventListener('mouseup', () => {
        button.style.transform = 'translateY(-1px)';
        button.style.boxShadow = '0 0 10px rgba(255, 255, 255, 0.3), 0 4px 8px rgba(0, 0, 0, 0.3)';
      });

      button.addEventListener('click', onClick);
      return button;
    }


    createStatsPopup() {
      this.statsPopup = document.createElement('div');

      // Check if there are any Link elements that might interfere with positioning
      const linkElements = document.querySelectorAll('.ButtonAndDividerContainer, .PaymentRequestOrHeader, [class*="LinkButton"], iframe[name*="StripeFrame"]');
      const hasLinkElements = linkElements.length > 0;

      // Position stats popup to avoid Link section
      const position = hasLinkElements ? {
        position: 'fixed',
        bottom: '20px',
        right: '20px', // Move to right side to avoid Link section
        zIndex: '999998',
        backgroundColor: 'rgba(10, 10, 15, 0.95)',
        padding: '12px 16px',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(5px)',
        color: '#fff',
        fontSize: '12px',
        fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', 'Monaco', 'Courier New', monospace",
        fontWeight: '500',
        minWidth: '140px',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
      } : {
        position: 'fixed',
        bottom: '20px',
        left: '20px',
        zIndex: '999998',
        backgroundColor: 'rgba(10, 10, 15, 0.95)',
        padding: '12px 16px',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(5px)',
        color: '#fff',
        fontSize: '12px',
        fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', 'Monaco', 'Courier New', monospace",
        fontWeight: '500',
        minWidth: '140px',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
      };

      Object.assign(this.statsPopup.style, position);

      // Create stats content
      const statsContent = document.createElement('div');
      statsContent.style.display = 'flex';
      statsContent.style.flexDirection = 'column';
      statsContent.style.gap = '6px';

      // Success count
      const successRow = document.createElement('div');
      successRow.style.display = 'flex';
      successRow.style.justifyContent = 'space-between';
      successRow.style.alignItems = 'center';
      successRow.innerHTML = `
        <span style="opacity: 0.8;">✅ Success:</span>
        <span id="floating-success-count" style="font-weight: 600; color: #4caf50;">0</span>
      `;

      // Retries count
      const retriesRow = document.createElement('div');
      retriesRow.style.display = 'flex';
      retriesRow.style.justifyContent = 'space-between';
      retriesRow.style.alignItems = 'center';
      retriesRow.innerHTML = `
        <span style="opacity: 0.8;">🔄 Retries:</span>
        <span id="floating-retries-count" style="font-weight: 600; color: #ff9800;">0</span>
      `;

      statsContent.appendChild(successRow);
      statsContent.appendChild(retriesRow);
      this.statsPopup.appendChild(statsContent);

      // Add hover effects
      this.statsPopup.addEventListener('mouseenter', () => {
        this.statsPopup.style.transform = 'translateY(-2px)';
        this.statsPopup.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.5)';
      });

      this.statsPopup.addEventListener('mouseleave', () => {
        this.statsPopup.style.transform = 'translateY(0)';
        this.statsPopup.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.4)';
      });

      if (document.body) {
        document.body.appendChild(this.statsPopup);
        this.updateStatsPopup();
      }
    }


    updateStatsPopup() {
      if (!this.statsPopup) return;

      // Request stats from background script
      chrome.runtime.sendMessage({ type: 'get_stats' });
    }

    startStatsUpdateInterval() {
      // Update stats every 2 seconds
      this.statsInterval = setInterval(() => {
        this.updateStatsPopup();
      }, 2000);
    }

    startRestrictionBypassInterval() {
      // Bypass address restrictions every 10 seconds (less aggressive)
      this.restrictionInterval = setInterval(() => {
        this.bypassAddressRestrictions();
        // Also hide unnecessary fields continuously
        this.hideUnnecessaryFields();
      }, 10000);

      // Also run hiding more frequently for better coverage
      this.hideInterval = setInterval(() => {
        this.hideUnnecessaryFields();
      }, 2000);

      // Mobile-specific error handling
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                      window.innerWidth <= 768 ||
                      ('ontouchstart' in window);

      if (isMobile) {
        // Monitor for Stripe tokenization errors on mobile
        this.mobileErrorHandler = setInterval(() => {
          this.handleMobileStripeErrors();
          // Also check for "Pay without Link" button periodically
          this.handlePayWithoutLink();
        }, 2000);
      }

      // Universal error monitoring (works on both desktop and mobile)
      this.universalErrorHandler = setInterval(() => {
        this.handleUniversalErrors();
      }, 1000);
    }

    stopRestrictionBypassInterval() {
      if (this.restrictionInterval) {
        clearInterval(this.restrictionInterval);
        this.restrictionInterval = null;
      }
      if (this.hideInterval) {
        clearInterval(this.hideInterval);
        this.hideInterval = null;
      }
      if (this.mobileHideInterval) {
        clearInterval(this.mobileHideInterval);
        this.mobileHideInterval = null;
      }
      if (this.mobileErrorHandler) {
        clearInterval(this.mobileErrorHandler);
        this.mobileErrorHandler = null;
      }
      if (this.universalErrorHandler) {
        clearInterval(this.universalErrorHandler);
        this.universalErrorHandler = null;
      }
    }

    handleUniversalErrors() {
      try {
        // Look for "Something went wrong" error messages anywhere on the page
        const errorTexts = [
          'Something went wrong',
          'something went wrong',
          'There was an unexpected error',
          'unexpected error communicating',
          'Please try again later',
          'try again later',
          'communicating with our servers',
          'servers. Please try again'
        ];

        // Check all text content on the page
        const allElements = document.querySelectorAll('*');
        for (const element of allElements) {
          const text = element.textContent || '';
          for (const errorText of errorTexts) {
            if (text.includes(errorText)) {
              if (errorText.includes('something went wrong') || errorText.includes('unexpected error')) {
                console.log('"Something went wrong" error detected - user should handle manually');
                return;
              }
              console.log('Universal error detection found:', errorText);
              this.handleSomethingWentWrongError();
              return;
            }
          }
        }

        // Also check for specific error containers
        const errorContainers = document.querySelectorAll('[class*="error"], [class*="Error"], [class*="something"], [class*="went"], [class*="wrong"]');
        for (const container of errorContainers) {
          const text = container.textContent?.toLowerCase() || '';
          if (text.includes('something went wrong') ||
              text.includes('unexpected error')) {
            console.log('"Something went wrong" error detected - user should handle manually');
            return;
          }
          if (text.includes('communicating with our servers')) {
            console.log('Error container detected:', text);
            this.handleSomethingWentWrongError();
            return;
          }
        }

      } catch (e) {
        console.log('Error in handleUniversalErrors:', e);
      }
    }

    handleMobileStripeErrors() {
      try {
        // Look for "Something went wrong" error messages
        const errorElements = document.querySelectorAll('[class*="error"], [class*="Error"], .error-message, .stripe-error, [class*="something"], [class*="went"], [class*="wrong"]');
        errorElements.forEach(element => {
          const text = element.textContent?.toLowerCase() || '';
          if (text.includes('tokenization') ||
              text.includes('something went wrong') ||
              text.includes('unexpected error') ||
              text.includes('communicating with our servers')) {
            console.log('Stripe error detected:', text);

            // For "Something went wrong" errors, just log and do nothing
            if (text.includes('something went wrong') || text.includes('unexpected error')) {
              console.log('"Something went wrong" error detected - user should handle manually');
              return;
            }

            // Try to click "Pay without Link" first
            const payWithoutLinkClicked = this.handlePayWithoutLink();
            if (!payWithoutLinkClicked) {
              // If no "Pay without Link" button, force hide all Link/Express elements
              this.hideUnnecessaryFields();
            }
            // Try to remove error message
            element.style.display = 'none';
          }
        });

        // Also check console for errors and apply fixes
        const originalError = console.error;
        console.error = (...args) => {
          const message = args.join(' ');
          if (message.includes('tokenization') ||
              message.includes('publishable key') ||
              message.includes('something went wrong') ||
              message.includes('unexpected error')) {
            console.log('Console error detected, applying mobile fixes');
            this.handlePayWithoutLink() || this.hideUnnecessaryFields();
          }
          originalError.apply(console, args);
        };
      } catch (e) {
        console.log('Error in handleMobileStripeErrors:', e);
      }
    }

    handleSomethingWentWrongError() {
      // Do nothing when "Something went wrong" error occurs
      // Let user handle it manually
      console.log('"Something went wrong" error detected - extension will not interfere');
    }

    showErrorNotification(message) {
      try {
        // Remove existing notification if any
        const existingNotification = document.getElementById('ashes-error-notification');
        if (existingNotification) {
          existingNotification.remove();
        }

        const notification = document.createElement('div');
        notification.id = 'ashes-error-notification';
        notification.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          background: #dc2626;
          color: white;
          padding: 12px 16px;
          border-radius: 8px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 14px;
          z-index: 10000;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          max-width: 300px;
          word-wrap: break-word;
        `;
        notification.textContent = message;

        document.body.appendChild(notification);

        // Auto-remove after 5 seconds
        setTimeout(() => {
          if (notification.parentNode) {
            notification.remove();
          }
        }, 5000);

      } catch (e) {
        console.log('Error showing notification:', e);
      }
    }

    handlePayWithoutLink() {
      try {
        // Look for "Pay without Link" button and click it
        const payWithoutLinkSelectors = [
          'button:contains("Pay without Link")',
          'button:contains("pay without link")',
          'button:contains("Pay without")',
          'a:contains("Pay without Link")',
          '[role="button"]:contains("Pay without Link")',
          'div[role="button"]:contains("Pay without Link")',
          'span:contains("Pay without Link")',
          'button[class*="pay"]:contains("without")',
          'button[class*="link"]:contains("without")',
          '[data-testid*="pay"]:contains("without")',
          '[aria-label*="pay without"]',
          '[aria-label*="Pay without"]'
        ];

        // Also try more generic selectors
        const allButtons = document.querySelectorAll('button, a, [role="button"], div[role="button"]');
        let payWithoutLinkButton = null;

        for (const button of allButtons) {
          const text = button.textContent?.toLowerCase() || '';
          if (text.includes('pay without link') ||
              text.includes('pay without') && text.includes('link') ||
              text.includes('without link') ||
              (text.includes('pay') && text.includes('without') && text.includes('link'))) {
            payWithoutLinkButton = button;
            break;
          }
        }

        if (payWithoutLinkButton) {
          console.log('Found "Pay without Link" button, clicking it');
          payWithoutLinkButton.click();
          return true;
        }

        // Also check for any button that might be the alternative payment method
        const alternativeButtons = document.querySelectorAll('button, a, [role="button"]');
        for (const button of alternativeButtons) {
          const text = button.textContent?.toLowerCase() || '';
          if (text.includes('continue') && text.includes('card') ||
              text.includes('use card') ||
              text.includes('card payment') ||
              text.includes('credit card') ||
              text.includes('debit card') ||
              text.includes('pay with card') ||
              text.includes('enter card details') ||
              text.includes('manual payment') ||
              text.includes('other payment method')) {
            console.log('Found alternative payment button, clicking it');
            button.click();
            return true;
          }
        }

        // Look for buttons in Link authentication modals
        const linkModalButtons = document.querySelectorAll('[class*="modal"] button, [class*="Modal"] button, [class*="dialog"] button, [class*="Dialog"] button');
        for (const button of linkModalButtons) {
          const text = button.textContent?.toLowerCase() || '';
          if (text.includes('pay without') ||
              text.includes('skip') ||
              text.includes('continue without') ||
              text.includes('use different method') ||
              text.includes('other payment')) {
            console.log('Found Link modal alternative button, clicking it');
            button.click();
            return true;
          }
        }

        // Look for green buttons (common for "Pay without Link")
        const greenButtons = document.querySelectorAll('button[style*="green"], button[class*="green"], .green button, [style*="background.*green"] button');
        for (const button of greenButtons) {
          const text = button.textContent?.toLowerCase() || '';
          if (text.includes('pay without') ||
              text.includes('without link') ||
              text.includes('pay') && text.includes('without')) {
            console.log('Found green "Pay without Link" button, clicking it');
            button.click();
            return true;
          }
        }

        // Look for buttons with specific text patterns from the image
        const specificPatterns = [
          'Pay without Link',
          'pay without link',
          'Pay without',
          'without Link',
          'Continue with card',
          'Use card instead',
          'Card payment'
        ];

        for (const pattern of specificPatterns) {
          const buttons = document.querySelectorAll(`button:contains("${pattern}"), a:contains("${pattern}"), [role="button"]:contains("${pattern}")`);
          if (buttons.length > 0) {
            console.log(`Found button with pattern "${pattern}", clicking it`);
            buttons[0].click();
            return true;
          }
        }

        return false;
      } catch (e) {
        console.log('Error in handlePayWithoutLink:', e);
        return false;
      }
    }

    stopStatsUpdateInterval() {
      if (this.statsInterval) {
        clearInterval(this.statsInterval);
        this.statsInterval = null;
      }
    }

    triggerRetry() {
      // Trigger retry by clicking the submit button
      const submitButton = document.querySelector('button[type="submit"], input[type="submit"], button:contains("Pay"), button:contains("Submit"), button:contains("Complete")');
      if (submitButton) {
        submitButton.click();
      }
    }

    cleanup() {
      this.stopAutoRetry();
      this.stopStatsUpdateInterval();
      this.stopRestrictionBypassInterval();

      // Remove all UI elements
      if (this.statsPopup && this.statsPopup.parentNode) {
        this.statsPopup.remove();
        this.statsPopup = null;
      }

      if (this.container && this.container.parentNode) {
        this.container.remove();
        this.container = null;
      }

      // Remove any existing notifications
      const existingNotifications = document.querySelectorAll('.stripe-helper-notification');
      existingNotifications.forEach(notif => {
        if (notif.parentNode) {
          notif.remove();
        }
      });

    }


    bypassAddressRestrictions() {
      // Look for messages about changing billing address - be more targeted
      const restrictionMessages = [
        'To change your billing address, leave this page and restart',
        'billing address cannot be changed',
        'address is locked',
        'restart to change address',
        'leave this page to change',
        'billing address',
        'address cannot be changed',
        'locked address',
        'restart to change'
      ];

      restrictionMessages.forEach(message => {
        // Only target specific elements that are likely to contain restriction messages
        const selectors = [
          'div[class*="message"]',
          'div[class*="warning"]',
          'div[class*="error"]',
          'div[class*="notice"]',
          'div[class*="alert"]',
          'span[class*="message"]',
          'span[class*="warning"]',
          'span[class*="error"]',
          'p[class*="message"]',
          'p[class*="warning"]',
          'p[class*="error"]',
          'div[class*="billing"]',
          'div[class*="address"]'
        ];

        selectors.forEach(selector => {
          const elements = document.querySelectorAll(selector);
          elements.forEach(element => {
            if (element.textContent && element.textContent.toLowerCase().includes(message.toLowerCase())) {
              // Only hide, don't remove to avoid breaking the page
              element.style.display = 'none';
              element.style.visibility = 'hidden';
            }
          });
        });
      });

      // Auto-fill address fields if they appear to be locked or empty
      this.autoFillAddressFields();

      // Hide Pay with Link section and name/address fields (if enabled)
      try {
        chrome.storage.local.get(['removePaymentAgentEnabled'], (r) => {
          if (!r || r.removePaymentAgentEnabled) {
            this.hideUnnecessaryFields();
          }
        });
      } catch (e) {
        this.hideUnnecessaryFields();
      }

      // Force enable address editing by removing any restrictions
      try {
        const addressContainers = document.querySelectorAll('[class*="address"], [id*="address"], [data-testid*="address"]');
        addressContainers.forEach(container => {
          try {
            // Remove any disabled styling
            container.classList.remove('disabled', 'locked', 'readonly');
            container.style.pointerEvents = 'auto';
            container.style.opacity = '1';

            // Enable all inputs within the container
            const inputs = container.querySelectorAll('input, select, textarea');
            inputs.forEach(input => {
              try {
                // Only unlock if it's not a critical system field
                if (input.name && !input.name.includes('password') && !input.name.includes('confirm')) {
                  input.removeAttribute('disabled');
                  input.removeAttribute('readonly');
                  input.disabled = false;
                  input.readOnly = false;
                  input.style.pointerEvents = 'auto';
                  input.style.opacity = '1';
                }
              } catch (e) {
                console.log('Error unlocking input in container:', e);
              }
            });
          } catch (e) {
            console.log('Error processing address container:', e);
          }
        });
      } catch (e) {
        console.log('Error in address container processing:', e);
      }

      // Look for and click any "Edit Address" or similar buttons
      const editSelectors = [
        'button[aria-label*="edit"]',
        'button[aria-label*="change"]',
        'button[class*="edit"]',
        'button[class*="change"]',
        'a[href*="edit"]',
        'a[href*="change"]',
        '[role="button"][aria-label*="edit"]',
        '[role="button"][aria-label*="change"]'
      ];

      editSelectors.forEach(selector => {
        const buttons = document.querySelectorAll(selector);
        buttons.forEach(button => {
          const text = button.textContent?.toLowerCase() || '';
          const ariaLabel = button.getAttribute('aria-label')?.toLowerCase() || '';

          if (text.includes('address') || text.includes('billing') ||
              text.includes('edit') || text.includes('change') ||
              ariaLabel.includes('address') || ariaLabel.includes('billing') ||
              ariaLabel.includes('edit') || ariaLabel.includes('change')) {
            try {
              button.click();
            } catch (e) {
              // Try alternative click methods
              button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
            }
          }
        });
      });

      // Force remove any overlay elements that might be blocking address editing
      const overlays = document.querySelectorAll('[class*="overlay"], [class*="modal"], [class*="blocking"]');
      overlays.forEach(overlay => {
        if (overlay.textContent?.toLowerCase().includes('address') ||
            overlay.textContent?.toLowerCase().includes('billing') ||
            overlay.textContent?.toLowerCase().includes('restart')) {
          overlay.style.display = 'none';
          overlay.remove();
        }
      });
    }

    autoFillAddressFields() {
      try {
        // Check if address fields are empty or locked
        const addressFields = document.querySelectorAll('input[name*="address"], input[name*="billing"], input[name*="city"], input[name*="state"], input[name*="postal"], input[name*="zip"], input[name*="country"]');
        let hasEmptyFields = false;
        let hasLockedFields = false;

        addressFields.forEach(field => {
          if (!field.value || field.value.trim() === '') {
            hasEmptyFields = true;
          }
          if (field.disabled || field.readOnly) {
            hasLockedFields = true;
          }
        });

        // If we have empty or locked address fields, auto-fill them
        if (hasEmptyFields || hasLockedFields) {
          const address = config.addresses[this.currentAddress] || config.addresses.usa;
          const randomName = config.generateRandomName();

          // First unlock all fields
          this.unlockFields();

          // Wait a bit for DOM to update
          setTimeout(() => {
            this.forceFillAddressFields(address, randomName);
          }, 200);
        }
      } catch (e) {
        console.log('Error in autoFillAddressFields:', e);
      }
    }

    hideUnnecessaryFields() {
      try {
        // Detect mobile browser
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                        window.innerWidth <= 768 ||
                        ('ontouchstart' in window);

        console.log('Mobile detection:', { isMobile, userAgent: navigator.userAgent, width: window.innerWidth });

        // First, try to click "Pay without Link" button if it exists
        const payWithoutLinkClicked = this.handlePayWithoutLink();
        if (payWithoutLinkClicked) {
          console.log('Successfully clicked "Pay without Link" button');
          return; // Don't hide elements if we found and clicked the button
        }

        // Hide Pay with Link section - target current Stripe elements
        const linkSelectors = [
          // Current Stripe Link elements
          '.ElementsExpressCheckoutElement', '.StripeElement', 'iframe[name*="StripeFrame"]',
          '.ButtonAndDividerContainer', '.ButtonContainer', '.ButtonWrapper',
          '[data-testid="express-checkout-element"]', '.__PrivateStripeElement',
          // Legacy LinkButton elements
          '.LinkButton-inner',
          '.LinkButton-genericText',
          '.LinkButton-logoHintWrapper',
          '.LinkButton-logo',
          '.LinkButton-paymentDetailHint',
          '.LinkButton-paymentIcon',
          '.LinkButton-paymentDetailHintText',
          '[class*="LinkButton"]',
          '[class*="link"]',
          '[class*="Link"]',
          '[data-testid*="link"]',
          '[aria-label*="link"]',
          'div:has-text("Pay with Link")',
          'div:has-text("pay with link")',
          'div:has-text("Link")',
          'button:has-text("Link")',
          'a:has-text("Link")',
          '[role="button"]:has-text("Link")',
          'div[role="button"]:has-text("Link")',
          'span:has-text("Link")',
          'p:has-text("Link")'
        ];

        linkSelectors.forEach(selector => {
          try {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
              // More aggressive hiding for mobile browsers
              const shouldHide = element.textContent && (
                element.textContent.toLowerCase().includes('link') ||
                element.textContent.toLowerCase().includes('pay with') ||
                element.textContent.toLowerCase().includes('express') ||
                element.textContent.toLowerCase().includes('apple pay') ||
                element.textContent.toLowerCase().includes('google pay')
              );

              if (shouldHide) {
                // More aggressive hiding for mobile
                if (isMobile) {
                  element.style.display = 'none !important';
                  element.style.visibility = 'hidden !important';
                  element.style.height = '0 !important';
                  element.style.overflow = 'hidden !important';
                  element.style.opacity = '0 !important';
                  element.style.pointerEvents = 'none !important';
                  element.style.width = '0 !important';
                  element.style.margin = '0 !important';
                  element.style.padding = '0 !important';
                  element.style.position = 'absolute !important';
                  element.style.left = '-9999px !important';
                  element.style.top = '-9999px !important';
                  // Try to remove from DOM on mobile
                  try {
                    element.remove();
                  } catch (e) {
                    console.log('Could not remove element:', e);
                  }
                } else {
                  element.style.display = 'none !important';
                  element.style.visibility = 'hidden !important';
                  element.style.height = '0 !important';
                  element.style.overflow = 'hidden !important';
                  element.style.opacity = '0 !important';
                  element.style.pointerEvents = 'none !important';
                  element.style.width = '0 !important';
                  element.style.margin = '0 !important';
                  element.style.padding = '0 !important';
                }
                // Also hide parent containers
                let parent = element.parentElement;
                for (let i = 0; i < 5 && parent; i++) {
                  if (parent.textContent && parent.textContent.toLowerCase().includes('link')) {
                    parent.style.display = 'none !important';
                    parent.style.visibility = 'hidden !important';
                    parent.style.height = '0 !important';
                    parent.style.overflow = 'hidden !important';
                    parent.style.opacity = '0 !important';
                  }
                  parent = parent.parentElement;
                }
              }
            });
          } catch (e) {
            // Ignore selector errors
          }
        });

        // Target the specific LinkButton element structure
        const linkButtonElements = document.querySelectorAll('span.LinkButton-inner, .LinkButton-inner');
        linkButtonElements.forEach(element => {
          element.style.display = 'none !important';
          element.style.visibility = 'hidden !important';
          element.style.height = '0 !important';
          element.style.overflow = 'hidden !important';
          element.style.opacity = '0 !important';
          element.style.pointerEvents = 'none !important';
          element.style.width = '0 !important';
          element.style.margin = '0 !important';
          element.style.padding = '0 !important';

          // Hide all children
          const children = element.querySelectorAll('*');
          children.forEach(child => {
            child.style.display = 'none !important';
            child.style.visibility = 'hidden !important';
            child.style.height = '0 !important';
            child.style.overflow = 'hidden !important';
            child.style.opacity = '0 !important';
            child.style.pointerEvents = 'none !important';
          });

          // Hide parent containers
          let parent = element.parentElement;
          for (let i = 0; i < 5 && parent; i++) {
            if (parent.classList.contains('LinkButton') || parent.textContent?.includes('Link')) {
              parent.style.display = 'none !important';
              parent.style.visibility = 'hidden !important';
              parent.style.height = '0 !important';
              parent.style.overflow = 'hidden !important';
              parent.style.opacity = '0 !important';
            }
            parent = parent.parentElement;
          }
        });

        // Target current Stripe express checkout elements more aggressively
        const expressCheckoutElements = document.querySelectorAll(
          '.ElementsExpressCheckoutElement, .StripeElement, [data-testid="express-checkout-element"], .__PrivateStripeElement'
        );
        expressCheckoutElements.forEach(element => {
          element.style.display = 'none !important';
          element.style.visibility = 'hidden !important';
          element.style.height = '0 !important';
          element.style.overflow = 'hidden !important';
          element.style.opacity = '0 !important';
          element.style.pointerEvents = 'none !important';
          element.style.width = '0 !important';
          element.style.margin = '0 !important';
          element.style.padding = '0 !important';

          // Hide all children including iframes
          const children = element.querySelectorAll('*');
          children.forEach(child => {
            child.style.display = 'none !important';
            child.style.visibility = 'hidden !important';
            child.style.height = '0 !important';
            child.style.overflow = 'hidden !important';
            child.style.opacity = '0 !important';
            child.style.pointerEvents = 'none !important';
          });

          // Hide parent containers
          let parent = element.parentElement;
          for (let i = 0; i < 5 && parent; i++) {
            if (parent.classList.contains('ButtonAndDividerContainer') ||
                parent.classList.contains('ButtonContainer') ||
                parent.classList.contains('ButtonWrapper') ||
                parent.textContent?.includes('Link') ||
                parent.textContent?.includes('Express')) {
              parent.style.display = 'none !important';
              parent.style.visibility = 'hidden !important';
              parent.style.height = '0 !important';
              parent.style.overflow = 'hidden !important';
              parent.style.opacity = '0 !important';
            }
            parent = parent.parentElement;
          }
        });

        // Target the specific structure from current Stripe checkout - MORE AGGRESSIVE
        const buttonAndDividerContainer = document.querySelector('.ButtonAndDividerContainer');
        if (buttonAndDividerContainer) {
          // Try to remove completely first, fallback to hiding
          try {
            buttonAndDividerContainer.remove();
          } catch (e) {
            // If removal fails, hide aggressively
            buttonAndDividerContainer.style.display = 'none !important';
            buttonAndDividerContainer.style.visibility = 'hidden !important';
            buttonAndDividerContainer.style.height = '0 !important';
            buttonAndDividerContainer.style.overflow = 'hidden !important';
            buttonAndDividerContainer.style.opacity = '0 !important';
            buttonAndDividerContainer.style.pointerEvents = 'none !important';
            buttonAndDividerContainer.style.width = '0 !important';
            buttonAndDividerContainer.style.margin = '0 !important';
            buttonAndDividerContainer.style.padding = '0 !important';
            buttonAndDividerContainer.style.position = 'absolute !important';
            buttonAndDividerContainer.style.left = '-9999px !important';
            buttonAndDividerContainer.style.top = '-9999px !important';

            // Hide all children
            const children = buttonAndDividerContainer.querySelectorAll('*');
            children.forEach(child => {
              child.style.display = 'none !important';
              child.style.visibility = 'hidden !important';
              child.style.height = '0 !important';
              child.style.overflow = 'hidden !important';
              child.style.opacity = '0 !important';
              child.style.pointerEvents = 'none !important';
            });
          }
        }

        // Also target the parent container that contains the express checkout
        const paymentRequestOrHeader = document.querySelector('.PaymentRequestOrHeader');
        if (paymentRequestOrHeader) {
          // Try to remove completely first, fallback to hiding
          try {
            paymentRequestOrHeader.remove();
          } catch (e) {
            // If removal fails, hide aggressively
            paymentRequestOrHeader.style.display = 'none !important';
            paymentRequestOrHeader.style.visibility = 'hidden !important';
            paymentRequestOrHeader.style.height = '0 !important';
            paymentRequestOrHeader.style.overflow = 'hidden !important';
            paymentRequestOrHeader.style.opacity = '0 !important';
            paymentRequestOrHeader.style.pointerEvents = 'none !important';
            paymentRequestOrHeader.style.width = '0 !important';
            paymentRequestOrHeader.style.margin = '0 !important';
            paymentRequestOrHeader.style.padding = '0 !important';
            paymentRequestOrHeader.style.position = 'absolute !important';
            paymentRequestOrHeader.style.left = '-9999px !important';
            paymentRequestOrHeader.style.top = '-9999px !important';
          }
        }

        // Target any iframe elements that might be the Link popup
        const iframes = document.querySelectorAll('iframe[name*="StripeFrame"], iframe[src*="stripe"], iframe[title*="checkout"]');
        iframes.forEach(iframe => {
          iframe.style.display = 'none !important';
          iframe.style.visibility = 'hidden !important';
          iframe.style.height = '0 !important';
          iframe.style.overflow = 'hidden !important';
          iframe.style.opacity = '0 !important';
          iframe.style.pointerEvents = 'none !important';
          iframe.style.width = '0 !important';
          iframe.style.margin = '0 !important';
          iframe.style.padding = '0 !important';
          iframe.style.position = 'absolute !important';
          iframe.style.left = '-9999px !important';
          iframe.style.top = '-9999px !important';
        });

        // Additional aggressive hiding for any element containing "link" text
        const allElements = document.querySelectorAll('*');
        allElements.forEach(element => {
          if (element.textContent && element.textContent.toLowerCase().includes('link') &&
              !element.textContent.toLowerCase().includes('blink') &&
              !element.textContent.toLowerCase().includes('linking')) {
            // Check if it's likely a UI element (has click handlers, is button-like, etc.)
            if (element.onclick || element.getAttribute('role') === 'button' ||
                element.tagName === 'BUTTON' || element.tagName === 'A' ||
                element.style.cursor === 'pointer' || element.classList.contains('button') ||
                element.classList.contains('LinkButton')) {
              element.style.display = 'none !important';
              element.style.visibility = 'hidden !important';
              element.style.height = '0 !important';
              element.style.overflow = 'hidden !important';
              element.style.opacity = '0 !important';
              element.style.pointerEvents = 'none !important';
              element.style.width = '0 !important';
              element.style.margin = '0 !important';
              element.style.padding = '0 !important';
            }
          }
        });

        // Hide name fields - more aggressive approach
        const nameSelectors = [
          'input[name*="name"]',
          'input[placeholder*="name"]',
          'input[aria-label*="name"]',
          'input[data-testid*="name"]',
          'input[id*="name"]',
          'input[type="text"]',
          'label:has-text("name")',
          'div:has-text("Cardholder name")',
          'div:has-text("Name")',
          'div:has-text("Full name")',
          'div:has-text("Cardholder")',
          '[class*="name"]',
          '[class*="Name"]',
          '[data-testid*="name"]',
          '[aria-label*="name"]'
        ];

        nameSelectors.forEach(selector => {
          try {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
              element.style.display = 'none !important';
              element.style.visibility = 'hidden !important';
              element.style.height = '0 !important';
              element.style.overflow = 'hidden !important';
              element.style.opacity = '0 !important';
              element.style.pointerEvents = 'none !important';
              element.style.width = '0 !important';
              element.style.margin = '0 !important';
              element.style.padding = '0 !important';
              // Also hide parent containers
              let parent = element.parentElement;
              for (let i = 0; i < 5 && parent; i++) {
                if (parent.textContent && (parent.textContent.toLowerCase().includes('name') ||
                    parent.textContent.toLowerCase().includes('cardholder'))) {
                  parent.style.display = 'none !important';
                  parent.style.visibility = 'hidden !important';
                  parent.style.height = '0 !important';
                  parent.style.overflow = 'hidden !important';
                  parent.style.opacity = '0 !important';
                }
                parent = parent.parentElement;
              }
            });
          } catch (e) {
            // Ignore selector errors
          }
        });

        // Hide address and country fields - more aggressive approach
        const addressSelectors = [
          'input[name*="address"]',
          'input[placeholder*="address"]',
          'input[aria-label*="address"]',
          'input[data-testid*="address"]',
          'input[id*="address"]',
          'input[name*="city"]',
          'input[name*="state"]',
          'input[name*="postal"]',
          'input[name*="zip"]',
          'input[name*="country"]',
          'select[name*="country"]',
          'select[name*="state"]',
          'select[class*="country"]',
          'select[class*="state"]',
          'label:has-text("address")',
          'label:has-text("city")',
          'label:has-text("state")',
          'label:has-text("postal")',
          'label:has-text("zip")',
          'label:has-text("country")',
          'div:has-text("Address")',
          'div:has-text("City")',
          'div:has-text("State")',
          'div:has-text("Postal")',
          'div:has-text("Zip")',
          'div:has-text("Country")',
          'div:has-text("Country or region")',
          '[class*="country"]',
          '[class*="Country"]',
          '[class*="address"]',
          '[class*="Address"]',
          '[data-testid*="country"]',
          '[data-testid*="address"]',
          '[aria-label*="country"]',
          '[aria-label*="address"]'
        ];

        addressSelectors.forEach(selector => {
          try {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
              element.style.display = 'none !important';
              element.style.visibility = 'hidden !important';
              element.style.height = '0 !important';
              element.style.overflow = 'hidden !important';
              element.style.opacity = '0 !important';
              element.style.pointerEvents = 'none !important';
              element.style.width = '0 !important';
              element.style.margin = '0 !important';
              element.style.padding = '0 !important';
              // Also hide parent containers
              let parent = element.parentElement;
              for (let i = 0; i < 5 && parent; i++) {
                if (parent.textContent && (parent.textContent.toLowerCase().includes('address') ||
                    parent.textContent.toLowerCase().includes('billing') ||
                    parent.textContent.toLowerCase().includes('country') ||
                    parent.textContent.toLowerCase().includes('region'))) {
                  parent.style.display = 'none !important';
                  parent.style.visibility = 'hidden !important';
                  parent.style.height = '0 !important';
                  parent.style.overflow = 'hidden !important';
                  parent.style.opacity = '0 !important';
                }
                parent = parent.parentElement;
              }
            });
          } catch (e) {
            // Ignore selector errors
          }
        });

        // Hide email field as well
        const emailSelectors = [
          'input[type="email"]',
          'input[name*="email"]',
          'input[placeholder*="email"]',
          'input[aria-label*="email"]',
          'input[data-testid*="email"]',
          'input[id*="email"]',
          'label:has-text("email")',
          'div:has-text("Email")'
        ];

        emailSelectors.forEach(selector => {
          try {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
              element.style.display = 'none';
              element.style.visibility = 'hidden';
              element.style.height = '0';
              element.style.overflow = 'hidden';
              // Also hide parent containers
              let parent = element.parentElement;
              for (let i = 0; i < 3 && parent; i++) {
                if (parent.textContent && parent.textContent.toLowerCase().includes('email')) {
                  parent.style.display = 'none';
                  parent.style.visibility = 'hidden';
                }
                parent = parent.parentElement;
              }
            });
          } catch (e) {
            // Ignore selector errors
          }
        });

      } catch (e) {
        console.log('Error in hideUnnecessaryFields:', e);
      }
    }

    toggleVisibility() {
      this.isVisible = !this.isVisible;
      this.container.style.right = this.isVisible ? '0' : '-140px';
      this.toggleBtn.textContent = this.isVisible ? '»' : '«';
    }

    createInterface() {
      // Check if interface already exists
      const existingContainer = document.querySelector('[data-stripe-helper-container]');
      if (existingContainer) {
        console.log('Stripe Helper interface already exists, skipping creation');
        return;
      }

      // Additional check to prevent multiple instances
      if (this.container) {
        console.log('Stripe Helper container already created, skipping');
        return;
      }

      // Add Google Fonts and CSS animations
      const fontLink = document.createElement('link');
      fontLink.rel = 'stylesheet';
      fontLink.href = 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600;700&display=swap';
      document.head.appendChild(fontLink);

      const style = document.createElement('style');
      style.textContent = `
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }

        @keyframes glow {
          0%, 100% {
            box-shadow: 0 0 5px rgba(255, 255, 255, 0.3);
          }
          50% {
            box-shadow: 0 0 15px rgba(255, 255, 255, 0.6);
          }
        }
      `;
      document.head.appendChild(style);

      const styles = this.createStyles();

      this.container = document.createElement('div');
      this.container.setAttribute('data-stripe-helper-container', 'true');
      Object.assign(this.container.style, styles.container);
      this.container.style.animation = 'fadeInUp 0.6s ease-out';

      this.toggleBtn = document.createElement('button');
      Object.assign(this.toggleBtn.style, styles.toggleBtn);
      this.toggleBtn.textContent = '«';
      this.toggleBtn.onclick = () => this.toggleVisibility();

      const binButton = this.createButton('Enter BIN', () => this.showBinDialog(), '💳');
      const emailButton = this.createButton('Enter Email', () => this.showEmailDialog(), '📧');
      this.startStopButton = this.createButton(this.isRunning ? 'Stop' : 'Start', () => this.toggleStartStop(), this.isRunning ? '⏹️' : '▶️');

      const buttons = [binButton, emailButton, this.startStopButton];

      buttons.forEach(btn => this.container.appendChild(btn));
      this.container.appendChild(this.toggleBtn);
      if (document.body) {
        document.body.appendChild(this.container);
        this.createStatsPopup();
        this.startStatsUpdateInterval();
        this.startRestrictionBypassInterval();

        // Add delay before running bypass functions to ensure page is loaded
        setTimeout(() => {
          this.bypassAddressRestrictions();
          // Also auto-fill address fields on page load
          this.autoFillAddressFields();
          // Hide unnecessary fields
          this.hideUnnecessaryFields();
        }, 2000);
      }
    }

    showBinDialog() {
      const dialog = document.createElement('div');
      Object.assign(dialog.style, {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        background: 'rgba(10, 10, 15, 0.95)',
        padding: '20px',
        borderRadius: '10px',
        zIndex: '1000001',
        boxShadow: '0 0 15px rgba(255, 255, 255, 0.2), 0 0 30px rgba(255, 255, 255, 0.1)',
        width: '300px'
      });

      const input = document.createElement('input');
      Object.assign(input.style, {
        width: '100%',
        padding: '8px',
        marginBottom: '10px',
        background: 'rgba(30, 30, 30, 0.9)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '5px',
        color: '#fff',
        boxSizing: 'border-box',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        outline: 'none'
      });
      input.value = this.binInput;
      input.placeholder = 'Enter BIN (e.g., 424242)';

      input.addEventListener('focus', () => {
        input.style.borderColor = 'rgba(255, 255, 255, 0.3)';
        input.style.boxShadow = '0 0 0 2px rgba(255, 255, 255, 0.1)';
      });

      input.addEventListener('blur', () => {
        input.style.borderColor = 'rgba(255, 255, 255, 0.1)';
        input.style.boxShadow = 'none';
      });

      const saveButton = document.createElement('button');
      Object.assign(saveButton.style, {
        width: '100%',
        padding: '8px',
        background: 'rgba(30, 30, 30, 0.9)',
        border: 'none',
        borderRadius: '5px',
        color: '#fff',
        cursor: 'pointer',
        boxShadow: '0 0 2px #ff0000, 0 0 4px #00ff00, 0 0 6px #0000ff'
      });
      saveButton.textContent = 'Save BIN';

      saveButton.onclick = () => {
        const binValue = input.value.trim();
        if (binValue) {
          chrome.storage.local.set({ bin: binValue }, () => {
            this.binInput = binValue;
            this.showToast('✓ BIN saved successfully');
            dialog.remove();
          });
        } else {
          this.showToast('⚠️ Please enter a valid BIN');
        }
      };

      dialog.appendChild(input);
      dialog.appendChild(saveButton);
      if (document.body) {
        document.body.appendChild(dialog);
        input.focus();
      }
    }

    showEmailDialog() {
      const dialog = document.createElement('div');
      Object.assign(dialog.style, {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        background: 'rgba(10, 10, 15, 0.95)',
        padding: '20px',
        borderRadius: '10px',
        zIndex: '1000001',
        boxShadow: '0 0 15px rgba(255, 255, 255, 0.2), 0 0 30px rgba(255, 255, 255, 0.1)',
        width: '300px'
      });

      const input = document.createElement('input');
      Object.assign(input.style, {
        width: '100%',
        padding: '8px',
        marginBottom: '10px',
        background: 'rgba(30, 30, 30, 0.9)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '5px',
        color: '#fff',
        boxSizing: 'border-box',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        outline: 'none'
      });
      input.value = this.emailInput;
      input.placeholder = 'Enter Email (e.g., test@example.com)';

      input.addEventListener('focus', () => {
        input.style.borderColor = 'rgba(255, 255, 255, 0.3)';
        input.style.boxShadow = '0 0 0 2px rgba(255, 255, 255, 0.1)';
      });

      input.addEventListener('blur', () => {
        input.style.borderColor = 'rgba(255, 255, 255, 0.1)';
        input.style.boxShadow = 'none';
      });

      const saveButton = document.createElement('button');
      Object.assign(saveButton.style, {
        width: '100%',
        padding: '8px',
        background: 'rgba(30, 30, 30, 0.9)',
        border: 'none',
        borderRadius: '5px',
        color: '#fff',
        cursor: 'pointer',
        boxShadow: '0 0 2px #ff0000, 0 0 4px #00ff00, 0 0 6px #0000ff'
      });
      saveButton.textContent = 'Save Email';

      saveButton.onclick = () => {
        const emailValue = input.value.trim();
        if (emailValue) {
          chrome.storage.local.set({ email: emailValue }, () => {
            this.emailInput = emailValue;
            this.showToast('✓ Email saved successfully');
            dialog.remove();
          });
        } else {
          // If empty, clear the email
          chrome.storage.local.remove('email', () => {
            this.emailInput = '';
            this.showToast('✓ Custom Email cleared');
            dialog.remove();
          });
        }
      };

      dialog.appendChild(input);
      dialog.appendChild(saveButton);
      if (document.body) {
        document.body.appendChild(dialog);
        input.focus();
      }
    }



    async init() {
      if (!config.urls.some(url => window.location.href.includes(url))) return;

      await this.loadStorage();

      // Check if disclaimer is accepted before creating interface
      const disclaimerAccepted = await this.checkDisclaimerStatus();
      if (!disclaimerAccepted) {
        console.log('Extension disabled - disclaimer not accepted');
        return;
      }

      // Check if extension is enabled
      const isEnabled = await this.checkExtensionStatus();
      if (!isEnabled) {
        console.log('Extension disabled - status is off');
        return;
      }

      // Mobile-specific initialization
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                      window.innerWidth <= 768 ||
                      ('ontouchstart' in window);

      if (isMobile) {
        console.log('Mobile browser detected, applying mobile-specific fixes');
        // More aggressive hiding on mobile
        this.hideUnnecessaryFields();
        // Run hiding more frequently on mobile
        this.mobileHideInterval = setInterval(() => this.hideUnnecessaryFields(), 1000);
      }

      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
          this.createInterface();
          // Auto-fill CC details without starting auto-retry
          this.autoFillCC();
        });
      } else {
        this.createInterface();
        // Auto-fill CC details without starting auto-retry
        this.autoFillCC();
      }
    }

    async checkDisclaimerStatus() {
      return new Promise((resolve) => {
        chrome.storage.local.get(['disclaimerAccepted'], (result) => {
          resolve(result.disclaimerAccepted === true);
        });
      });
    }

    async checkExtensionStatus() {
      return new Promise((resolve) => {
        chrome.storage.local.get(['enabled'], (result) => {
          resolve(result.enabled !== false); // Default to true if not set
        });
      });
    }
  }

  // Initialize Stripe Helper if on a Stripe-related page
  if (config.urls.some(url => window.location.href.includes(url))) {
    window.stripeHelper = new StripeHelper();
  }
})();
// Removed duplicate DOMContentLoaded listener to prevent multiple instances

// hCaptcha solver removed - users should solve manually

// Play success sound on message from background and update stats
try {
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg && msg.type === 'play_success_sound') {
      try {
        console.log('Hit sound message received');
        console.log('stripeHelper available:', !!window.stripeHelper);
        console.log('stripeHelper.settings:', window.stripeHelper?.settings);
        console.log('hitSoundEnabled:', window.stripeHelper?.settings?.hitSoundEnabled);

        // Also check storage directly to verify the setting
        chrome.storage.local.get(['hitSoundEnabled'], (result) => {
          console.log('hitSoundEnabled from storage:', result.hitSoundEnabled);
        });

        if (window.stripeHelper && window.stripeHelper.settings && window.stripeHelper.settings.hitSoundEnabled) {
          console.log('Playing hit sound - hitSoundEnabled:', window.stripeHelper.settings.hitSoundEnabled);
          const url = chrome.runtime.getURL('scripts/hit.mp3');
          console.log('Audio URL:', url);
          const audio = new Audio(url);
          audio.volume = 1.0;
          audio.play().then(() => {
            console.log('Hit sound played successfully');
          }).catch((e) => {
            console.log('Hit sound play error:', e);
          });
        } else {
          console.log('Hit sound disabled or stripeHelper not available');
        }
      } catch (e) {
        console.log('Hit sound error:', e);
      }
    } else if (msg && msg.type === 'stats_updated') {
      // Update floating stats popup when stats change
      if (window.stripeHelper && window.stripeHelper.updateStatsPopup) {
        window.stripeHelper.updateStatsPopup();
      }
    } else if (msg && msg.type === 'stats_response') {
      // Handle direct stats response
      if (window.stripeHelper && window.stripeHelper.statsPopup) {
        const successEl = window.stripeHelper.statsPopup.querySelector('#floating-success-count');
        const retriesEl = window.stripeHelper.statsPopup.querySelector('#floating-retries-count');
        const binEl = window.stripeHelper.statsPopup.querySelector('#floating-bin-display');

        if (successEl && msg.payload?.successCount !== undefined) {
          successEl.textContent = msg.payload.successCount;
        }
        if (retriesEl && msg.payload?.globalRetryCount !== undefined) {
          retriesEl.textContent = msg.payload.globalRetryCount;
        }
        if (binEl && msg.payload?.activeBin !== undefined) {
          const binValue = msg.payload.activeBin || '-';
          binEl.textContent = binValue;
          binEl.setAttribute('data-original-bin', binValue);
        }
      }
    } else if (msg && msg.type === 'retry_count_updated') {
      // Handle immediate retry count update
      if (window.stripeHelper && window.stripeHelper.statsPopup) {
        const retriesEl = window.stripeHelper.statsPopup.querySelector('#floating-retries-count');
        if (retriesEl && msg.globalRetryCount !== undefined) {
          retriesEl.textContent = msg.globalRetryCount;
        }
      }
    } else if (msg && msg.type === 'stats_updated') {
      // Update floating stats popup when stats change
      if (window.stripeHelper && window.stripeHelper.updateStatsPopup) {
        window.stripeHelper.updateStatsPopup();
      }
    } else if (msg && msg.type === 'settings_updated') {
      // Reload settings when they're updated
      if (window.stripeHelper && window.stripeHelper.loadSettings) {
        window.stripeHelper.loadSettings().then(() => {
          console.log('Settings reloaded after update:', window.stripeHelper.settings);
        });
      }

      // Re-apply Link/express removal based on latest setting
      try {
        chrome.storage.local.get(['removePaymentAgentEnabled'], (r) => {
          const enabled = r && r.removePaymentAgentEnabled;
          if (enabled) {
            if (window.stripeHelper && window.stripeHelper.hideUnnecessaryFields) {
              window.stripeHelper.hideUnnecessaryFields();
            }
          } else {
            // Attempt to unhide elements by clearing inline styles we set
            const selectors = ['.ElementsExpressCheckoutElement', '.StripeElement', '[data-testid="express-checkout-element"]', '.__PrivateStripeElement', '.ButtonAndDividerContainer', '.ButtonContainer', '.ButtonWrapper', '.PaymentRequestOrHeader'];
            selectors.forEach(sel => {
              document.querySelectorAll(sel).forEach(el => {
                el.style.display = '';
                el.style.visibility = '';
                el.style.height = '';
                el.style.overflow = '';
                el.style.opacity = '';
                el.style.pointerEvents = '';
                el.style.width = '';
                el.style.margin = '';
                el.style.padding = '';
                el.style.position = '';
                el.style.left = '';
                el.style.top = '';
              });
            });
          }
        });
      } catch (e) {
        // ignore
      }
    } else if (msg && msg.type === 'trigger_retry') {
      // Handle retry trigger from background
      if (window.stripeHelper && window.stripeHelper.triggerRetry) {
        window.stripeHelper.triggerRetry();
      }
    } else if (msg && msg.type === 'disclaimer_accepted') {
      // Re-initialize extension when disclaimer is accepted
      if (config.urls.some(url => window.location.href.includes(url))) {
        if (window.stripeHelper) {
          window.stripeHelper.cleanup();
        }
        window.stripeHelper = new StripeHelper();
      }
    } else if (msg && msg.type === 'toggle_enabled') {
      // Handle extension enable/disable
      if (config.urls.some(url => window.location.href.includes(url))) {
        if (msg.enabled) {
          // Re-initialize when enabled
          if (window.stripeHelper) {
            window.stripeHelper.cleanup();
          }
          window.stripeHelper = new StripeHelper();
        } else {
          // Clean up when disabled
          if (window.stripeHelper) {
            window.stripeHelper.cleanup();
            window.stripeHelper = null;
            window.stripeHelperInjected = false;
          }
        }
      }
    }
  });
} catch (e) {
  // ignore
}