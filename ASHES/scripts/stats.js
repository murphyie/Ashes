// Modern Ashes Bypasser Stats Page
// Production logging control
const DEBUG = false;
if (!DEBUG) {
  try { console.log = function () {}; } catch (e) {}
}
let binBlurred = false;
let advancedExpanded = false;

// DOM elements
let logsEl, activeBinEl, successCountEl, retryCountEl, toggleEnabledEl, toggleEnabled2El, binInputEl, saveBtnEl, advancedBtnEl, clearLogsEl, toggleBinBlurEl;

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
  // Get DOM elements
  logsEl = document.getElementById('logs');
  activeBinEl = document.getElementById('activeBin');
  successCountEl = document.getElementById('successCount');
  retryCountEl = document.getElementById('retryCount');
  // Removed header toggle - only using main toggle now
  toggleEnabled2El = document.getElementById('toggleEnabled2');
  // Removed BIN input elements - now handled in checkout popup
  clearLogsEl = document.getElementById('clearLogs');
  toggleBinBlurEl = document.getElementById('toggleBinBlur');

  // Check disclaimer status first
  checkDisclaimerStatus();

  // Set up event listeners
  setupEventListeners();

  // Initialize dashboard
  initializeDashboard();
});

function setupEventListeners() {
  // Toggle enabled state
  if (toggleEnabled2El) {
    toggleEnabled2El.addEventListener('click', () => toggleEnabled());
  }

  // Removed BIN configuration - now handled in checkout popup

  // Clear logs
  if (clearLogsEl) {
    clearLogsEl.addEventListener('click', () => clearLogs());
  }

  // Reset stats
  const resetStatsBtn = document.getElementById('resetStats');
  if (resetStatsBtn) {
    resetStatsBtn.addEventListener('click', () => resetStats());
  }

  // BIN blur toggle
  if (toggleBinBlurEl) {
    toggleBinBlurEl.addEventListener('click', () => toggleBinBlur());
  }

  // Settings button
  setupSettingsButton();

  // Disclaimer buttons
  const agreeBtn = document.getElementById('agreeBtn');

  if (agreeBtn) {
    agreeBtn.addEventListener('click', handleDisclaimerAgreement);
  }
}

function checkDisclaimerStatus() {
  chrome.storage.local.get(['disclaimerAccepted'], (result) => {
    if (!result.disclaimerAccepted) {
      showDisclaimer();
    } else {
      showDashboard();
    }
  });
}

function showDisclaimer() {
  const disclaimerModal = document.getElementById('disclaimerModal');
  if (disclaimerModal) {
    disclaimerModal.style.display = 'block';
  }
}

function showDashboard() {
  const disclaimerModal = document.getElementById('disclaimerModal');
  const permanentlyDisabled = document.getElementById('permanentlyDisabled');

  if (disclaimerModal) {
    disclaimerModal.style.display = 'none';
  }
  if (permanentlyDisabled) {
    permanentlyDisabled.style.display = 'none';
  }

  // Initialize the dashboard
  initializeDashboard();
}


function initializeDashboard() {
  // Load settings
  loadSettings();

  // Start stats updates
  updateStats();
  updateLogs();

  // Set up periodic updates
  window.statsInterval = setInterval(updateStats, 1000);
  window.logsInterval = setInterval(updateLogs, 1000);

  // Listen for messages from background script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'stats_update') {
      updateStats();
      updateLogs();
    }
  });

  // Cleanup intervals when page unloads
  window.addEventListener('beforeunload', () => {
    if (window.statsInterval) {
      clearInterval(window.statsInterval);
    }
    if (window.logsInterval) {
      clearInterval(window.logsInterval);
    }
  });
}

function handleDisclaimerAgreement(event) {
  if (event && typeof event.preventDefault === 'function') {
    event.preventDefault();
  }
  const card = document.querySelector('#disclaimerModal .disclaimer-card');
  if (card) {
    card.classList.add('disclaimer-exit');
  }
  setTimeout(() => {
    chrome.storage.local.set({ disclaimerAccepted: true, enabled: true }, () => {
      updateToggleState(true);
      showDashboard();
      // Notify background script
      chrome.runtime.sendMessage({ type: 'toggle_enabled', enabled: true });
      chrome.runtime.sendMessage({ type: 'disclaimer_accepted' });
    });
  }, 180);
}



function toggleEnabled() {
  chrome.storage.local.get(['enabled'], (result) => {
    const newState = !result.enabled;
    chrome.storage.local.set({ enabled: newState }, () => {
      updateToggleState(newState);
      // Show status message
      const message = newState ? 'Bypasser turned on' : 'Bypasser turned off';
      const type = newState ? 'success' : 'info';
      showToast(message, type);
      // Notify background script
      chrome.runtime.sendMessage({ type: 'toggle_enabled', enabled: newState });
    });
  });
}

function updateToggleState(enabled) {
  if (toggleEnabled2El) {
    if (enabled) {
      toggleEnabled2El.classList.add('active');
    } else {
      toggleEnabled2El.classList.remove('active');
    }
  }
}

function loadSettings() {
  chrome.storage.local.get(['enabled'], (result) => {
    updateToggleState(result.enabled);
  });
}

function toggleBinBlur() {
  binBlurred = !binBlurred;
  if (activeBinEl) {
    const originalBin = activeBinEl.getAttribute('data-original-bin') || 'Not set';
    activeBinEl.textContent = binBlurred ? '••••••' : originalBin;
  }
  if (toggleBinBlurEl) {
    if (binBlurred) {
      toggleBinBlurEl.style.background = 'rgba(34, 197, 94, 0.2)';
      toggleBinBlurEl.style.borderColor = 'rgba(34, 197, 94, 0.5)';
    } else {
      toggleBinBlurEl.style.background = 'rgba(34, 197, 94, 0.1)';
      toggleBinBlurEl.style.borderColor = 'rgba(34, 197, 94, 0.3)';
    }
  }
}

function clearLogs() {
  chrome.storage.local.set({ logs: [] }, () => {
    updateLogs();
    showToast('Logs cleared', 'info');
  });
}

function updateStats() {
  chrome.storage.local.get(['successCount', 'globalRetryCount', 'bin'], (result) => {
    // Update success count
    if (successCountEl) {
      successCountEl.textContent = result.successCount || 0;
    }

    // Update retry count
    if (retryCountEl) {
      retryCountEl.textContent = result.globalRetryCount || 0;
    }

    // Update active BIN
    if (activeBinEl) {
      const bin = result.bin || 'Not set';
      activeBinEl.textContent = binBlurred ? '••••••' : bin;
      activeBinEl.setAttribute('data-original-bin', bin);
    }
  });
}

function updateLogs() {
  chrome.storage.local.get(['logs'], (result) => {
    const logs = result.logs || [];

    const lines = logs.slice(-200).map((l) => {
      if (l.type === 'card_injected') return `Stripe bypass: ${l.card} (gen)`;
      if (l.type === 'payment_declined') return `Card Declined: ${l.code}`;
      if (l.type === 'declined') return `Card Declined: ${l.code}`;
      if (l.type === 'hit_detected') return `✅ 𝐇𝐈𝐓 𝐃𝐄𝐓𝐄𝐂𝐓𝐄𝐃 - ${l.card}`;
      if (l.type === 'retry') return `Retry #${l.count}`;
      if (l.type === 'error') return `Error: ${l.message}`;
      return `${l.type}`;
    });

    // Add spacing between attempt/decline pairs
    const formattedLines = [];
    for (let i = 0; i < lines.length; i++) {
      formattedLines.push(lines[i]);

      // Add empty line after each decline message (except for the last one)
      if ((lines[i].includes('Card Declined:') || lines[i].includes('✅ 𝐇𝐈𝐓 𝐃𝐄𝐓𝐄𝐂𝐓𝐄𝐃')) && i < lines.length - 1) {
        formattedLines.push('');
      }
    }

    // Add welcome message at the beginning
    const allLines = ['Welcome to Ashes Bypasser!', ...formattedLines];

    if (logsEl) {
      logsEl.innerHTML = allLines.map(line => {
        let className = 'log-entry';
        if (line.includes('✅')) className += ' log-success';
        else if (line.includes('Error:')) className += ' log-error';
        else if (line.includes('Stripe bypass:')) className += ' log-info';
        else if (line.includes('Card Declined:')) className += ' log-warning';

        return `<p class="${className}">${line}</p>`;
      }).join('');

      // Only auto-scroll if user is near the bottom (within 100px)
      const isNearBottom = logsEl.scrollHeight - logsEl.scrollTop - logsEl.clientHeight < 100;
      if (isNearBottom) {
        logsEl.scrollTop = logsEl.scrollHeight;
      }
    }
  });
}

function showToast(message, type = 'info') {
  // Create toast element
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${type === 'success' ? '#22c55e' : type === 'error' ? '#ef4444' : '#3b82f6'};
    color: white;
    padding: 0.75rem 1rem;
    border-radius: 0.5rem;
    z-index: 10000;
    font-size: 0.875rem;
    font-weight: 500;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    transform: translateX(100%);
    transition: transform 0.3s ease;
  `;
  toast.textContent = message;

  document.body.appendChild(toast);

  // Animate in
  setTimeout(() => {
    toast.style.transform = 'translateX(0)';
  }, 100);

  // Remove after 3 seconds
  setTimeout(() => {
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }, 3000);
}

// Settings dialog
function showSettingsDialog() {
  chrome.storage.local.get(['hitSoundEnabled', 'removePaymentAgentEnabled', 'settings'], (result) => {
    const hitSoundEnabled = result.hitSoundEnabled !== false; // Default to true
    const removePaymentAgentEnabled = result.removePaymentAgentEnabled === true;
    const settings = result.settings || {};
    const currentToken = settings.telegramToken || '';
    const currentChatId = settings.telegramChatId || '';

    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.8);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
    `;

    modal.innerHTML = `
      <div style="background: #1a1a1a; padding: 2rem; border-radius: 1rem; max-width: 500px; width: 90%; border: 1px solid #333;">
        <h2 style="color: #fff; margin-bottom: 1.5rem; font-size: 1.25rem;">Settings</h2>

        <div style="margin-bottom: 1.5rem;">
          <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.75rem; background: #2a2a2a; border: 1px solid #444; border-radius: 0.5rem;">
            <div>
              <label style="display: block; color: #ccc; margin-bottom: 0.25rem; font-size: 0.875rem; font-weight: 500;">Remove payment agent</label>
              <span style="color: #a1a1aa; font-size: 0.75rem;">Hide Link/Express elements (auto-enabled on mobile)</span>
            </div>
            <div class="toggle-switch" id="removePaymentAgentToggle" style="width: 3rem; height: 1.5rem; background: ${removePaymentAgentEnabled ? '#22c55e' : '#444'}; border-radius: 1rem; position: relative; cursor: pointer; transition: all 0.3s ease;">
              <div style="position: absolute; top: 2px; ${removePaymentAgentEnabled ? 'left: 1.5rem;' : 'left: 2px;'} width: 1.25rem; height: 1.25rem; background: #fff; border-radius: 50%; transition: all 0.3s ease;"></div>
            </div>
          </div>
        </div>

        <div style="margin-bottom: 1.5rem; padding: 0.75rem; background: #1e3a8a; border: 1px solid #3b82f6; border-radius: 0.5rem;">
          <div style="display: flex; align-items: center; margin-bottom: 0.5rem;">
            <svg style="width: 16px; height: 16px; color: #60a5fa; margin-right: 0.5rem;" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
            <span style="color: #60a5fa; font-size: 0.875rem; font-weight: 500;">Mobile Compatibility</span>
          </div>
          <p style="color: #93c5fd; font-size: 0.75rem; margin: 0; line-height: 1.4;">
            On mobile browsers (Kiwi, Quetta), "Remove payment agent" defaults to ON to prevent Stripe tokenization errors. You can still toggle it OFF if needed, but this may cause errors on some mobile sites.
          </p>
        </div>

        <div style="margin-bottom: 1rem;">
          <label style="display: block; color: #ccc; margin-bottom: 0.5rem; font-size: 0.875rem;">Telegram Bot Token</label>
          <input type="text" id="telegramToken" value="${currentToken}" placeholder="Enter bot token" style="width: 100%; padding: 0.5rem; background: #2a2a2a; border: 1px solid #444; border-radius: 0.5rem; color: #fff;">
        </div>

        <div style="margin-bottom: 1rem;">
          <label style="display: block; color: #ccc; margin-bottom: 0.5rem; font-size: 0.875rem;">Telegram Chat ID</label>
          <input type="text" id="telegramChatId" value="${currentChatId}" placeholder="Enter your chat ID" style="width: 100%; padding: 0.5rem; background: #2a2a2a; border: 1px solid #444; border-radius: 0.5rem; color: #fff;">
        </div>

        <div style="margin-bottom: 1.5rem;">
          <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.75rem; background: #2a2a2a; border: 1px solid #444; border-radius: 0.5rem;">
            <div>
              <label style="display: block; color: #ccc; margin-bottom: 0.25rem; font-size: 0.875rem; font-weight: 500;">Hit Sound</label>
              <span style="color: #a1a1aa; font-size: 0.75rem;">Play sound when hit is detected</span>
            </div>
            <div class="toggle-switch" id="hitSoundToggle" style="width: 3rem; height: 1.5rem; background: ${hitSoundEnabled ? '#22c55e' : '#444'}; border-radius: 1rem; position: relative; cursor: pointer; transition: all 0.3s ease;">
              <div style="position: absolute; top: 2px; ${hitSoundEnabled ? 'left: 1.5rem;' : 'left: 2px;'} width: 1.25rem; height: 1.25rem; background: #fff; border-radius: 50%; transition: all 0.3s ease;"></div>
            </div>
          </div>
        </div>

        <div style="display: flex; gap: 1rem; justify-content: flex-end;">
          <button id="cancelSettings" style="background: #444; color: white; border: none; padding: 0.5rem 1rem; border-radius: 0.5rem; cursor: pointer;">Cancel</button>
          <button id="saveSettings" style="background: #22c55e; color: white; border: none; padding: 0.5rem 1rem; border-radius: 0.5rem; cursor: pointer;">Save</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Event listeners
    document.getElementById('cancelSettings').onclick = () => {
      document.body.removeChild(modal);
    };

    // Toggles functionality
    const hitSoundToggle = document.getElementById('hitSoundToggle');
    let hitSoundState = hitSoundEnabled;
    const removePaymentAgentToggle = document.getElementById('removePaymentAgentToggle');
    let removePaymentAgentState = removePaymentAgentEnabled;

    hitSoundToggle.onclick = () => {
      hitSoundState = !hitSoundState;
      hitSoundToggle.style.background = hitSoundState ? '#22c55e' : '#444';
      const toggleCircle = hitSoundToggle.querySelector('div');
      toggleCircle.style.left = hitSoundState ? '1.5rem' : '2px';
    };

    removePaymentAgentToggle.onclick = () => {
      removePaymentAgentState = !removePaymentAgentState;
      removePaymentAgentToggle.style.background = removePaymentAgentState ? '#22c55e' : '#444';
      const toggleCircle = removePaymentAgentToggle.querySelector('div');
      toggleCircle.style.left = removePaymentAgentState ? '1.5rem' : '2px';
    };

    document.getElementById('saveSettings').onclick = () => {
      const token = document.getElementById('telegramToken').value;
      const chatId = document.getElementById('telegramChatId').value;

      chrome.storage.local.get(['settings'], (result) => {
        const currentSettings = result.settings || {};
        const updatedSettings = {
          ...currentSettings,
          telegramToken: token,
          telegramChatId: chatId
        };

        chrome.storage.local.set({
          hitSoundEnabled: hitSoundState,
          removePaymentAgentEnabled: removePaymentAgentState,
          settings: updatedSettings
        }, () => {
          console.log('Settings saved:', { hitSoundEnabled: hitSoundState, removePaymentAgentEnabled: removePaymentAgentState, settings: updatedSettings });
          chrome.runtime.sendMessage({ type: 'settings_updated' });
          showToast('Settings saved!', 'success');
          document.body.removeChild(modal);
        });
      });
    };
  });
}

// Settings button click handler
function setupSettingsButton() {
  const settingsButton = document.getElementById('settingsButton');
  if (settingsButton) {
    settingsButton.addEventListener('click', showSettingsDialog);
  }
}

function resetStats() {
  chrome.runtime.sendMessage({ type: 'reset_stats' }, () => {
    showToast('Stats reset', 'info');
  });
}