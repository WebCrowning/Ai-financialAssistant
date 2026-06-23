import React, { useState, useEffect, useRef } from 'react';
import {
  Search, ShoppingCart, ShoppingBag, Plus, Minus, Trash2, X,
  CreditCard, ChevronRight, CheckCircle2, AlertTriangle, ArrowLeft,
  Calendar, FileText, Star, Shield, Info, Printer, RefreshCw, Eye
} from 'lucide-react';

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
  cardGradients: [
    'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
    'linear-gradient(135deg, #2d1b69 0%, #1a1a2e 50%, #4a1942 100%)',
    'linear-gradient(135deg, #0c0c0c 0%, #1a1a1a 50%, #2d2d2d 100%)',
    'linear-gradient(135deg, #0a1628 0%, #1a365d 50%, #2c5282 100%)',
    'linear-gradient(135deg, #1a1a2e 0%, #4a1942 50%, #1a1a2e 100%)'
  ]
};

// Seeding address generation helper like in VirtualCards
const ADDRESS_DATA = {
  streets: ['1200 Market Street', '4500 Westheimer Road', '7890 Peachtree Boulevard', '2350 Michigan Avenue', '6100 Wilshire Boulevard'],
  suites: ['Suite 100', 'Suite 200', 'Suite 305', 'Suite 410', 'Unit A'],
  cities: [
    { city: 'New York', state: 'NY', zip: '10001' },
    { city: 'Los Angeles', state: 'CA', zip: '90001' },
    { city: 'Chicago', state: 'IL', zip: '60601' },
    { city: 'Houston', state: 'TX', zip: '77001' }
  ]
};

function generateSeededAddress(cardId, holderName) {
  if (!cardId) return `${holderName}\n1200 Market Street, Suite 100\nNew York, NY 10001\nUnited States`;

  // Quick hash
  let hash = 0;
  const s = String(cardId);
  for (let i = 0; i < s.length; i++) hash = ((hash << 5) - hash + s.charCodeAt(i)) | 0;
  hash = Math.abs(hash);

  const street = ADDRESS_DATA.streets[hash % ADDRESS_DATA.streets.length];
  const suite = ADDRESS_DATA.suites[(hash >> 2) % ADDRESS_DATA.suites.length];
  const cityInfo = ADDRESS_DATA.cities[(hash >> 4) % ADDRESS_DATA.cities.length];
  const fullZip = `${cityInfo.zip}-${1000 + (hash % 8999)}`;

  return `${holderName}\n${street}, ${suite}\n${cityInfo.city}, ${cityInfo.state} ${fullZip}\nUnited States`;
}

// Visual Card rendering inside Checkout
function CheckoutCard({ cardName, cardNumber, cardHolder, expiryDate, cvv, cardType, colorIndex, isFlipped }) {
  const maskCardNumber = (num) => {
    if (!num) return '•••• •••• •••• ••••';
    const digits = String(num).replace(/\D/g, '');
    return digits.replace(/(.{4})/g, '$1 ').trim();
  };

  const gradient = COLORS.cardGradients[colorIndex % COLORS.cardGradients.length] || COLORS.cardGradients[0];

  return (
    <div style={{
      width: '100%',
      height: '190px',
      borderRadius: '16px',
      background: gradient,
      boxShadow: '0 12px 24px -6px rgba(0,0,0,0.3), inset 0 1px 1px rgba(255,255,255,0.1)',
      position: 'relative',
      overflow: 'hidden',
      color: 'white',
      fontFamily: "'Inter', sans-serif",
      transition: 'transform 0.5s ease',
      transformStyle: 'preserve-3d',
      transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
    }}>
      {!isFlipped ? (
        /* Front */
        <div style={{
          padding: '20px',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          backfaceVisibility: 'hidden'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, opacity: 0.8, letterSpacing: '0.05em' }}>
              {cardName || 'VIRTUAL CARD'}
            </span>
            <span style={{ fontSize: '14px', fontWeight: 800 }}>FinVision</span>
          </div>

          <div style={{
            fontSize: '18px',
            fontFamily: 'monospace',
            letterSpacing: '0.12em',
            margin: '20px 0 10px 0',
            textAlign: 'center'
          }}>
            {maskCardNumber(cardNumber)}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <div style={{ fontSize: '8px', opacity: 0.6, marginBottom: '2px' }}>CARD HOLDER</div>
              <div style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {cardHolder || 'CARD HOLDER'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '8px', opacity: 0.6, marginBottom: '2px' }}>EXPIRES</div>
              <div style={{ fontSize: '12px', fontWeight: 600, fontFamily: 'monospace' }}>
                {expiryDate || 'MM/YY'}
              </div>
            </div>
            <div style={{ textTransform: 'uppercase', fontSize: '14px', fontWeight: 800, fontStyle: 'italic', opacity: 0.9 }}>
              {cardType || 'visa'}
            </div>
          </div>
        </div>
      ) : (
        /* Back */
        <div style={{
          padding: '0',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          transform: 'rotateY(180deg)',
          backfaceVisibility: 'hidden'
        }}>
          <div style={{ width: '100%', height: '35px', background: '#111', marginBottom: '15px' }} />

          <div style={{ margin: '0 20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ flex: 1, height: '30px', background: '#ddd', borderRadius: '2px', display: 'flex', alignItems: 'center', paddingLeft: '10px', color: '#333', fontSize: '12px', fontStyle: 'italic' }}>
              {cardHolder}
            </div>
            <div style={{ background: 'white', color: '#111', padding: '6px 10px', borderRadius: '2px', fontFamily: 'monospace', fontWeight: 800, fontSize: '14px' }}>
              {cvv || '•••'}
            </div>
          </div>

          <div style={{ padding: '15px 20px 0 20px', fontSize: '7px', opacity: 0.4, textAlign: 'left', lineHeight: '1.2' }}>
            Authorized signature is required. This card remains the property of the issuer. Void where prohibited by banking guidelines.
          </div>
        </div>
      )}
    </div>
  );
}

export default function StoreSimulation({ token, user }) {
  // Page state
  const [activeTab, setActiveTab] = useState('catalog');
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filter/Search states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('popular');

  // Shopping Cart state
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Modals state
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState('billing'); // 'billing', 'payment', 'success'
  const [checkoutResult, setCheckoutResult] = useState(null);

  // Checkout inputs
  const [cards, setCards] = useState([]);
  const [selectedCardId, setSelectedCardId] = useState('');

  const [checkoutForm, setCheckoutForm] = useState({
    cardHolder: '',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardType: 'visa',
    shippingName: '',
    shippingAddress: '',
    shippingCity: '',
    shippingState: '',
    shippingZip: ''
  });

  const [cvvFocused, setCvvFocused] = useState(false);
  const [isSubmittingPurchase, setIsSubmittingPurchase] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Fetch initial products and orders
  useEffect(() => {
    fetchProducts();
    fetchOrders();
    fetchUserCards();
  }, [token]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/store/products');
      if (res.ok) {
        setProducts(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/store/orders', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setOrders(await res.json());
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUserCards = async () => {
    try {
      const res = await fetch('/api/virtual-cards', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setCards(await res.json());
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchProducts(), fetchOrders(), fetchUserCards()]);
    setRefreshing(false);
  };

  // Cart operations
  const addToCart = (product, quantity = 1) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.id === product.id
            ? { ...item, quantity: Math.min(item.quantity + quantity, product.stock) }
            : item
        );
      }
      return [...prev, { ...product, quantity }];
    });
    setSuccessMsg(`Added ${product.name} to cart.`);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const updateCartQty = (id, change) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const nextQty = item.quantity + change;
        if (nextQty <= 0) return null;
        return { ...item, quantity: Math.min(nextQty, item.stock) };
      }
      return item;
    }).filter(Boolean));
  };

  const removeFromCart = (id) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartSubtotal = cart.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);

  // Auto-fill checkout fields when a card is selected
  const handleCardSelectChange = (e) => {
    const cardId = e.target.value;
    setSelectedCardId(cardId);
    setErrorMsg('');

    if (cardId === '') {
      setCheckoutForm(prev => ({
        ...prev,
        cardHolder: '',
        cardNumber: '',
        expiryDate: '',
        cvv: '',
        cardType: 'visa'
      }));
      return;
    }

    const card = cards.find(c => String(c.id) === String(cardId));
    if (card) {
      setCheckoutForm(prev => ({
        ...prev,
        cardHolder: card.card_holder,
        cardNumber: card.card_number,
        expiryDate: card.expiry_date,
        cvv: card.cvv,
        cardType: card.card_type
      }));

      // Set billing/shipping default address
      const seeded = generateSeededAddress(card.id, card.card_holder);
      const lines = seeded.split('\n');
      const cityStateZip = lines[2] ? lines[2].split(', ') : ['', ''];
      const city = cityStateZip[0] || '';
      const stateZip = cityStateZip[1] ? cityStateZip[1].split(' ') : ['', ''];

      setCheckoutForm(prev => ({
        ...prev,
        shippingName: card.card_holder,
        shippingAddress: lines[1] || '',
        shippingCity: city,
        shippingState: stateZip[0] || '',
        shippingZip: stateZip[1] || ''
      }));
    }
  };

  // Submit order checkout
  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    if (checkoutStep === 'billing') {
      if (!checkoutForm.shippingName || !checkoutForm.shippingAddress || !checkoutForm.shippingCity || !checkoutForm.shippingState || !checkoutForm.shippingZip) {
        setErrorMsg('Please complete all shipping address fields.');
        return;
      }
      setErrorMsg('');
      setCheckoutStep('payment');
      return;
    }

    // Payment validation
    if (!checkoutForm.cardNumber || !checkoutForm.expiryDate || !checkoutForm.cvv || !checkoutForm.cardHolder) {
      setErrorMsg('Please complete all payment fields.');
      return;
    }

    setIsSubmittingPurchase(true);
    setErrorMsg('');

    try {
      const response = await fetch('/api/store/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          card_number: checkoutForm.cardNumber,
          expiry_date: checkoutForm.expiryDate,
          cvv: checkoutForm.cvv,
          card_holder: checkoutForm.cardHolder,
          items: cart.map(item => ({
            id: item.id,
            name: item.name,
            quantity: item.quantity,
            price: item.price
          })),
          total_amount: cartSubtotal
        })
      });

      const data = await response.json();
      if (response.ok) {
        setCheckoutResult({
          orderId: data.orderId,
          date: new Date().toLocaleDateString(),
          total: cartSubtotal,
          cardUsedName: cards.find(c => String(c.id) === String(selectedCardId))?.card_name || 'Virtual Card',
          cardUsedNumber: checkoutForm.cardNumber.slice(-4),
          shipping: checkoutForm
        });
        setCart([]); // Clear cart
        setCheckoutStep('success');
        fetchOrders(); // Refresh orders list
        fetchUserCards(); // Refresh cards to update limits
      } else {
        setErrorMsg(data.message || 'Payment processing failed.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('An error occurred during payment processing. Please check connection.');
    } finally {
      setIsSubmittingPurchase(false);
    }
  };

  const openCheckout = () => {
    if (cart.length === 0) return;
    setIsCartOpen(false);
    setShowCheckout(true);
    setCheckoutStep('billing');
    setErrorMsg('');

    // Pre-fill user billing/shipping address from profile if possible
    const displayName = user.display_name || user.email?.split('@')[0] || 'Customer';
    setCheckoutForm({
      cardHolder: '',
      cardNumber: '',
      expiryDate: '',
      cvv: '',
      cardType: 'visa',
      shippingName: displayName,
      shippingAddress: '',
      shippingCity: '',
      shippingState: '',
      shippingZip: ''
    });
    setSelectedCardId('');

    // Must use primary card only
    const primary = cards.find(c => Number(c.is_primary) === 1);
    if (!primary) {
      setErrorMsg('Please set a Primary virtual card in Virtual Cards first.');
      return;
    }

    // Select the primary card
    setSelectedCardId(primary.id);
    const seeded = generateSeededAddress(primary.id, primary.card_holder);
    const lines = seeded.split('\n');
    const cityStateZip = lines[2] ? lines[2].split(', ') : ['', ''];
    const city = cityStateZip[0] || '';
    const stateZip = cityStateZip[1] ? cityStateZip[1].split(' ') : ['', ''];

    setCheckoutForm({
      cardHolder: primary.card_holder,
      cardNumber: primary.card_number,
      expiryDate: primary.expiry_date,
      cvv: primary.cvv,
      cardType: primary.card_type,
      shippingName: primary.card_holder,
      shippingAddress: lines[1] || '',
      shippingCity: city,
      shippingState: stateZip[0] || '',
      shippingZip: stateZip[1] || ''
    });
  };

  // Catalog item search & sorting logic
  const filteredProducts = products
    .filter(p => {
      const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCat = selectedCategory === 'All' || p.category === selectedCategory;
      return matchSearch && matchCat;
    })
    .sort((a, b) => {
      if (sortBy === 'price-low') return parseFloat(a.price) - parseFloat(b.price);
      if (sortBy === 'price-high') return parseFloat(b.price) - parseFloat(a.price);
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      return 0; // popular/default
    });

  const categories = ['All', 'Laptops', 'Phones', 'Wearables', 'Audio', 'Accessories'];

  const formatPrice = (price) => {
    return `CFA ${parseFloat(price).toLocaleString('en-US')}`;
  };

  const getCardColor = (cId) => {
    const card = cards.find(c => c.id === cId);
    return card ? card.card_color : 0;
  };

  return (
    <div style={styles.container}>
      {/* Success alert message toast */}
      {successMsg && (
        <div style={styles.toast}>
          <CheckCircle2 size={16} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Store Header */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.headerIconWrapper}>
            <ShoppingBag size={24} style={{ color: COLORS.primary }} />
          </div>
          <div>
            <h1 style={styles.title}>Simulation E-Commerce Store</h1>
            <p style={styles.subtitle}>Test your Virtual Cards by simulating online retail spending</p>
          </div>
        </div>
        <div style={styles.headerRight}>
          <button
            onClick={() => setActiveTab(activeTab === 'catalog' ? 'orders' : 'catalog')}
            style={styles.ordersTabBtn}
          >
            <FileText size={16} />
            {activeTab === 'catalog' ? 'Order History' : 'Back to Store'}
          </button>

          <button onClick={handleRefresh} style={styles.refreshBtn} title="Sync Store Data">
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          </button>

          <button onClick={() => setIsCartOpen(true)} style={styles.cartTriggerBtn}>
            <ShoppingCart size={18} />
            <span style={{ fontWeight: '700' }}>Cart ({cartCount})</span>
            {cartCount > 0 && <span style={styles.cartBadge}>{cartCount}</span>}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      {activeTab === 'catalog' ? (
        <div>
          {/* Hero Banner banner */}
          <div style={styles.heroBanner}>
            <div style={styles.heroOverlay} />
            <div style={styles.heroContent}>
              <span style={styles.heroBadge}>Virtual Sandbox Store</span>
              <h2 style={styles.heroTitle}>Spend Limit Testing Suite</h2>
              <p style={styles.heroDescription}>
                Need to test a card transaction? Browse our mock electronics catalog, load up a cart, and execute checkout checks safely using mock credit cards. All receipts will log directly to your transaction ledgers.
              </p>
            </div>
          </div>

          {/* Filters and Searching */}
          <div style={styles.filterBar}>
            <div style={styles.searchWrapper}>
              <Search size={18} style={styles.searchIcon} />
              <input
                type="text"
                placeholder="Search products, brands, specifications..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={styles.searchInput}
              />
            </div>
            <div style={styles.sortingWrapper}>
              <span style={{ color: COLORS.gray[500], fontSize: '13px', fontWeight: '500' }}>Sort By:</span>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                style={styles.sortSelect}
              >
                <option value="popular">Popularity</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="name">Alphabetical</option>
              </select>
            </div>
          </div>

          {/* Category Tabs */}
          <div style={styles.categoryTabs}>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  ...styles.catTab,
                  ...(selectedCategory === cat ? styles.catTabActive : {})
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Product Grid */}
          {loading ? (
            <div style={styles.loadingWrapper}>
              <div style={styles.spinner}></div>
              <p style={{ marginTop: '16px', color: COLORS.gray[500] }}>Loading mock catalog catalog...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div style={styles.emptyState}>
              <span style={{ fontSize: '48px' }}>🔍</span>
              <h3 style={styles.emptyTitle}>No Products Found</h3>
              <p style={styles.emptyDesc}>Try adjusting your search criteria or select another category tab.</p>
            </div>
          ) : (
            <div style={styles.productGrid}>
              {filteredProducts.map(product => (
                <div key={product.id} style={styles.productCard}>
                  <div style={styles.cardImageWrapper}>
                    <img
                      src={product.image_url}
                      alt={product.name}
                      style={styles.productImage}
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=500&q=80'; // fallback
                      }}
                    />
                    <span style={styles.cardCategoryBadge}>{product.category}</span>
                  </div>
                  <div style={styles.cardBody}>
                    <h3 style={styles.productTitle} title={product.name}>{product.name}</h3>
                    <p style={styles.productDesc}>{product.description}</p>

                    {/* Star Rating visualization */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '16px' }}>
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={14} fill={i < 4 ? '#eab308' : 'none'} stroke={i < 4 ? '#eab308' : COLORS.gray[300]} />
                      ))}
                      <span style={{ fontSize: '12px', color: COLORS.gray[500], marginLeft: '4px' }}>4.2 (Mocked)</span>
                    </div>

                    <div style={styles.cardFooter}>
                      <span style={styles.productPrice}>{formatPrice(product.price)}</span>
                      <button
                        onClick={() => addToCart(product)}
                        style={styles.addToCartBtn}
                        disabled={product.stock <= 0}
                      >
                        {product.stock <= 0 ? 'Out of Stock' : 'Add to Cart'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Orders History Panel */
        <div>
          <div style={styles.historyHeader}>
            <h2 style={styles.sectionTitle}>Completed Orders Ledger</h2>
            <p style={styles.sectionSubtitle}>Review your simulation spending and order records</p>
          </div>

          {orders.length === 0 ? (
            <div style={styles.emptyState}>
              <span style={{ fontSize: '48px' }}>🛒</span>
              <h3 style={styles.emptyTitle}>No Order Records</h3>
              <p style={styles.emptyDesc}>You haven't checked out any store items yet. Make a purchase to see records here.</p>
              <button onClick={() => setActiveTab('catalog')} style={styles.emptyStateBtn}>Go Shopping</button>
            </div>
          ) : (
            <div style={styles.ordersTableWrapper}>
              <table style={styles.ordersTable}>
                <thead>
                  <tr style={styles.tableHeaderRow}>
                    <th>Order Reference</th>
                    <th>Date</th>
                    <th>Virtual Card Used</th>
                    <th>Total Spent</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'center' }}>Receipt</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(order => {
                    let items = [];
                    try {
                      items = JSON.parse(order.items_json);
                    } catch (e) { }

                    return (
                      <tr key={order.id} style={styles.tableRow}>
                        <td style={{ fontWeight: '600' }}>FV-ORD-{20260000 + order.id}-SIM</td>
                        <td>{new Date(order.created_at).toLocaleDateString()}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <CreditCard size={14} style={{ color: COLORS.gray[400] }} />
                            <span>
                              {order.card_name || 'Deleted Card'} (•••• {order.card_number ? order.card_number.slice(-4) : '••••'})
                            </span>
                          </div>
                        </td>
                        <td style={{ fontWeight: '700', color: COLORS.danger }}>
                          {formatPrice(order.total_amount)}
                        </td>
                        <td>
                          <span style={styles.statusBadgeSuccess}>COMPLETED</span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button
                            onClick={() => {
                              const cardObj = cards.find(c => c.id === order.card_id) || {
                                card_holder: order.card_holder || user.display_name || 'Customer',
                                card_number: order.card_number || '•••• •••• •••• ••••',
                                id: order.card_id
                              };
                              setCheckoutResult({
                                orderId: order.id,
                                date: new Date(order.created_at).toLocaleDateString(),
                                total: order.total_amount,
                                cardUsedName: order.card_name || 'Virtual Card',
                                cardUsedNumber: order.card_number ? order.card_number.slice(-4) : '••••',
                                shipping: {
                                  shippingName: cardObj.card_holder,
                                  shippingAddress: '1200 Market Street',
                                  shippingCity: 'New York',
                                  shippingState: 'NY',
                                  shippingZip: '10001'
                                }
                              });
                              setCart(items); // Load order items to display on receipt
                              setCheckoutStep('success');
                              setShowCheckout(true);
                            }}
                            style={styles.viewReceiptBtn}
                          >
                            <Eye size={14} />
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Flyout Shopping Cart Drawer */}
      {isCartOpen && (
        <div style={styles.cartOverlay} onClick={() => setIsCartOpen(false)}>
          <div style={styles.cartDrawer} onClick={e => e.stopPropagation()}>
            <div style={styles.cartHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShoppingCart size={20} />
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700' }}>Shopping Cart ({cartCount})</h3>
              </div>
              <button onClick={() => setIsCartOpen(false)} style={styles.closeBtn}>
                <X size={20} />
              </button>
            </div>

            <div style={styles.cartBody}>
              {cart.length === 0 ? (
                <div style={styles.cartEmpty}>
                  <span style={{ fontSize: '36px' }}>🧺</span>
                  <p style={{ marginTop: '12px', color: COLORS.gray[500] }}>Your cart is empty.</p>
                  <button onClick={() => setIsCartOpen(false)} style={styles.cartShopBtn}>Start Browsing</button>
                </div>
              ) : (
                <div style={styles.cartList}>
                  {cart.map(item => (
                    <div key={item.id} style={styles.cartItem}>
                      <div style={styles.cartItemImgWrapper}>
                        <img src={item.image_url} alt={item.name} style={styles.cartItemImg} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <h4 style={styles.cartItemTitle}>{item.name}</h4>
                        <span style={styles.cartItemPrice}>{formatPrice(item.price)}</span>

                        <div style={styles.cartQtyControls}>
                          <button
                            onClick={() => updateCartQty(item.id, -1)}
                            style={styles.qtyBtn}
                          >
                            <Minus size={12} />
                          </button>
                          <span style={styles.qtyVal}>{item.quantity}</span>
                          <button
                            onClick={() => updateCartQty(item.id, 1)}
                            style={styles.qtyBtn}
                            disabled={item.quantity >= item.stock}
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        style={styles.cartRemoveBtn}
                        title="Remove Item"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div style={styles.cartFooter}>
                <div style={styles.cartTotalRow}>
                  <span>Subtotal</span>
                  <strong style={{ fontSize: '18px', color: COLORS.gray[900] }}>{formatPrice(cartSubtotal)}</strong>
                </div>
                <p style={{ fontSize: '11px', color: COLORS.gray[500], marginTop: '4px', marginBottom: '16px' }}>
                  Shipping & taxes are calculated at checkout. Simulation transactions do not charge real money.
                </p>
                <button onClick={openCheckout} style={styles.checkoutBtn}>
                  Proceed to Checkout
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Checkout and Receipt Modal Container */}
      {showCheckout && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>
                {checkoutStep === 'billing' && 'Checkout - Shipping & Address'}
                {checkoutStep === 'payment' && 'Checkout - Card Information'}
                {checkoutStep === 'success' && 'Order Summary Receipt'}
              </h3>
              <button
                onClick={() => {
                  setShowCheckout(false);
                  if (checkoutStep === 'success') {
                    // reset cart just in case
                    setCart([]);
                  }
                }}
                style={styles.closeBtn}
              >
                <X size={20} />
              </button>
            </div>

            {checkoutStep !== 'success' ? (
              <form onSubmit={handleCheckoutSubmit} style={styles.modalForm}>
                {errorMsg && (
                  <div style={styles.errorAlert}>
                    <AlertTriangle size={18} />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <div style={styles.checkoutLayout}>
                  {/* Form fields */}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {checkoutStep === 'billing' ? (
                      <>
                        <h4 style={styles.stepTitle}>Shipping Address</h4>

                        <div style={styles.formGroup}>
                          <label style={styles.formLabel}>Full Name</label>
                          <input
                            type="text"
                            style={styles.formInput}
                            value={checkoutForm.shippingName}
                            onChange={e => setCheckoutForm({ ...checkoutForm, shippingName: e.target.value })}
                            required
                          />
                        </div>

                        <div style={styles.formGroup}>
                          <label style={styles.formLabel}>Street Address</label>
                          <input
                            type="text"
                            style={styles.formInput}
                            placeholder="e.g. 1200 Market Street"
                            value={checkoutForm.shippingAddress}
                            onChange={e => setCheckoutForm({ ...checkoutForm, shippingAddress: e.target.value })}
                            required
                          />
                        </div>

                        <div style={styles.formRow}>
                          <div style={{ ...styles.formGroup, flex: 2 }}>
                            <label style={styles.formLabel}>City</label>
                            <input
                              type="text"
                              style={styles.formInput}
                              value={checkoutForm.shippingCity}
                              onChange={e => setCheckoutForm({ ...checkoutForm, shippingCity: e.target.value })}
                              required
                            />
                          </div>
                          <div style={{ ...styles.formGroup, flex: 1 }}>
                            <label style={styles.formLabel}>State</label>
                            <input
                              type="text"
                              style={styles.formInput}
                              placeholder="NY"
                              maxLength="2"
                              value={checkoutForm.shippingState}
                              onChange={e => setCheckoutForm({ ...checkoutForm, shippingState: e.target.value })}
                              required
                            />
                          </div>
                          <div style={{ ...styles.formGroup, flex: 1 }}>
                            <label style={styles.formLabel}>Zip Code</label>
                            <input
                              type="text"
                              style={styles.formInput}
                              placeholder="10001"
                              value={checkoutForm.shippingZip}
                              onChange={e => setCheckoutForm({ ...checkoutForm, shippingZip: e.target.value })}
                              required
                            />
                          </div>
                        </div>

                        <div style={styles.modalActions}>
                          <button
                            type="button"
                            onClick={() => setShowCheckout(false)}
                            style={styles.modalCancelBtn}
                          >
                            Cancel
                          </button>
                          <button type="submit" style={styles.modalSubmitBtn}>
                            Continue to Payment
                            <ChevronRight size={16} />
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <h4 style={styles.stepTitle}>Virtual Card Authorization</h4>
                          <span style={styles.secureBadge}>
                            <Shield size={12} />
                            Simulation Sandbox
                          </span>
                        </div>

                        <div style={styles.formGroup}>
                          <label style={styles.formLabel}>Quick Select Active Card</label>
                          <select
                            style={styles.formSelect}
                            value={selectedCardId}
                            onChange={handleCardSelectChange}
                          >
                            <option value="">-- Choose Card to Auto-fill --</option>
                            {cards.map(c => (
                              <option key={c.id} value={c.id}>
                                {c.card_name} - {c.card_type.toUpperCase()} (•••• {c.card_number.slice(-4)}) [Limit: CFA {Math.round(c.spending_limit).toLocaleString()}] {c.status === 'frozen' ? '❄️ FROZEN' : ''}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div style={styles.formGroup}>
                          <label style={styles.formLabel}>Cardholder Name</label>
                          <input
                            type="text"
                            style={styles.formInput}
                            value={checkoutForm.cardHolder}
                            onChange={e => setCheckoutForm({ ...checkoutForm, cardHolder: e.target.value })}
                            required
                          />
                        </div>

                        <div style={styles.formGroup}>
                          <label style={styles.formLabel}>Card Number</label>
                          <input
                            type="text"
                            style={styles.formInput}
                            placeholder="4000 1234 5678 9010"
                            value={checkoutForm.cardNumber}
                            onChange={e => {
                              const raw = e.target.value.replace(/\D/g, '');
                              setCheckoutForm({ ...checkoutForm, cardNumber: raw });
                            }}
                            required
                          />
                        </div>

                        <div style={styles.formRow}>
                          <div style={styles.formGroup}>
                            <label style={styles.formLabel}>Expiration Date (MM/YY)</label>
                            <input
                              type="text"
                              style={styles.formInput}
                              placeholder="12/28"
                              maxLength="5"
                              value={checkoutForm.expiryDate}
                              onChange={e => setCheckoutForm({ ...checkoutForm, expiryDate: e.target.value })}
                              required
                            />
                          </div>
                          <div style={styles.formGroup}>
                            <label style={styles.formLabel}>Security Code (CVV)</label>
                            <input
                              type="text"
                              style={styles.formInput}
                              placeholder="123"
                              maxLength="4"
                              value={checkoutForm.cvv}
                              onChange={e => setCheckoutForm({ ...checkoutForm, cvv: e.target.value.replace(/\D/g, '') })}
                              onFocus={() => setCvvFocused(true)}
                              onBlur={() => setCvvFocused(false)}
                              required
                            />
                          </div>
                        </div>

                        <div style={styles.modalActions}>
                          <button
                            type="button"
                            onClick={() => setCheckoutStep('billing')}
                            style={styles.modalCancelBtn}
                          >
                            <ArrowLeft size={14} />
                            Address
                          </button>

                          <button
                            type="submit"
                            style={styles.modalPurchaseBtn}
                            disabled={isSubmittingPurchase}
                          >
                            {isSubmittingPurchase ? (
                              <>
                                <span style={styles.miniSpinner}></span>
                                Processing...
                              </>
                            ) : (
                              <>
                                Authorize Purchase {formatPrice(cartSubtotal)}
                              </>
                            )}
                          </button>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Right Side: Dynamic Visual Card & Cart Summary */}
                  <div style={styles.checkoutSummaryCol}>
                    {checkoutStep === 'payment' && (
                      <div style={{ marginBottom: '20px' }}>
                        <CheckoutCard
                          cardName={cards.find(c => String(c.id) === String(selectedCardId))?.card_name || 'VIRTUAL CARD'}
                          cardNumber={checkoutForm.cardNumber}
                          cardHolder={checkoutForm.cardHolder}
                          expiryDate={checkoutForm.expiryDate}
                          cvv={checkoutForm.cvv}
                          cardType={checkoutForm.cardType}
                          colorIndex={getCardColor(selectedCardId)}
                          isFlipped={cvvFocused}
                        />
                      </div>
                    )}

                    <div style={styles.orderSummaryCard}>
                      <h4 style={styles.summaryTitle}>Cart Summary</h4>
                      <div style={styles.summaryList}>
                        {cart.map(item => (
                          <div key={item.id} style={styles.summaryItem}>
                            <span style={styles.summaryItemName}>{item.name} <strong style={{ color: COLORS.gray[500] }}>x{item.quantity}</strong></span>
                            <span style={styles.summaryItemPrice}>{formatPrice(parseFloat(item.price) * item.quantity)}</span>
                          </div>
                        ))}
                      </div>

                      <div style={styles.summaryDivider} />

                      <div style={styles.summaryRow}>
                        <span>Subtotal</span>
                        <span>{formatPrice(cartSubtotal)}</span>
                      </div>
                      <div style={styles.summaryRow}>
                        <span>Shipping</span>
                        <span style={{ color: COLORS.success, fontWeight: '600' }}>FREE</span>
                      </div>
                      <div style={styles.summaryRow}>
                        <span>Tax</span>
                        <span>CFA 0</span>
                      </div>

                      <div style={styles.summaryDivider} />

                      <div style={styles.summaryTotalRow}>
                        <span>Total spent</span>
                        <span>{formatPrice(cartSubtotal)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </form>
            ) : (
              /* Success Receipt View */
              <div style={styles.receiptContainer} className="print-area">
                <div style={styles.receiptHeader}>
                  <div style={styles.successIconWrapper}>
                    <CheckCircle2 size={40} style={{ color: COLORS.success }} />
                  </div>
                  <h2 style={styles.receiptSuccessTitle}>Order Authorized Successfully</h2>
                  <p style={styles.receiptRef}>Receipt Number: FV-ORD-{20260000 + checkoutResult.orderId}-SIM</p>
                  <p style={{ color: COLORS.gray[500], fontSize: '13px' }}>Transaction Date: {checkoutResult.date}</p>
                </div>

                <div style={styles.receiptGrid}>
                  <div style={styles.receiptBlock}>
                    <h4 style={styles.receiptBlockTitle}>Shipping Address</h4>
                    <p style={{ ...styles.receiptText, whiteSpace: 'pre-line' }}>
                      {checkoutResult.shipping.shippingName}
                      {'\n'}{checkoutResult.shipping.shippingAddress}
                      {'\n'}{checkoutResult.shipping.shippingCity}, {checkoutResult.shipping.shippingState} {checkoutResult.shipping.shippingZip}
                      {'\n'}United States
                    </p>
                  </div>
                  <div style={styles.receiptBlock}>
                    <h4 style={styles.receiptBlockTitle}>Payment Details</h4>
                    <p style={styles.receiptText}>
                      <strong>Card Name:</strong> {checkoutResult.cardUsedName}
                      <br />
                      <strong>Card Number:</strong> •••• •••• •••• {checkoutResult.cardUsedNumber}
                      <br />
                      <strong>Method:</strong> Virtual Card Simulation
                      <br />
                      <strong>Authorization Status:</strong> Approved (Sandbox)
                    </p>
                  </div>
                </div>

                <div style={{ marginTop: '24px' }}>
                  <h4 style={styles.receiptBlockTitle}>Items Purchased</h4>
                  <div style={styles.receiptItemsList}>
                    {cart.map(item => (
                      <div key={item.id} style={styles.receiptItemRow}>
                        <span>{item.name} <strong>x{item.quantity}</strong></span>
                        <span>{formatPrice(parseFloat(item.price) * item.quantity)}</span>
                      </div>
                    ))}
                    <div style={styles.receiptDivider} />
                    <div style={styles.receiptTotalRow}>
                      <span>Grand Total</span>
                      <span>{formatPrice(checkoutResult.total)}</span>
                    </div>
                  </div>
                </div>

                <div style={styles.receiptFooter}>
                  <div style={styles.receiptAlert}>
                    <Info size={16} />
                    <span>This was a sandbox check. Your virtual card limit has been adjusted, and records have been logged to the Transactions & Dashboard pages.</span>
                  </div>
                  <div style={styles.receiptActions} className="no-print">
                    <button
                      onClick={() => window.print()}
                      style={styles.printBtn}
                    >
                      <Printer size={16} />
                      Print Receipt
                    </button>
                    <button
                      onClick={() => {
                        setShowCheckout(false);
                        setCart([]); // Reset cart
                        setActiveTab('catalog');
                      }}
                      style={styles.backToStoreBtn}
                    >
                      Done & Close
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Styling classes objects for styling in JSS
const styles = {
  container: {
    padding: '24px',
    maxWidth: '1280px',
    margin: '0 auto',
    background: '#f8fafc',
    minHeight: '100vh',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
  },
  toast: {
    position: 'fixed',
    top: '20px',
    right: '20px',
    background: '#0f172a',
    color: 'white',
    padding: '12px 20px',
    borderRadius: '8px',
    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.3)',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    zIndex: 9999,
    fontSize: '14px',
    animation: 'pulse 1s'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '28px',
    flexWrap: 'wrap',
    gap: '16px',
    borderBottom: '1px solid #e2e8f0',
    paddingBottom: '20px'
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px'
  },
  headerIconWrapper: {
    width: '48px',
    height: '48px',
    background: COLORS.primaryLight,
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  title: {
    margin: 0,
    fontSize: '24px',
    fontWeight: '800',
    color: COLORS.gray[900],
    letterSpacing: '-0.5px'
  },
  subtitle: {
    margin: '2px 0 0 0',
    color: COLORS.gray[500],
    fontSize: '13px'
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  ordersTabBtn: {
    padding: '10px 16px',
    background: 'white',
    border: `1px solid ${COLORS.gray[200]}`,
    borderRadius: '8px',
    color: COLORS.gray[700],
    fontWeight: '600',
    fontSize: '13px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.2s'
  },
  refreshBtn: {
    padding: '10px',
    background: 'white',
    border: `1px solid ${COLORS.gray[200]}`,
    borderRadius: '8px',
    color: COLORS.gray[600],
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    transition: 'all 0.2s'
  },
  cartTriggerBtn: {
    padding: '10px 18px',
    background: COLORS.primary,
    color: 'white',
    borderRadius: '8px',
    fontWeight: '600',
    fontSize: '13px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)',
    border: 'none',
    position: 'relative',
    transition: 'all 0.2s'
  },
  cartBadge: {
    background: COLORS.danger,
    color: 'white',
    borderRadius: '50%',
    width: '18px',
    height: '18px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '10px',
    position: 'absolute',
    top: '-6px',
    right: '-6px',
    border: '2px solid white',
    fontWeight: 'bold'
  },
  heroBanner: {
    background: 'linear-gradient(135deg, #1e3a8a 0%, #1e293b 100%)',
    borderRadius: '16px',
    padding: '36px',
    position: 'relative',
    overflow: 'hidden',
    marginBottom: '28px',
    boxShadow: '0 4px 20px -2px rgba(30,41,59,0.15)'
  },
  heroOverlay: {
    position: 'absolute',
    inset: 0,
    background: 'radial-gradient(circle at top right, rgba(59,130,246,0.15) 0%, transparent 60%)'
  },
  heroContent: {
    position: 'relative',
    zIndex: 2,
    maxWidth: '640px'
  },
  heroBadge: {
    display: 'inline-block',
    background: 'rgba(59, 130, 246, 0.2)',
    color: '#93c5fd',
    padding: '4px 10px',
    borderRadius: '9999px',
    fontSize: '11px',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '12px'
  },
  heroTitle: {
    fontSize: '28px',
    fontWeight: '800',
    color: 'white',
    margin: '0 0 10px 0',
    letterSpacing: '-0.5px'
  },
  heroDescription: {
    color: COLORS.gray[300],
    fontSize: '14px',
    lineHeight: '1.6',
    margin: 0
  },
  filterBar: {
    background: 'white',
    padding: '16px 20px',
    borderRadius: '12px',
    border: `1px solid ${COLORS.gray[200]}`,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '16px',
    flexWrap: 'wrap',
    marginBottom: '20px'
  },
  searchWrapper: {
    position: 'relative',
    flex: '1 1 300px'
  },
  searchIcon: {
    position: 'absolute',
    left: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: COLORS.gray[400]
  },
  searchInput: {
    width: '100%',
    padding: '10px 12px 10px 38px',
    border: `1px solid ${COLORS.gray[200]}`,
    borderRadius: '8px',
    fontSize: '14px',
    background: '#f8fafc',
    color: COLORS.gray[900],
    transition: 'all 0.2s'
  },
  sortingWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  sortSelect: {
    padding: '8px 12px',
    border: `1px solid ${COLORS.gray[200]}`,
    borderRadius: '8px',
    fontSize: '13px',
    color: COLORS.gray[700],
    background: 'white',
    fontWeight: '500'
  },
  categoryTabs: {
    display: 'flex',
    gap: '8px',
    marginBottom: '28px',
    overflowX: 'auto',
    paddingBottom: '4px'
  },
  catTab: {
    padding: '8px 16px',
    background: 'white',
    color: COLORS.gray[600],
    border: `1px solid ${COLORS.gray[200]}`,
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600',
    whiteSpace: 'nowrap',
    transition: 'all 0.2s'
  },
  catTabActive: {
    background: COLORS.primary,
    color: 'white',
    borderColor: COLORS.primary,
    boxShadow: '0 4px 10px rgba(37,99,235,0.15)'
  },
  loadingWrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '80px 0'
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: `4px solid ${COLORS.gray[200]}`,
    borderTop: `4px solid ${COLORS.primary}`,
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  },
  miniSpinner: {
    width: '16px',
    height: '16px',
    border: '2px solid rgba(255,255,255,0.3)',
    borderTop: '2px solid white',
    borderRadius: '50%',
    display: 'inline-block',
    animation: 'spin 1s linear infinite',
    marginRight: '8px'
  },
  productGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '24px',
    marginBottom: '40px'
  },
  productCard: {
    background: 'white',
    borderRadius: '12px',
    border: `1px solid ${COLORS.gray[200]}`,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    transition: 'all 0.2s'
  },
  cardImageWrapper: {
    width: '100%',
    height: '180px',
    background: '#f1f5f9',
    position: 'relative',
    overflow: 'hidden'
  },
  productImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transition: 'transform 0.3s ease'
  },
  cardCategoryBadge: {
    position: 'absolute',
    top: '12px',
    left: '12px',
    background: 'rgba(15, 23, 42, 0.75)',
    backdropFilter: 'blur(4px)',
    color: 'white',
    fontSize: '10px',
    fontWeight: '700',
    padding: '3px 8px',
    borderRadius: '4px',
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
  },
  cardBody: {
    padding: '18px',
    display: 'flex',
    flexDirection: 'column',
    flex: 1
  },
  productTitle: {
    fontSize: '16px',
    fontWeight: '700',
    color: COLORS.gray[900],
    margin: '0 0 6px 0',
    lineHeight: '1.4',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  productDesc: {
    fontSize: '12px',
    color: COLORS.gray[500],
    lineHeight: '1.5',
    margin: '0 0 12px 0',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
    height: '36px'
  },
  cardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 'auto'
  },
  productPrice: {
    fontSize: '16px',
    fontWeight: '800',
    color: COLORS.gray[900]
  },
  addToCartBtn: {
    padding: '8px 14px',
    background: COLORS.gray[900],
    color: 'white',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
    border: 'none'
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px 20px',
    background: 'white',
    borderRadius: '16px',
    border: `1px solid ${COLORS.gray[200]}`
  },
  emptyTitle: {
    fontSize: '18px',
    fontWeight: '700',
    color: COLORS.gray[800],
    margin: '16px 0 6px 0'
  },
  emptyDesc: {
    fontSize: '13px',
    color: COLORS.gray[500],
    margin: '0 0 20px 0'
  },
  emptyStateBtn: {
    padding: '10px 20px',
    background: COLORS.primary,
    color: 'white',
    borderRadius: '8px',
    fontWeight: '600',
    fontSize: '13px',
    cursor: 'pointer',
    border: 'none'
  },
  historyHeader: {
    marginBottom: '20px'
  },
  sectionTitle: {
    fontSize: '20px',
    fontWeight: '800',
    color: COLORS.gray[900],
    margin: 0
  },
  sectionSubtitle: {
    fontSize: '13px',
    color: COLORS.gray[500],
    margin: '4px 0 0 0'
  },
  ordersTableWrapper: {
    background: 'white',
    borderRadius: '12px',
    border: `1px solid ${COLORS.gray[200]}`,
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
  },
  ordersTable: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '13px'
  },
  tableHeaderRow: {
    background: '#f8fafc',
    borderBottom: `2px solid ${COLORS.gray[200]}`
  },
  tableRow: {
    borderBottom: `1px solid ${COLORS.gray[200]}`,
    transition: 'background 0.2s'
  },
  statusBadgeSuccess: {
    background: COLORS.successLight,
    color: COLORS.success,
    fontSize: '10px',
    fontWeight: '700',
    padding: '3px 8px',
    borderRadius: '4px',
    letterSpacing: '0.04em'
  },
  viewReceiptBtn: {
    padding: '6px 12px',
    background: '#f1f5f9',
    color: COLORS.gray[700],
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: '600',
    cursor: 'pointer',
    border: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px'
  },
  cartOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(15, 23, 42, 0.4)',
    backdropFilter: 'blur(4px)',
    zIndex: 9999,
    display: 'flex',
    justifyContent: 'flex-end'
  },
  cartDrawer: {
    width: '100%',
    maxWidth: '420px',
    height: '100%',
    background: 'white',
    boxShadow: '-10px 0 25px -5px rgba(15, 23, 42, 0.2)',
    display: 'flex',
    flexDirection: 'column',
    animation: 'slideLeft 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
  },
  cartHeader: {
    padding: '20px',
    borderBottom: `1px solid ${COLORS.gray[200]}`,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: COLORS.gray[500],
    cursor: 'pointer',
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
    borderRadius: '4px',
    transition: 'background 0.2s'
  },
  cartBody: {
    flex: 1,
    overflowY: 'auto',
    padding: '20px'
  },
  cartEmpty: {
    height: '80%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center'
  },
  cartShopBtn: {
    marginTop: '16px',
    padding: '8px 18px',
    background: COLORS.gray[900],
    color: 'white',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '600',
    border: 'none',
    cursor: 'pointer'
  },
  cartList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  cartItem: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
    borderBottom: `1px solid ${COLORS.gray[100]}`,
    paddingBottom: '16px'
  },
  cartItemImgWrapper: {
    width: '70px',
    height: '70px',
    background: COLORS.gray[100],
    borderRadius: '8px',
    overflow: 'hidden'
  },
  cartItemImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  cartItemTitle: {
    fontSize: '13px',
    fontWeight: '700',
    color: COLORS.gray[900],
    margin: '0 0 2px 0',
    lineHeight: '1.3'
  },
  cartItemPrice: {
    fontSize: '12px',
    fontWeight: '700',
    color: COLORS.gray[600]
  },
  cartQtyControls: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginTop: '8px'
  },
  qtyBtn: {
    width: '22px',
    height: '22px',
    borderRadius: '4px',
    border: `1px solid ${COLORS.gray[300]}`,
    background: 'white',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: COLORS.gray[600]
  },
  qtyVal: {
    fontSize: '12px',
    fontWeight: '700',
    minWidth: '16px',
    textAlign: 'center'
  },
  cartRemoveBtn: {
    background: 'none',
    border: 'none',
    color: COLORS.gray[400],
    cursor: 'pointer',
    padding: '6px',
    transition: 'color 0.2s'
  },
  cartFooter: {
    padding: '20px',
    borderTop: `1px solid ${COLORS.gray[200]}`,
    background: '#f8fafc'
  },
  cartTotalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '14px',
    fontWeight: '600',
    color: COLORS.gray[600]
  },
  checkoutBtn: {
    width: '100%',
    padding: '12px',
    background: COLORS.primary,
    color: 'white',
    borderRadius: '8px',
    fontWeight: '700',
    fontSize: '14px',
    cursor: 'pointer',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    boxShadow: '0 4px 12px rgba(37,99,235,0.2)'
  },
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(15, 23, 42, 0.5)',
    backdropFilter: 'blur(5px)',
    zIndex: 99999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px'
  },
  modal: {
    width: '100%',
    maxWidth: '840px',
    maxHeight: '90vh',
    background: 'white',
    borderRadius: '16px',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  },
  modalTitle: {
    margin: 0,
    fontSize: '18px',
    fontWeight: '800',
    color: COLORS.gray[900]
  },
  modalHeader: {
    padding: '18px 24px',
    borderBottom: `1px solid ${COLORS.gray[200]}`,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  modalForm: {
    padding: '24px',
    overflowY: 'auto',
    flex: 1
  },
  errorAlert: {
    padding: '12px 16px',
    background: COLORS.dangerLight,
    border: `1px solid ${COLORS.danger}`,
    borderRadius: '8px',
    color: COLORS.danger,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '20px',
    fontSize: '13px'
  },
  checkoutLayout: {
    display: 'flex',
    gap: '32px',
    flexWrap: 'wrap'
  },
  stepTitle: {
    fontSize: '15px',
    fontWeight: '700',
    color: COLORS.gray[800],
    margin: '0 0 4px 0'
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  formLabel: {
    fontSize: '11px',
    fontWeight: '700',
    color: COLORS.gray[500],
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: 0
  },
  formInput: {
    padding: '10px 12px',
    border: `1px solid ${COLORS.gray[200]}`,
    borderRadius: '8px',
    fontSize: '14px',
    color: COLORS.gray[900],
    outline: 'none',
    transition: 'border-color 0.2s',
    background: '#f8fafc'
  },
  formSelect: {
    padding: '10px 12px',
    border: `1px solid ${COLORS.gray[200]}`,
    borderRadius: '8px',
    fontSize: '13px',
    color: COLORS.gray[900],
    background: 'white',
    outline: 'none'
  },
  formRow: {
    display: 'flex',
    gap: '16px'
  },
  secureBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    background: COLORS.successLight,
    color: COLORS.success,
    fontSize: '11px',
    fontWeight: '700',
    padding: '3px 8px',
    borderRadius: '4px'
  },
  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '24px',
    borderTop: `1px solid ${COLORS.gray[100]}`,
    paddingTop: '16px'
  },
  modalCancelBtn: {
    padding: '10px 18px',
    background: 'white',
    border: `1px solid ${COLORS.gray[300]}`,
    color: COLORS.gray[700],
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer'
  },
  modalSubmitBtn: {
    padding: '10px 18px',
    background: COLORS.gray[900],
    color: 'white',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  },
  modalPurchaseBtn: {
    padding: '10px 22px',
    background: COLORS.success,
    color: 'white',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '700',
    cursor: 'pointer',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 12px rgba(5,150,105,0.2)'
  },
  checkoutSummaryCol: {
    width: '320px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  orderSummaryCard: {
    background: '#f8fafc',
    borderRadius: '12px',
    border: `1px solid ${COLORS.gray[200]}`,
    padding: '20px'
  },
  summaryTitle: {
    fontSize: '14px',
    fontWeight: '700',
    color: COLORS.gray[800],
    margin: '0 0 12px 0'
  },
  summaryList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    maxHeight: '150px',
    overflowY: 'auto'
  },
  summaryItem: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '12px'
  },
  summaryItemName: {
    color: COLORS.gray[700],
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: '180px'
  },
  summaryItemPrice: {
    fontWeight: '600',
    color: COLORS.gray[800]
  },
  summaryDivider: {
    height: '1px',
    background: COLORS.gray[200],
    margin: '12px 0'
  },
  summaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '12px',
    color: COLORS.gray[500],
    marginBottom: '6px'
  },
  summaryTotalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '14px',
    fontWeight: '700',
    color: COLORS.gray[900]
  },
  receiptContainer: {
    padding: '32px 24px',
    overflowY: 'auto',
    flex: 1
  },
  receiptHeader: {
    textAlign: 'center',
    marginBottom: '28px'
  },
  successIconWrapper: {
    width: '64px',
    height: '64px',
    background: COLORS.successLight,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 16px auto'
  },
  receiptSuccessTitle: {
    fontSize: '20px',
    fontWeight: '800',
    color: COLORS.gray[900],
    margin: '0 0 6px 0'
  },
  receiptRef: {
    fontSize: '13px',
    fontWeight: '600',
    color: COLORS.gray[600],
    margin: 0
  },
  receiptGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '20px',
    borderTop: `1px solid ${COLORS.gray[200]}`,
    borderBottom: `1px solid ${COLORS.gray[200]}`,
    padding: '20px 0',
    marginBottom: '20px'
  },
  receiptBlock: {
    display: 'flex',
    flexDirection: 'column'
  },
  receiptBlockTitle: {
    fontSize: '11px',
    fontWeight: '700',
    color: COLORS.gray[400],
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    margin: '0 0 8px 0'
  },
  receiptText: {
    fontSize: '13px',
    lineHeight: '1.5',
    color: COLORS.gray[700],
    margin: 0
  },
  receiptItemsList: {
    background: '#f8fafc',
    borderRadius: '12px',
    border: `1px solid ${COLORS.gray[200]}`,
    padding: '20px'
  },
  receiptItemRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '13px',
    marginBottom: '10px',
    color: COLORS.gray[700]
  },
  receiptDivider: {
    height: '1px',
    background: COLORS.gray[200],
    margin: '12px 0'
  },
  receiptTotalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '15px',
    fontWeight: '800',
    color: COLORS.gray[900]
  },
  receiptFooter: {
    marginTop: '28px'
  },
  receiptAlert: {
    display: 'flex',
    gap: '10px',
    alignItems: 'center',
    background: COLORS.primaryLight,
    border: `1px solid rgba(37,99,235,0.15)`,
    borderRadius: '8px',
    padding: '12px 16px',
    color: COLORS.primary,
    fontSize: '12px',
    lineHeight: '1.4'
  },
  receiptActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '24px'
  },
  printBtn: {
    padding: '10px 18px',
    background: 'white',
    border: `1px solid ${COLORS.gray[300]}`,
    borderRadius: '8px',
    color: COLORS.gray[700],
    fontWeight: '600',
    fontSize: '13px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  backToStoreBtn: {
    padding: '10px 20px',
    background: COLORS.gray[900],
    color: 'white',
    borderRadius: '8px',
    fontWeight: '700',
    fontSize: '13px',
    cursor: 'pointer',
    border: 'none'
  }
};
