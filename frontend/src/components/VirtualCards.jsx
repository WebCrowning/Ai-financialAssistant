import React, { useEffect, useRef, useState, useMemo } from 'react';
import { supabase } from '../supabaseClient';
const creditCardIcon = '/images/credit-card.png';



// ─── Colors ────────────────────────────────────────────────────────────────────
const COLORS = {
  primary: '#2563eb',
  primaryLight: '#dbeafe',
  secondary: '#7c3aed',
  success: '#059669',
  successLight: '#d1fae5',
  danger: '#dc2626',
  dangerLight: '#fee2e2',
  warning: '#d97706',
  warningLight: '#fef3c7',
  gray: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a'
  },
  white: '#ffffff',
  cardGradients: [
    'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
    'linear-gradient(135deg, #2d1b69 0%, #1a1a2e 50%, #4a1942 100%)',
    'linear-gradient(135deg, #0c0c0c 0%, #1a1a1a 50%, #2d2d2d 100%)',
    'linear-gradient(135deg, #0a1628 0%, #1a365d 50%, #2c5282 100%)',
    'linear-gradient(135deg, #1a1a2e 0%, #4a1942 50%, #1a1a2e 100%)'
  ]
};

// ─── SVG Components for realistic card elements ────────────────────────────────

function EMVChip({ size = 46 }) {
  return (
    <svg width={size} height={size * 0.76} viewBox="0 0 46 35" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="0.5" y="0.5" width="45" height="34" rx="5" fill="url(#chipGold)" stroke="url(#chipBorder)" strokeWidth="0.8" />
      {/* Chip contact pads */}
      <line x1="0" y1="12" x2="46" y2="12" stroke="#b8860d" strokeWidth="0.5" opacity="0.5" />
      <line x1="0" y1="23" x2="46" y2="23" stroke="#b8860d" strokeWidth="0.5" opacity="0.5" />
      <line x1="15" y1="0" x2="15" y2="35" stroke="#b8860d" strokeWidth="0.5" opacity="0.5" />
      <line x1="31" y1="0" x2="31" y2="35" stroke="#b8860d" strokeWidth="0.5" opacity="0.5" />
      {/* Center circle detail */}
      <circle cx="23" cy="17.5" r="5" fill="none" stroke="#b8860d" strokeWidth="0.5" opacity="0.4" />
      <circle cx="23" cy="17.5" r="2.5" fill="none" stroke="#b8860d" strokeWidth="0.4" opacity="0.3" />
      <defs>
        <linearGradient id="chipGold" x1="0" y1="0" x2="46" y2="35" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#e8d5a3" />
          <stop offset="0.25" stopColor="#f0e6c8" />
          <stop offset="0.5" stopColor="#c9a84c" />
          <stop offset="0.75" stopColor="#f0e6c8" />
          <stop offset="1" stopColor="#d4b96e" />
        </linearGradient>
        <linearGradient id="chipBorder" x1="0" y1="0" x2="46" y2="35" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#b8960d" />
          <stop offset="1" stopColor="#d4aa40" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function ContactlessIcon({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ transform: 'rotate(90deg)' }}>
      <path d="M12 2C10.34 2 9 3.34 9 5C9 6.66 10.34 8 12 8" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <path d="M12 0C9.24 0 7 2.24 7 5C7 7.76 9.24 10 12 10" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <path d="M12 -2C8.13 -2 5 1.13 5 5C5 8.87 8.13 12 12 12" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <path d="M12 -4C7.03 -4 3 0.03 3 5C3 9.97 7.03 14 12 14" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    </svg>
  );
}

function VisaLogo({ width = 70 }) {
  return (
    <svg width={width} height={width * 0.33} viewBox="0 0 780 260" xmlns="http://www.w3.org/2000/svg">
      <path d="M293.2 4.2L224.9 255.8H168.1L236.4 4.2H293.2Z" fill="white" />
      <path d="M524.8 8.4C513.4 4.2 495 0 473.2 0C416.4 0 375.6 30.8 375.2 75C374.8 108.4 405.6 126.8 429 137.6C453 148.6 461.4 155.6 461.2 165.4C461 180.2 443 187 426.2 187C403.4 187 391.2 183.8 372.6 175.4L364.6 171.6L356 225.4C369.6 231.6 394.4 237 420.2 237.2C480.6 237.2 520.6 206.8 521.2 160C521.6 133.4 504.4 113.2 467.8 96.8C446.2 86.4 432.8 79.6 433 69C433 59.6 443.8 49.6 467.4 49.6C487 49.2 501.4 53.2 512.6 57.4L518 59.6L526.4 8.4H524.8Z" fill="white" />
      <path d="M614 4.2C599.8 4.2 589.2 8.6 583 23L501.2 255.8H561.4L573.4 221.4H647L654 255.8H708L660.8 4.2H614ZM590.2 177.6C594.4 166.8 614.4 112.6 614.4 112.6C614 113.2 618.6 101 621.2 93.6L624.8 110.8C624.8 110.8 636.8 166.6 639.4 177.6H590.2Z" fill="white" />
      <path d="M155.6 4.2L99.2 175.6L93.2 144.6C82.8 109 49.6 70.6 12.8 51.2L64.8 255.6H125.4L216.8 4.2H155.6Z" fill="white" />
      <path d="M79.6 4.2H0.8L0 8.4C71.6 26 119 69.2 138.6 121.4L118.6 23.4C115.2 9.2 105 4.6 92 4.2H79.6Z" fill="rgba(255,255,255,0.85)" />
    </svg>
  );
}

function MastercardLogo({ width = 55 }) {
  return (
    <svg width={width} height={width * 0.62} viewBox="0 0 152 108" xmlns="http://www.w3.org/2000/svg">
      <circle cx="52" cy="54" r="48" fill="#EB001B" opacity="0.9" />
      <circle cx="100" cy="54" r="48" fill="#F79E1B" opacity="0.9" />
      <path d="M76 18.7C85.1 26.3 91 37.6 91 50.3C91 63 85.1 74.3 76 81.9C66.9 74.3 61 63 61 50.3C61 37.6 66.9 26.3 76 18.7Z" fill="#FF5F00" opacity="0.9" />
    </svg>
  );
}

function AmexLogo({ width = 55 }) {
  return (
    <svg width={width} height={width * 0.5} viewBox="0 0 120 60" xmlns="http://www.w3.org/2000/svg">
      <text x="60" y="38" textAnchor="middle" fontFamily="'Arial Black', 'Arial', sans-serif" fontSize="22" fontWeight="900" fill="white" letterSpacing="1">AMEX</text>
    </svg>
  );
}

function DiscoverLogo({ width = 70 }) {
  return (
    <svg width={width} height={width * 0.4} viewBox="0 0 140 55" xmlns="http://www.w3.org/2000/svg">
      <text x="70" y="35" textAnchor="middle" fontFamily="'Arial', sans-serif" fontSize="19" fontWeight="700" fill="white" letterSpacing="2">DISCOVER</text>
      <circle cx="105" cy="28" r="14" fill="#F76B1C" opacity="0.8" />
    </svg>
  );
}

function CardNetworkLogo({ type, width }) {
  switch (type) {
    case 'mastercard': return <MastercardLogo width={width || 50} />;
    case 'amex': return <AmexLogo width={width || 55} />;
    case 'discover': return <DiscoverLogo width={width || 65} />;
    case 'visa':
    default: return <VisaLogo width={width || 65} />;
  }
}

// ─── Utility functions ─────────────────────────────────────────────────────────

function formatCardNumber(cardNumber) {
  if (!cardNumber) return '•••• •••• •••• ••••';
  const digits = String(cardNumber).replace(/\D/g, '');
  // Show last 4 digits, mask rest
  const last4 = digits.slice(-4);
  return `•••• •••• •••• ${last4 || '••••'}`;
}

function formatCardNumberFull(cardNumber) {
  if (!cardNumber) return '•••• •••• •••• ••••';
  const digits = String(cardNumber).replace(/\D/g, '');
  return digits.replace(/(.{4})/g, '$1 ').trim();
}

function makeExpiryDate() {
  const now = new Date();
  const year = now.getFullYear() + 3 + Math.floor(Math.random() * 2);
  const month = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
  return `${month}/${String(year).slice(-2)}`;
}

function makeCVV() {
  return String(Math.floor(Math.random() * 900) + 100);
}

function makeCardNumber(type) {
  const prefix = { visa: '4', mastercard: '5', amex: '3', discover: '6' };
  const start = prefix[type] || '4';
  const length = type === 'amex' ? 15 : 16;
  let num = start;
  for (let i = 1; i < length; i++) num += Math.floor(Math.random() * 10);
  return num;
}

// ─── Utility: Format currency ──────────────────────────────────────────────────
function formatCurrency(amount) {
  if (amount == null || isNaN(amount)) return 'CFA 0';
  return `CFA ${parseFloat(amount).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

// ─── Professional Billing Address Generator ────────────────────────────────────
// Generates realistic, deterministic billing addresses seeded by card ID
// so the same card always produces the same address.

const ADDRESS_DATA = {
  streets: [
    '1200 Market Street', '4500 Westheimer Road', '7890 Peachtree Boulevard',
    '2350 Michigan Avenue', '6100 Wilshire Boulevard', '3200 Pennsylvania Avenue',
    '8400 Sunset Strip', '1550 Broadway', '4200 Main Street',
    '9100 International Drive', '2700 Las Vegas Boulevard', '5300 Wisconsin Avenue',
    '3600 McKinney Avenue', '7200 Woodward Avenue', '1800 K Street NW',
    '4900 Freeport Boulevard', '6300 Fairview Road', '2100 Rosecrans Avenue',
    '8800 South Sepulveda Boulevard', '1400 Larimer Street',
    '3100 Monticello Avenue', '5500 Glades Road', '7700 Forsyth Boulevard',
    '1900 Post Oak Boulevard', '4300 La Jolla Village Drive',
    '6700 Alexander Bell Drive', '2800 North Harwood Street',
    '9300 Wilshire Center Place', '1600 Amphitheatre Parkway',
    '3400 Hillview Avenue'
  ],
  suites: [
    'Suite 100', 'Suite 200', 'Suite 305', 'Suite 410', 'Suite 500',
    'Suite 620', 'Suite 715', 'Suite 808', 'Suite 900', 'Suite 1010',
    'Suite 1105', 'Suite 1200', 'Floor 3', 'Floor 5', 'Floor 8',
    'Floor 12', 'Floor 15', 'Floor 20', 'Unit A', 'Unit B',
    'Apt 4A', 'Apt 7B', 'Apt 12C', 'Penthouse 1', 'Tower 2, Suite 300',
    'Building B, Suite 150', 'Office 240', 'Office 380', 'Office 510', 'Office 720'
  ],
  cities: [
    { city: 'New York', state: 'NY', zip: '10001' },
    { city: 'Los Angeles', state: 'CA', zip: '90001' },
    { city: 'Chicago', state: 'IL', zip: '60601' },
    { city: 'Houston', state: 'TX', zip: '77001' },
    { city: 'Phoenix', state: 'AZ', zip: '85001' },
    { city: 'Philadelphia', state: 'PA', zip: '19101' },
    { city: 'San Antonio', state: 'TX', zip: '78201' },
    { city: 'San Diego', state: 'CA', zip: '92101' },
    { city: 'Dallas', state: 'TX', zip: '75201' },
    { city: 'San Jose', state: 'CA', zip: '95101' },
    { city: 'Austin', state: 'TX', zip: '73301' },
    { city: 'Jacksonville', state: 'FL', zip: '32099' },
    { city: 'Fort Worth', state: 'TX', zip: '76101' },
    { city: 'Columbus', state: 'OH', zip: '43085' },
    { city: 'Charlotte', state: 'NC', zip: '28201' },
    { city: 'San Francisco', state: 'CA', zip: '94102' },
    { city: 'Indianapolis', state: 'IN', zip: '46201' },
    { city: 'Seattle', state: 'WA', zip: '98101' },
    { city: 'Denver', state: 'CO', zip: '80201' },
    { city: 'Washington', state: 'DC', zip: '20001' },
    { city: 'Nashville', state: 'TN', zip: '37201' },
    { city: 'Oklahoma City', state: 'OK', zip: '73101' },
    { city: 'Boston', state: 'MA', zip: '02101' },
    { city: 'Portland', state: 'OR', zip: '97201' },
    { city: 'Las Vegas', state: 'NV', zip: '89101' },
    { city: 'Memphis', state: 'TN', zip: '38101' },
    { city: 'Louisville', state: 'KY', zip: '40201' },
    { city: 'Baltimore', state: 'MD', zip: '21201' },
    { city: 'Milwaukee', state: 'WI', zip: '53201' },
    { city: 'Albuquerque', state: 'NM', zip: '87101' }
  ]
};

function seededRandom(seed) {
  // Simple deterministic hash from a numeric/string seed
  let h = 0;
  const s = String(seed);
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  // Return a pseudo-random float [0, 1)
  return Math.abs(h % 10000) / 10000;
}

function generateBillingAddress(cardId, holderName) {
  const seed1 = seededRandom(cardId);
  const seed2 = seededRandom(cardId + '_suite');
  const seed3 = seededRandom(cardId + '_city');
  const seed4 = seededRandom(cardId + '_zip');

  const street = ADDRESS_DATA.streets[Math.floor(seed1 * ADDRESS_DATA.streets.length)];
  const suite = ADDRESS_DATA.suites[Math.floor(seed2 * ADDRESS_DATA.suites.length)];
  const location = ADDRESS_DATA.cities[Math.floor(seed3 * ADDRESS_DATA.cities.length)];

  // Generate a realistic ZIP+4 extension
  const zipExt = String(Math.floor(seed4 * 9000) + 1000);
  const fullZip = `${location.zip}-${zipExt}`;

  return {
    name: holderName,
    street: street,
    suite: suite,
    city: location.city,
    state: location.state,
    zip: fullZip,
    country: 'United States',
    formatted: `${holderName}\n${street}, ${suite}\n${location.city}, ${location.state} ${fullZip}\nUnited States`
  };
}

// ─── Realistic Card Component ──────────────────────────────────────────────────

function RealisticCard({ card, userDisplayName, gradient, isFrozen, showFull, isFlipped, onFlip, size = 'normal' }) {
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
  const cardRef = useRef(null);

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMousePos({ x, y });
  };

  const handleMouseLeave = () => {
    setMousePos({ x: 50, y: 50 });
  };

  const isSmall = size === 'small';
  const cardWidth = isSmall ? 340 : 420;
  const cardHeight = cardWidth / 1.586; // Standard credit card ratio

  const holderName = card.card_holder || userDisplayName || 'CARD HOLDER';
  const expiry = card.expiry_date || '12/28';
  const cardNum = showFull ? formatCardNumberFull(card.card_number) : formatCardNumber(card.card_number);
  const cardType = card.card_type || 'visa';

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onFlip}
      className="realistic-card"
      style={{
        width: cardWidth,
        height: cardHeight,
        maxWidth: '100%',
        borderRadius: isSmall ? 14 : 18,
        position: 'relative',
        overflow: 'hidden',
        background: gradient,
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.1) inset',
        cursor: onFlip ? 'pointer' : 'default',
        transition: 'transform 0.4s cubic-bezier(0.23, 1, 0.32, 1), box-shadow 0.4s ease',
        filter: isFrozen ? 'grayscale(0.5) brightness(0.7)' : 'none',
        fontFamily: "'Inter', 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        userSelect: 'none',
        perspective: '1000px',
        transformStyle: 'preserve-3d',
      }}
    >
      {/* ── Holographic shimmer overlay ─── */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: `radial-gradient(circle at ${mousePos.x}% ${mousePos.y}%, rgba(255,255,255,0.15) 0%, transparent 50%)`,
        pointerEvents: 'none',
        transition: 'background 0.1s ease',
        zIndex: 2,
      }} />

      {/* ── Subtle pattern overlay ─── */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `
          repeating-linear-gradient(
            45deg,
            transparent,
            transparent 35px,
            rgba(255,255,255,0.015) 35px,
            rgba(255,255,255,0.015) 70px
          )
        `,
        pointerEvents: 'none',
        zIndex: 1,
      }} />

      {/* ── Top-right glow accent ─── */}
      <div style={{
        position: 'absolute',
        top: '-30%',
        right: '-20%',
        width: '60%',
        height: '80%',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 70%)',
        pointerEvents: 'none',
        zIndex: 1,
      }} />

      {!isFlipped ? (
        /* ── FRONT OF CARD ─── */
        <div style={{
          position: 'relative',
          zIndex: 3,
          padding: isSmall ? '18px 20px' : '24px 28px',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          boxSizing: 'border-box',
        }}>
          {/* Top row: Bank name / Contactless */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
          }}>
            <div style={{
              fontSize: isSmall ? 11 : 13,
              fontWeight: 600,
              color: 'rgba(255,255,255,0.6)',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}>
              {card.card_name || 'Virtual Card'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: isSmall ? 10 : 14 }}>
              {/* Balance/Amount display */}
              <div style={{
                fontSize: isSmall ? 13 : 16,
                fontWeight: 800,
                color: 'rgba(255,255,255,0.95)',
                textShadow: '0 1px 4px rgba(0,0,0,0.4)',
                letterSpacing: '0.02em',
                background: 'rgba(255,255,255,0.1)',
                padding: `${isSmall ? 3 : 4}px ${isSmall ? 8 : 12}px`,
                borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.12)',
                backdropFilter: 'blur(4px)',
              }}>
                {formatCurrency(card.spending_limit || card.balance || 0)}
              </div>
              <ContactlessIcon size={isSmall ? 20 : 24} />
            </div>
          </div>

          {/* Chip + Card Number */}
          <div>
            <div style={{ marginBottom: isSmall ? 12 : 18 }}>
              <EMVChip size={isSmall ? 38 : 46} />
            </div>
            <div style={{
              fontFamily: "'OCR A Std', 'Courier New', 'Consolas', monospace",
              fontSize: isSmall ? 17 : 22,
              fontWeight: 500,
              letterSpacing: '0.15em',
              color: 'rgba(255,255,255,0.92)',
              textShadow: '0 1px 3px rgba(0,0,0,0.3)',
            }}>
              {cardNum}
            </div>
          </div>

          {/* Bottom row: Holder / Expiry / Logo */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
          }}>
            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: isSmall ? 8 : 9,
                color: 'rgba(255,255,255,0.5)',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                marginBottom: 3,
                fontWeight: 600,
              }}>
                CARD HOLDER
              </div>
              <div style={{
                fontSize: isSmall ? 12 : 14,
                fontWeight: 700,
                color: 'rgba(255,255,255,0.9)',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                maxWidth: 180,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {holderName}
              </div>
            </div>

            <div style={{ textAlign: 'center', marginRight: isSmall ? 20 : 30 }}>
              <div style={{
                fontSize: isSmall ? 8 : 9,
                color: 'rgba(255,255,255,0.5)',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                marginBottom: 3,
                fontWeight: 600,
              }}>
                VALID THRU
              </div>
              <div style={{
                fontSize: isSmall ? 13 : 15,
                fontWeight: 700,
                color: 'rgba(255,255,255,0.9)',
                letterSpacing: '0.06em',
                fontFamily: "'OCR A Std', 'Courier New', 'Consolas', monospace",
              }}>
                {expiry}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <CardNetworkLogo type={cardType} width={isSmall ? 50 : 60} />
            </div>
          </div>

          {/* Frozen overlay */}
          {isFrozen && (
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0,0,0,0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 'inherit',
              zIndex: 10,
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                background: 'rgba(255,255,255,0.15)',
                backdropFilter: 'blur(4px)',
                padding: '10px 22px',
                borderRadius: 30,
                border: '1px solid rgba(255,255,255,0.2)',
              }}>
                <i className="fas fa-snowflake" style={{ color: '#93c5fd', fontSize: 18 }}></i>
                <span style={{
                  color: '#e0e7ff',
                  fontWeight: 800,
                  fontSize: 14,
                  letterSpacing: '0.12em',
                }}>FROZEN</span>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ── BACK OF CARD ─── */
        <div style={{
          position: 'relative',
          zIndex: 3,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          boxSizing: 'border-box',
        }}>
          {/* Magnetic strip */}
          <div style={{
            width: '100%',
            height: isSmall ? 38 : 48,
            background: 'linear-gradient(180deg, #1a1a1a 0%, #2a2a2a 30%, #1a1a1a 60%, #222 100%)',
            marginBottom: isSmall ? 14 : 20,
          }} />

          {/* Signature strip + CVV */}
          <div style={{
            margin: `0 ${isSmall ? 20 : 28}px`,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}>
            <div style={{
              flex: 1,
              height: isSmall ? 30 : 36,
              background: 'linear-gradient(90deg, #f5f5f0, #e8e8e0, #f0f0ea)',
              borderRadius: 4,
              display: 'flex',
              alignItems: 'center',
              paddingLeft: 12,
            }}>
              <span style={{
                fontFamily: "'Brush Script MT', cursive",
                fontSize: isSmall ? 14 : 16,
                color: '#555',
                opacity: 0.6,
              }}>
                {holderName}
              </span>
            </div>
            <div style={{
              background: 'white',
              padding: `${isSmall ? 6 : 8}px ${isSmall ? 10 : 14}px`,
              borderRadius: 4,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              minWidth: isSmall ? 52 : 60,
            }}>
              <span style={{
                fontSize: 8,
                color: '#888',
                fontWeight: 700,
                letterSpacing: '0.1em',
              }}>CVV</span>
              <span style={{
                fontFamily: "'Courier New', monospace",
                fontSize: isSmall ? 15 : 18,
                fontWeight: 800,
                color: '#111',
              }}>{card.cvv || '•••'}</span>
            </div>
          </div>

          {/* Bottom info */}
          <div style={{
            margin: `${isSmall ? 14 : 20}px ${isSmall ? 20 : 28}px 0`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
          }}>
            <div style={{
              fontSize: isSmall ? 8 : 9,
              color: 'rgba(255,255,255,0.4)',
              lineHeight: 1.5,
              maxWidth: '60%',
            }}>
              This card is property of {card.card_name || 'issuing bank'}. Unauthorized use is prohibited. If found, please return to nearest branch.
            </div>
            <CardNetworkLogo type={cardType} width={isSmall ? 40 : 50} />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function VirtualCards({ token, user }) {
  const [cards, setCards] = useState([]);
  const [primaryCardId, setPrimaryCardId] = useState(null);
  const [loading, setLoading] = useState(true);

  const [showCreateCard, setShowCreateCard] = useState(false);
  const [creatingCard, setCreatingCard] = useState(false);

  const [newCard, setNewCard] = useState({
    cardName: '',
    cardType: 'visa',
    spendingLimit: 5000,
    cardColor: 0
  });

  const [alertMsg, setAlertMsg] = useState(null);
  const [alertType, setAlertType] = useState('success');

  const [selectedCard, setSelectedCard] = useState(null);
  const [showCardDetails, setShowCardDetails] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);

  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');

  const cardNumberRef = useRef(null);

  // Fetch real user profile for display_name
  const [userProfile, setUserProfile] = useState(null);

  // Prefer the user prop / localStorage for display name.
  // (Avoid /api/* calls; Supabase direct usage.)
  useEffect(() => {
    try {
      const storedUser = JSON.parse(localStorage.getItem('user') || 'null');
      if (storedUser) setUserProfile(storedUser);
    } catch {
      // ignore
    }
  }, [token]);

  const resolvedUser = userProfile || user;
  const userDisplayName = resolvedUser
    ? resolvedUser.display_name || resolvedUser.email?.split('@')[0] || 'User'
    : 'User';

  // Billing address from profile or defaults
  const billingAddress = resolvedUser?.billing_address || `${userDisplayName}\nFinVision Account Holder\n${resolvedUser?.email || ''}`;

  const showAlert = (message, type = 'success') => {
    setAlertMsg(message);
    setAlertType(type);
    window.setTimeout(() => setAlertMsg(null), 5000);
  };

  const fetchCards = async () => {
    try {
      setLoading(true);

      const resolvedUserId =
        user?.id ||
        localStorage.getItem('userId') ||
        localStorage.getItem('user_id') ||
        JSON.parse(localStorage.getItem('user') || 'null')?.id;

      if (!resolvedUserId) {
        showAlert('User not authenticated', 'error');
        return;
      }

      const { data, error } = await supabase
        .from('virtual_cards')
        .select('*')
        .eq('user_id', resolvedUserId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCards(data || []);
    } catch (e) {
      console.error('Error fetching cards:', e);
      showAlert('Failed to load cards', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCards();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const getCardHolderName = () => {
    if (resolvedUser) return resolvedUser.display_name || resolvedUser.email?.split('@')[0] || 'Card Holder';
    return 'Card Holder';
  };

  const handleCreateCard = async (e) => {
    e.preventDefault();

    if (!newCard.cardName.trim()) return showAlert('Please enter a card name', 'error');

    const resolvedUserId =
      user?.id ||
      localStorage.getItem('userId') ||
      localStorage.getItem('user_id') ||
      JSON.parse(localStorage.getItem('user') || 'null')?.id;

    if (!resolvedUserId) return showAlert('User not authenticated', 'error');

    setCreatingCard(true);
    try {
      const payload = {
        user_id: resolvedUserId,
        card_name: newCard.cardName,
        card_type: newCard.cardType,
        card_number: makeCardNumber(newCard.cardType),
        expiry_date: makeExpiryDate(),
        cvv: makeCVV(),
        card_holder: getCardHolderName(),
        spending_limit: newCard.spendingLimit,
        card_color: newCard.cardColor,
        status: 'active',
      };

      const { data, error } = await supabase
        .from('virtual_cards')
        .insert(payload)
        .select('*')
        .single();

      if (error) throw error;

      setCards((prev) => [data, ...prev]);
      showAlert(`Virtual card created successfully for ${getCardHolderName()}`);
      setShowCreateCard(false);
      setNewCard({ cardName: '', cardType: 'visa', spendingLimit: 5000, cardColor: 0 });
    } catch (err) {
      console.error('Error creating card:', err);
      showAlert('Failed to create card', 'error');
    } finally {
      setCreatingCard(false);
    }
  };

  const handleDeleteCard = async (id) => {
    if (!window.confirm('Are you sure you want to delete this virtual card?')) return;

    try {
      const { error } = await supabase
        .from('virtual_cards')
        .delete()
        .eq('id', id);

      if (error) throw error;

      showAlert('Card deleted successfully');
      setCards((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      console.error('Error deleting card:', err);
      showAlert('Failed to delete card', 'error');
    }
  };

  const handleToggleCardStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'frozen' : 'active';

    try {
      const { error } = await supabase
        .from('virtual_cards')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;

      setCards((prev) => prev.map((card) => (card.id === id ? { ...card, status: newStatus } : card)));
      showAlert(`Card ${newStatus === 'active' ? 'activated' : 'frozen'} successfully`);
    } catch (err) {
      console.error('Error toggling card status:', err);
      showAlert('Failed to update card status', 'error');
    }
  };

  const handleMakePrimary = async (id) => {
    try {
      const resolvedUserId =
        user?.id ||
        localStorage.getItem('userId') ||
        localStorage.getItem('user_id') ||
        JSON.parse(localStorage.getItem('user') || 'null')?.id;

      if (!resolvedUserId) throw new Error('User not authenticated');

      const { error: clearErr } = await supabase
        .from('virtual_cards')
        .update({ is_primary: false })
        .eq('user_id', resolvedUserId);

      if (clearErr) throw clearErr;

      const { error: setErr } = await supabase
        .from('virtual_cards')
        .update({ is_primary: true })
        .eq('id', id);

      if (setErr) throw setErr;

      showAlert('Primary virtual card updated');
      await fetchCards();
    } catch (err) {
      console.error('Error setting primary card:', err);
      showAlert('Failed to set primary virtual card', 'error');
    }
  };


  const viewCardDetails = (card) => {
    setSelectedCard(card);
    setCardNumber(card.card_number || '');
    setExpiryDate(card.expiry_date || '');
    setCvv(card.cvv || '');
    setShowCardDetails(true);
    setIsFlipped(false);
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingCardIcon}>
          <EMVChip size={50} />
        </div>
        <div style={styles.loadingSpinner}></div>
        <p style={styles.loadingText}>Loading your virtual cards...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.headerIconWrapper}>
            <img src={creditCardIcon} alt="Credit card" style={{ width: 28, height: 28, objectFit: 'contain' }} />
          </div>

          <div>
            <h1 style={styles.title}>Virtual Cards</h1>
            <p style={styles.subtitle}>
              <i className="fas fa-user" style={{ marginRight: '6px' }}></i>
              {userDisplayName}'s Virtual Cards - Secure online payments
            </p>
          </div>
        </div>

        <div style={styles.headerRight}>
          <button onClick={fetchCards} style={styles.refreshBtn} title="Refresh cards">
            <i className="fas fa-sync-alt"></i>
          </button>
          <button onClick={() => setShowCreateCard(!showCreateCard)} style={styles.addBtn}>
            <i className="fas fa-plus"></i>
            {showCreateCard ? 'Close' : 'Create Card'}
          </button>
        </div>
      </header>

      <div style={styles.userBanner}>
        <div style={styles.userBannerContent}>
          <i className="fas fa-user-circle" style={{ fontSize: '24px', color: COLORS.primary }}></i>
          <div>
            <span style={styles.userBannerLabel}>Cards issued to:</span>
            <span style={styles.userBannerName}>{userDisplayName}</span>
            <span style={styles.userBannerEmail}>{user?.email}</span>
          </div>
        </div>
        <div style={styles.userBannerStats}>
          <span style={styles.userBannerStat}>
            <i className="fas fa-credit-card"></i>
            {cards.length} Cards
          </span>
          <span style={styles.userBannerStat}>
            <i className="fas fa-check-circle"></i>
            {cards.filter((c) => c.status === 'active').length} Active
          </span>
        </div>
      </div>

      {alertMsg && (
        <div
          style={{
            ...styles.alert,
            ...(alertType === 'success' ? styles.alertSuccess : styles.alertError)
          }}
        >
          <i className={`fas ${alertType === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}`}></i>
          <span>{alertMsg}</span>
          <button onClick={() => setAlertMsg(null)} style={styles.alertClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>
      )}

      {showCreateCard && (
        <div style={styles.formContainer}>
          <h2 style={styles.formTitle}>
            <i className="fas fa-plus-circle" style={{ color: COLORS.primary, marginRight: '8px' }}></i>
            Create Virtual Card for {userDisplayName}
          </h2>

          <div style={styles.formLayout}>
            {/* Live card preview */}
            <div style={styles.previewArea}>
              <div style={styles.previewLabel}>Card Preview</div>
              <RealisticCard
                card={{
                  card_name: newCard.cardName || 'Your Card Name',
                  card_type: newCard.cardType,
                  card_number: '4000123456789012',
                  expiry_date: '12/28',
                  cvv: '123',
                  card_holder: getCardHolderName(),
                  status: 'active',
                }}
                userDisplayName={userDisplayName}
                gradient={COLORS.cardGradients[newCard.cardColor]}
                isFrozen={false}
                showFull={false}
                isFlipped={false}
                size="small"
              />
            </div>

            <form onSubmit={handleCreateCard} style={styles.form}>
              <div style={styles.formGrid}>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Card Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Shopping Card"
                    value={newCard.cardName}
                    onChange={(e) => setNewCard({ ...newCard, cardName: e.target.value })}
                    required
                    style={styles.formInput}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Card Type</label>
                  <select
                    value={newCard.cardType}
                    onChange={(e) => setNewCard({ ...newCard, cardType: e.target.value })}
                    style={styles.formSelect}
                  >
                    <option value="visa">Visa</option>
                    <option value="mastercard">Mastercard</option>
                    <option value="amex">American Express</option>
                    <option value="discover">Discover</option>
                  </select>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Spending Limit (CFA)</label>
                  <input
                    type="number"
                    value={newCard.spendingLimit}
                    onChange={(e) => setNewCard({ ...newCard, spendingLimit: parseFloat(e.target.value) })}
                    required
                    min="100"
                    step="100"
                    style={styles.formInput}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Card Design</label>
                  <div style={styles.colorSelector}>
                    {COLORS.cardGradients.map((gradient, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => setNewCard({ ...newCard, cardColor: index })}
                        style={{
                          ...styles.colorOption,
                          background: gradient,
                          border: newCard.cardColor === index ? `3px solid ${COLORS.primary}` : '3px solid transparent',
                          transform: newCard.cardColor === index ? 'scale(1.15)' : 'scale(1)',
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div style={styles.cardHolderInfo}>
                <i className="fas fa-user" style={{ color: COLORS.primary }}></i>
                <span>
                  Card will be issued to: <strong>{userDisplayName}</strong>
                </span>
              </div>

              <div style={styles.formActions}>
                <button type="button" onClick={() => setShowCreateCard(false)} style={styles.formCancel}>
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingCard}
                  style={{
                    ...styles.formSubmit,
                    opacity: creatingCard ? 0.7 : 1,
                    cursor: creatingCard ? 'not-allowed' : 'pointer'
                  }}
                >
                  {creatingCard ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i>
                      Creating...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-credit-card"></i>
                      Create Card for {userDisplayName}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {cards.length === 0 ? (
        <div style={styles.emptyState}>
          <div style={styles.emptyStateIcon}>
            <EMVChip size={64} />
          </div>
          <p style={styles.emptyStateText}>No virtual cards yet</p>
          <span style={styles.emptyStateSub}>Create your first virtual card for {userDisplayName}</span>
          <button
            onClick={() => setShowCreateCard(true)}
            style={styles.emptyStateBtn}
          >
            <i className="fas fa-plus"></i> Create Your First Card
          </button>
        </div>
      ) : (
        <div style={styles.cardsGrid}>
          {cards.map((card, index) => (
            <div key={card.id} style={styles.cardWrapper}>
              {/* Realistic Card */}
              <div style={styles.cardContainer}>
                <RealisticCard
                  card={card}
                  userDisplayName={userDisplayName}
                  gradient={COLORS.cardGradients[card.card_color || index % COLORS.cardGradients.length]}
                  isFrozen={card.status === 'frozen'}
                  showFull={false}
                  isFlipped={false}
                  size="small"
                />
              </div>

              {/* Card info + actions bar */}
              <div style={styles.cardInfoBar}>
                <div style={styles.cardInfoLeft}>
                  <span style={styles.cardInfoName}>{card.card_name}</span>
                  <div style={styles.cardInfoMeta}>
                    <span
                      style={{
                        ...styles.statusBadge,
                        background: card.status === 'active' ? COLORS.successLight : COLORS.warningLight,
                        color: card.status === 'active' ? COLORS.success : COLORS.warning
                      }}
                    >
                      <i className={`fas fa-${card.status === 'active' ? 'check-circle' : 'snowflake'}`}></i>
                      {card.status === 'active' ? 'Active' : 'Frozen'}
                    </span>
                    <span style={styles.limitBadge}>
                      Limit: CFA {parseFloat(card.spending_limit || 5000).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div style={styles.cardActionsGroup}>
                  <button onClick={() => viewCardDetails(card)} style={styles.cardActionBtn} title="View Details">
                    <i className="fas fa-eye"></i>
                  </button>

                  <button
                    onClick={() => handleToggleCardStatus(card.id, card.status)}
                    style={{
                      ...styles.cardActionBtn,
                      color: card.status === 'active' ? COLORS.warning : COLORS.success
                    }}
                    title={card.status === 'active' ? 'Freeze Card' : 'Activate Card'}
                  >
                    <i className={`fas fa-${card.status === 'active' ? 'snowflake' : 'play'}`}></i>
                  </button>

                  <button
                    onClick={() => handleMakePrimary(card.id)}
                    style={{
                      ...styles.cardActionBtn,
                      background: card.is_primary ? 'rgba(37,99,235,0.12)' : COLORS.gray[50],
                      border: card.is_primary ? `2px solid ${COLORS.primary}` : `1px solid ${COLORS.gray[200]}`,
                      color: card.is_primary ? COLORS.primary : COLORS.gray[600],
                      width: 'auto',
                      padding: '0 12px',
                      fontWeight: 900,
                      letterSpacing: '0.02em',
                      opacity: card.is_primary ? 0.9 : 1,
                    }}
                    title={card.is_primary ? 'This card is primary' : 'Set as primary (used in store simulation)'}
                  >
                    <i className={`fas fa-${card.is_primary ? 'check-circle' : 'star'}`} style={{ marginRight: 8 }}></i>
                    {card.is_primary ? 'Primary' : 'Make Primary'}
                  </button>

                  <button
                    onClick={() => handleDeleteCard(card.id)}
                    style={{ ...styles.cardActionBtn, color: COLORS.danger }}
                    title="Delete Card"
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Card Details Modal ─── */}
      {showCardDetails && selectedCard && (
        <div style={styles.modalOverlay} onClick={() => setShowCardDetails(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>
                <i className="fas fa-credit-card" style={{ color: COLORS.primary }}></i>
                Card Details
              </h3>
              <button onClick={() => setShowCardDetails(false)} style={styles.modalClose}>
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div style={styles.modalContent}>
              {/* Interactive flip card */}
              <div style={styles.modalCardArea}>
                <RealisticCard
                  card={selectedCard}
                  userDisplayName={userDisplayName}
                  gradient={COLORS.cardGradients[selectedCard.card_color || 0]}
                  isFrozen={selectedCard.status === 'frozen'}
                  showFull={!isFlipped}
                  isFlipped={isFlipped}
                  onFlip={() => setIsFlipped(!isFlipped)}
                  size="normal"
                />
                <div style={styles.flipHint}>
                  <i className="fas fa-sync-alt" style={{ fontSize: 12, opacity: 0.6 }}></i>
                  Click card to flip
                </div>
              </div>

              {/* Card info grid */}
              <div style={styles.modalInfo}>
                <div style={styles.modalInfoItem}>
                  <span style={styles.modalInfoLabel}>Card Name</span>
                  <span style={styles.modalInfoValue}>{selectedCard.card_name}</span>
                </div>
                <div style={styles.modalInfoItem}>
                  <span style={styles.modalInfoLabel}>Card Type</span>
                  <span style={styles.modalInfoValue}>{selectedCard.card_type?.toUpperCase()}</span>
                </div>
                <div style={styles.modalInfoItem}>
                  <span style={styles.modalInfoLabel}>Card Holder</span>
                  <span style={styles.modalInfoValue}>{selectedCard.card_holder || userDisplayName}</span>
                </div>
                <div style={styles.modalInfoItem}>
                  <span style={styles.modalInfoLabel}>Balance / Limit</span>
                  <span style={{ ...styles.modalInfoValue, color: COLORS.primary, fontSize: 16 }}>
                    CFA {parseFloat(selectedCard.spending_limit || 0).toLocaleString()}
                  </span>
                </div>
                <div style={styles.modalInfoItem}>
                  <span style={styles.modalInfoLabel}>Status</span>
                  <span
                    style={{
                      ...styles.modalInfoValue,
                      color: selectedCard.status === 'active' ? COLORS.success : COLORS.warning
                    }}
                  >
                    {selectedCard.status === 'active' ? '● Active' : '● Frozen'}
                  </span>
                </div>
                <div style={styles.modalInfoItem}>
                  <span style={styles.modalInfoLabel}>Created</span>
                  <span style={styles.modalInfoValue}>
                    {selectedCard.created_at ? new Date(selectedCard.created_at).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </div>

              {/* Billing Address Section */}
              {(() => {
                const addr = generateBillingAddress(
                  selectedCard.id || 0,
                  selectedCard.card_holder || userDisplayName
                );
                return (
                  <div style={styles.billingAddressSection}>
                    <div style={styles.billingAddressHeader}>
                      <div style={styles.billingAddressHeaderLeft}>
                        <div style={styles.billingAddressIconWrap}>
                          <i className="fas fa-map-marker-alt" style={{ color: COLORS.white, fontSize: 12 }}></i>
                        </div>
                        <span style={styles.billingAddressTitle}>Billing Address</span>
                      </div>
                      <button
                        onClick={() => {
                          navigator.clipboard?.writeText(addr.formatted);
                          showAlert('Billing address copied to clipboard');
                        }}
                        style={styles.billingCopyBtn}
                        title="Copy billing address"
                      >
                        <i className="fas fa-copy" style={{ fontSize: 11 }}></i>
                        Copy
                      </button>
                    </div>
                    <div style={styles.billingAddressContent}>
                      <div style={styles.billingAddressRow}>
                        <i className="fas fa-user" style={styles.billingRowIcon}></i>
                        <span style={styles.billingAddressName}>{addr.name}</span>
                      </div>
                      <div style={styles.billingAddressRow}>
                        <i className="fas fa-road" style={styles.billingRowIcon}></i>
                        <div style={styles.billingAddressStreetBlock}>
                          <span style={styles.billingAddressLine}>{addr.street}</span>
                          <span style={styles.billingAddressLineSub}>{addr.suite}</span>
                        </div>
                      </div>
                      <div style={styles.billingAddressRow}>
                        <i className="fas fa-city" style={styles.billingRowIcon}></i>
                        <span style={styles.billingAddressLine}>
                          {addr.city}, {addr.state} {addr.zip}
                        </span>
                      </div>
                      <div style={styles.billingAddressRow}>
                        <i className="fas fa-globe-americas" style={styles.billingRowIcon}></i>
                        <span style={styles.billingAddressLine}>{addr.country}</span>
                      </div>
                    </div>
                    <div style={styles.billingAddressFooter}>
                      <i className="fas fa-shield-alt" style={{ color: COLORS.success, fontSize: 10, marginRight: 5 }}></i>
                      <span style={styles.billingFooterText}>Verified billing address on file</span>
                    </div>
                  </div>
                );
              })()}

              <div style={styles.modalActions}>
                <button
                  onClick={() => {
                    navigator.clipboard?.writeText(cardNumber);
                    showAlert('Card number copied to clipboard');
                  }}
                  style={styles.modalCopyBtn}
                >
                  <i className="fas fa-copy"></i>
                  Copy Number
                </button>
                <button onClick={() => setShowCardDetails(false)} style={styles.modalCloseBtn}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Safety: keep ref for future focus/copy */}
      <input ref={cardNumberRef} style={{ display: 'none' }} value={cardNumber} readOnly />
    </div>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = {
  container: {
    padding: '28px',
    maxWidth: '1440px',
    margin: '0 auto',
    background: COLORS.gray[50],
    minHeight: '100vh'
  },
  loadingContainer: {
    padding: '60px 0',
    textAlign: 'center',
    color: COLORS.gray[600],
    background: COLORS.gray[50]
  },
  loadingCardIcon: {
    marginBottom: '16px',
    display: 'flex',
    justifyContent: 'center',
  },
  loadingSpinner: {
    width: '40px',
    height: '40px',
    border: `3px solid ${COLORS.gray[200]}`,
    borderTop: `3px solid ${COLORS.primary}`,
    borderRadius: '50%',
    margin: '0 auto 14px',
    animation: 'spin 1s linear infinite'
  },
  loadingText: { margin: 0, fontSize: '14px' },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '16px',
    flexWrap: 'wrap',
    marginBottom: '20px'
  },
  headerLeft: { display: 'flex', alignItems: 'center', gap: '16px' },
  headerIconWrapper: {
    width: '48px',
    height: '48px',
    borderRadius: '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: COLORS.primary
  },
  title: { margin: 0, fontSize: '28px', fontWeight: '800', color: COLORS.gray[900] },
  subtitle: { margin: '4px 0 0', fontSize: '14px', color: COLORS.gray[600] },
  headerRight: { display: 'flex', alignItems: 'center', gap: '12px' },
  refreshBtn: {
    padding: '10px',
    background: COLORS.white,
    border: `1px solid ${COLORS.gray[200]}`,
    borderRadius: '10px',
    cursor: 'pointer'
  },
  addBtn: {
    padding: '10px 14px',
    background: COLORS.primary,
    border: `1px solid ${COLORS.primary}`,
    borderRadius: '10px',
    cursor: 'pointer',
    color: COLORS.white,
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  userBanner: {
    background: COLORS.white,
    padding: '16px 20px',
    borderRadius: '12px',
    border: `1px solid ${COLORS.gray[200]}`,
    marginBottom: '20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '12px'
  },
  userBannerContent: { display: 'flex', alignItems: 'center', gap: '12px' },
  userBannerLabel: { fontSize: '12px', color: COLORS.gray[500] },
  userBannerName: { fontSize: '15px', fontWeight: 700, color: COLORS.gray[900], marginLeft: '6px' },
  userBannerEmail: { fontSize: '13px', color: COLORS.gray[500], marginLeft: '10px' },
  userBannerStats: { display: 'flex', gap: '16px' },
  userBannerStat: { fontSize: '13px', color: COLORS.gray[600], display: 'flex', alignItems: 'center', gap: '6px' },
  alert: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '12px 16px',
    borderRadius: '10px',
    border: '1px solid transparent',
    marginBottom: '16px'
  },
  alertSuccess: { background: COLORS.successLight, borderColor: COLORS.success, color: COLORS.success },
  alertError: { background: COLORS.dangerLight, borderColor: COLORS.danger, color: COLORS.danger },
  alertClose: {
    marginLeft: 'auto',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    color: 'inherit'
  },
  formContainer: {
    background: COLORS.white,
    border: `1px solid ${COLORS.gray[200]}`,
    borderRadius: '14px',
    padding: '22px',
    marginBottom: '22px'
  },
  formTitle: { margin: 0, fontSize: '18px', fontWeight: 800, color: COLORS.gray[900], marginBottom: '18px' },
  formLayout: {
    display: 'flex',
    gap: '28px',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
  },
  previewArea: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
    flex: '0 0 auto',
  },
  previewLabel: {
    fontSize: '12px',
    fontWeight: 700,
    color: COLORS.gray[500],
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
  },
  form: { display: 'flex', flexDirection: 'column', gap: '16px', flex: 1, minWidth: 280 },
  formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
  formLabel: { fontSize: '13px', fontWeight: 600, color: COLORS.gray[700] },
  formInput: {
    padding: '12px 12px',
    borderRadius: '10px',
    border: `1px solid ${COLORS.gray[200]}`,
    background: COLORS.gray[50],
    outline: 'none',
    fontSize: '14px',
    transition: 'border-color 0.2s ease',
  },
  formSelect: {
    padding: '12px 12px',
    borderRadius: '10px',
    border: `1px solid ${COLORS.gray[200]}`,
    background: COLORS.gray[50],
    outline: 'none',
    fontSize: '14px',
  },
  colorSelector: { display: 'flex', gap: '10px', flexWrap: 'wrap' },
  colorOption: {
    width: '44px',
    height: '34px',
    borderRadius: '10px',
    cursor: 'pointer',
    border: '3px solid transparent',
    transition: 'transform 0.2s ease, border-color 0.2s ease',
    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
  },
  cardHolderInfo: {
    padding: '12px',
    background: COLORS.primaryLight,
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    color: COLORS.primary,
    fontWeight: 600
  },
  formActions: { display: 'flex', gap: '12px', justifyContent: 'flex-end' },
  formCancel: {
    padding: '10px 14px',
    borderRadius: '10px',
    border: `1px solid ${COLORS.gray[200]}`,
    background: COLORS.white,
    color: COLORS.gray[700],
    fontWeight: 700,
    cursor: 'pointer'
  },
  formSubmit: {
    padding: '10px 18px',
    borderRadius: '10px',
    border: 'none',
    background: COLORS.primary,
    color: COLORS.white,
    fontWeight: 800,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px 0',
    background: 'transparent',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  emptyStateIcon: {
    marginBottom: '16px',
    opacity: 0.4,
  },
  emptyStateText: { margin: '10px 0 0', fontWeight: 800, color: COLORS.gray[900], fontSize: '18px' },
  emptyStateSub: { display: 'inline-block', marginTop: '10px', color: COLORS.gray[600], fontSize: '14px' },
  emptyStateBtn: {
    marginTop: '20px',
    padding: '12px 24px',
    borderRadius: '12px',
    border: 'none',
    background: COLORS.primary,
    color: COLORS.white,
    fontWeight: 700,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
  },
  cardsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(370px, 1fr))',
    gap: '22px',
  },
  cardWrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  cardContainer: {
    display: 'flex',
    justifyContent: 'center',
  },
  cardInfoBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    padding: '12px 16px',
    background: COLORS.white,
    borderRadius: '14px',
    border: `1px solid ${COLORS.gray[200]}`,
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
  },
  cardInfoLeft: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  cardInfoName: {
    fontSize: '15px',
    fontWeight: 800,
    color: COLORS.gray[900],
  },
  cardInfoMeta: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  statusBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    fontWeight: 700,
    padding: '4px 10px',
    borderRadius: '999px',
    fontSize: '12px',
  },
  limitBadge: {
    fontSize: '12px',
    color: COLORS.gray[500],
    fontWeight: 600,
  },
  cardActionsGroup: { display: 'flex', gap: '6px' },
  cardActionBtn: {
    width: '38px',
    height: '38px',
    borderRadius: '10px',
    background: COLORS.gray[50],
    border: `1px solid ${COLORS.gray[200]}`,
    cursor: 'pointer',
    color: COLORS.gray[600],
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background 0.2s ease, transform 0.15s ease',
    fontSize: '14px',
  },
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.7)',
    backdropFilter: 'blur(12px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  },
  modal: {
    width: '100%',
    maxWidth: '520px',
    background: COLORS.white,
    borderRadius: '20px',
    padding: '28px',
    boxShadow: '0 25px 80px rgba(0,0,0,0.4)',
    maxHeight: '90vh',
    overflowY: 'auto',
  },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px' },
  modalTitle: {
    margin: 0,
    fontSize: '18px',
    fontWeight: 900,
    color: COLORS.gray[900],
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  modalClose: {
    width: 38,
    height: 38,
    borderRadius: 10,
    border: `1px solid ${COLORS.gray[200]}`,
    background: COLORS.gray[50],
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '16px',
    color: COLORS.gray[600],
  },
  modalContent: { display: 'flex', flexDirection: 'column', gap: '20px' },
  modalCardArea: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '10px',
  },
  flipHint: {
    fontSize: '12px',
    color: COLORS.gray[400],
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  modalInfo: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
    gap: '10px',
  },
  modalInfoItem: {
    background: COLORS.gray[50],
    border: `1px solid ${COLORS.gray[200]}`,
    borderRadius: 12,
    padding: '12px',
  },
  modalInfoLabel: { display: 'block', fontSize: 11, color: COLORS.gray[500], fontWeight: 700, letterSpacing: '0.04em' },
  modalInfoValue: { display: 'block', marginTop: 5, fontSize: 14, fontWeight: 800, color: COLORS.gray[900] },
  modalActions: { display: 'flex', gap: '10px', justifyContent: 'flex-end' },
  modalCopyBtn: {
    padding: '10px 16px',
    borderRadius: 12,
    border: `1px solid ${COLORS.gray[200]}`,
    background: COLORS.white,
    cursor: 'pointer',
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: COLORS.gray[700],
    fontSize: '13px',
  },
  modalCloseBtn: {
    padding: '10px 16px',
    borderRadius: 12,
    border: 'none',
    background: COLORS.primary,
    cursor: 'pointer',
    fontWeight: 800,
    color: COLORS.white,
    fontSize: '13px',
  },
  billingAddressSection: {
    background: `linear-gradient(135deg, ${COLORS.gray[50]} 0%, #f0f4ff 100%)`,
    border: `1px solid ${COLORS.gray[200]}`,
    borderRadius: 16,
    padding: '18px',
    marginTop: '4px',
    position: 'relative',
    overflow: 'hidden',
  },
  billingAddressHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '14px',
    paddingBottom: '12px',
    borderBottom: `1px solid ${COLORS.gray[200]}`,
  },
  billingAddressHeaderLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  billingAddressIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 8,
    background: COLORS.primary,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  billingAddressTitle: {
    fontSize: '12px',
    fontWeight: 800,
    color: COLORS.gray[800],
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
  },
  billingCopyBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    padding: '5px 10px',
    borderRadius: 8,
    border: `1px solid ${COLORS.gray[200]}`,
    background: COLORS.white,
    cursor: 'pointer',
    fontSize: '11px',
    fontWeight: 700,
    color: COLORS.gray[600],
    transition: 'all 0.2s ease',
  },
  billingAddressContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  billingAddressRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
  },
  billingRowIcon: {
    color: COLORS.gray[400],
    fontSize: 11,
    marginTop: 3,
    width: 14,
    textAlign: 'center',
    flexShrink: 0,
  },
  billingAddressName: {
    fontSize: '14px',
    fontWeight: 800,
    color: COLORS.gray[900],
    letterSpacing: '0.02em',
  },
  billingAddressStreetBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1px',
  },
  billingAddressLine: {
    fontSize: '13px',
    color: COLORS.gray[700],
    lineHeight: 1.5,
    fontWeight: 600,
  },
  billingAddressLineSub: {
    fontSize: '12px',
    color: COLORS.gray[500],
    lineHeight: 1.4,
    fontWeight: 500,
  },
  billingAddressFooter: {
    display: 'flex',
    alignItems: 'center',
    marginTop: '12px',
    paddingTop: '10px',
    borderTop: `1px solid ${COLORS.gray[200]}`,
  },
  billingFooterText: {
    fontSize: '11px',
    color: COLORS.gray[500],
    fontWeight: 600,
    letterSpacing: '0.02em',
  },
};

// Ensure keyframes exist
if (typeof document !== 'undefined') {
  const id = 'virtualcards-spin-keyframes';
  if (!document.getElementById(id)) {
    const style = document.createElement('style');
    style.id = id;
    style.textContent = `
      @keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}
      .realistic-card:hover {
        transform: translateY(-4px) scale(1.01);
        box-shadow: 0 30px 60px -15px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.15) inset !important;
      }
    `;
    document.head.appendChild(style);
  }
}
