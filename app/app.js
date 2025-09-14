
class InDriveApp {
    constructor() {
        this.map = null;
        this.isMapInitialized = false;
        this.astanaCenter = [51.169392, 71.449074];
        this.isOnline = false;
        this.currentScreen = 'mapScreen';
        this.driverMarker = null;
        this.zones = [];
        
        // Данные приложения из JSON
        this.appData = {
            "app": {"name": "inDrive", "city": "Astana", "version": "2025.1"},
            "driver": {
                "name": "Асет Нурланов",
                "coords": [51.169392, 71.449074],
                "rating": 4.8,
                "balance": 49700,
                "status": "online",
                "totalTrips": 2847,
                "todayEarnings": 19800,
                "car": {
                    "make": "Toyota",
                    "model": "Camry",
                    "year": 2020,
                    "color": "Белый",
                    "plate": "123ABC04"
                }
            },
            "zones": [
                {
                    "id": 1,
                    "name": "Алматы",
                    "coords": [51.148830, 71.412530],
                    "orders": 18,
                    "multiplier": 1.5,
                    "color": "#FF6B35",
                    "radius": 1500
                },
                {
                    "id": 2,
                    "name": "Сарыарка",
                    "coords": [51.180100, 71.446000],
                    "orders": 24,
                    "multiplier": 1.8,
                    "color": "#DC3545",
                    "radius": 1800
                },
                {
                    "id": 3,
                    "name": "Есиль",
                    "coords": [51.095667, 71.380222],
                    "orders": 12,
                    "multiplier": 1.2,
                    "color": "#FFC107",
                    "radius": 1200
                },
                {
                    "id": 4,
                    "name": "Аэропорт",
                    "coords": [51.022222, 71.467222],
                    "orders": 15,
                    "multiplier": 1.6,
                    "color": "#FF6B35",
                    "radius": 2000
                }
            ],
            "orders": [
                {
                    "id": 1,
                    "passenger": {"name": "Айгуль К.", "avatar": "👩🏻", "rating": 4.9},
                    "from": "ТРЦ Керуен",
                    "to": "КазНУ",
                    "price": 1350,
                    "distance": "8.2 км",
                    "time": "14 мин",
                    "pickup": [51.148830, 71.412530],
                    "destination": [51.180100, 71.446000]
                },
                {
                    "id": 2,
                    "passenger": {"name": "Данияр С.", "avatar": "👨🏻", "rating": 4.6},
                    "from": "Байтерек",
                    "to": "Аэропорт",
                    "price": 2800,
                    "distance": "18.5 км",
                    "time": "22 мин",
                    "pickup": [51.136871, 71.430411],
                    "destination": [51.022222, 71.467222]
                }
            ]
        };
        
        // Инициализация сразу или при загрузке DOM
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initializeApp());
        } else {
            // DOM уже загружен
            setTimeout(() => this.initializeApp(), 100);
        }
    }
    
    async initializeApp() {
        try {
            console.log('🚀 Инициализация приложения inDrive...');
            
            // Ждем что все ресурсы загрузились
            if (document.readyState !== 'complete') {
                await new Promise(resolve => {
                    window.addEventListener('load', resolve);
                });
            }
            
            // Проверяем Leaflet
            let attempts = 0;
            while (typeof L === 'undefined' && attempts < 50) {
                await new Promise(resolve => setTimeout(resolve, 100));
                attempts++;
            }
            
            if (typeof L === 'undefined') {
                console.error('❌ Leaflet не загрузился после ожидания!');
                this.showMapFallback();
                return;
            }
            
            console.log('✅ Leaflet доступен');
            
            // Инициализируем компоненты
            this.setupEventListeners();
            this.setupNavigation();
            this.populateScreens();
            this.updateUI();
            
            // Небольшая задержка для стабильности
            setTimeout(() => {
                this.initMap();
            }, 200);
            
            console.log('🎉 Приложение готово!');
            
        } catch (error) {
            console.error('❌ Ошибка инициализации:', error);
            this.showMapFallback();
        }
    }
    
    initMap() {
        try {
            console.log('🗺️ Начинаем инициализацию карты...');
            
            const mapElement = document.getElementById('map');
            if (!mapElement) {
                console.error('❌ Элемент карты не найден!');
                return;
            }
            
            console.log('📍 Элемент карты найден, создаем карту...');
            
            // Удаляем существующую карту если есть
            if (this.map) {
                try {
                    this.map.remove();
                } catch (e) {
                    console.log('Предыдущая карта удалена');
                }
                this.map = null;
            }
            
            // Очищаем контейнер
            mapElement.innerHTML = '';
            
            // Создаем новую карту
            this.map = L.map('map', {
                center: this.astanaCenter,
                zoom: 12,
                zoomControl: true,
                attributionControl: false,
                preferCanvas: false
            });
            
            console.log('🗺️ Объект карты создан');
            
            // Добавляем тайлы с несколькими попытками
            const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
                attribution: '© OpenStreetMap contributors',
                crossOrigin: true
            });
            
            tileLayer.addTo(this.map);
            
            console.log('🎯 Тайлы добавлены');
            
            // Обработчик события загрузки карты
            this.map.whenReady(() => {
                console.log('✅ Карта готова!');
                this.isMapInitialized = true;
                
                // Добавляем маркеры и зоны
                this.addDriverMarker();
                this.addDemandZones();
                
                // Принудительно обновляем размер карты
                setTimeout(() => {
                    if (this.map) {
                        this.map.invalidateSize();
                        console.log('📐 Размер карты обновлен');
                    }
                }, 500);
            });
            
            // Обработчик ошибок тайлов
            tileLayer.on('tileerror', (e) => {
                console.warn('⚠️ Ошибка загрузки тайла:', e);
            });
            
            // Обработчик успешной загрузки тайлов
            tileLayer.on('load', () => {
                console.log('🎨 Тайлы загружены успешно');
            });
            
            // Fallback проверка
            setTimeout(() => {
                if (!this.isMapInitialized) {
                    console.warn('⚠️ Карта не инициализировалась за 10 секунд');
                    this.retryMapInit();
                }
            }, 10000);
            
        } catch (error) {
            console.error('❌ Критическая ошибка создания карты:', error);
            this.showMapFallback();
        }
    }
    
    addDriverMarker() {
        if (!this.map) {
            console.log('❌ Карта не готова для добавления маркера');
            return;
        }
        
        console.log('🚗 Добавление маркера водителя...');
        
        try {
            // Создаем HTML для анимированного маркера
            const markerHtml = `
                <div class="driver-marker-container">
                    <div class="driver-pulse"></div>
                    <div class="driver-icon">🚗</div>
                </div>
            `;
            
            // Создаем divIcon
            const driverIcon = L.divIcon({
                html: markerHtml,
                className: 'custom-driver-marker',
                iconSize: [30, 30],
                iconAnchor: [15, 15],
                popupAnchor: [0, -15]
            });
            
            // Добавляем маркер на карту
            this.driverMarker = L.marker(this.astanaCenter, { 
                icon: driverIcon,
                title: 'Мое местоположение'
            }).addTo(this.map);
            
            // Добавляем попап
            this.driverMarker.bindPopup(`
                <div class="driver-popup">
                    <div class="popup-header">
                        <strong>🚗 ${this.appData.driver.name}</strong>
                    </div>
                    <div class="popup-info">
                        ⭐ ${this.appData.driver.rating} • ${this.appData.driver.car.make} ${this.appData.driver.car.model}
                    </div>
                    <div class="popup-status">
                        <span style="color: #00C853;">🟢 В сети</span>
                    </div>
                </div>
            `, {
                maxWidth: 200,
                closeButton: true
            });
            
            // Добавляем CSS для маркера если еще не добавлен
            this.addDriverMarkerStyles();
            
            console.log('✅ Маркер водителя добавлен успешно');
            
        } catch (error) {
            console.error('❌ Ошибка добавления маркера водителя:', error);
        }
    }
    
    addDriverMarkerStyles() {
        if (document.getElementById('driver-marker-styles')) return;

        const style = document.createElement('style');
        style.id = 'driver-marker-styles';
        style.textContent = `
            .custom-driver-marker {
                background: transparent !important;
                border: none !important;
            }
            
            .driver-marker-container {
                position: relative;
                width: 30px;
                height: 30px;
            }
            
            .driver-pulse {
                position: absolute;
                top: 50%;
                left: 50%;
                width: 30px;
                height: 30px;
                border: 3px solid #00C853;
                border-radius: 50%;
                transform: translate(-50%, -50%);
                animation: driverPulse 2s ease-out infinite;
            }
            
            .driver-icon {
                position: absolute;
                top: 50%;
                left: 50%;
                width: 20px;
                height: 20px;
                background: white;
                border: 3px solid #00C853;
                border-radius: 50%;
                transform: translate(-50%, -50%);
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 10px;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
                z-index: 2;
            }
            
            @keyframes driverPulse {
                0% {
                    transform: translate(-50%, -50%) scale(1);
                    opacity: 1;
                }
                100% {
                    transform: translate(-50%, -50%) scale(2);
                    opacity: 0;
                }
            }
            
            .driver-popup {
                text-align: center;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }
            
            .popup-header {
                font-size: 16px;
                font-weight: 600;
                margin-bottom: 8px;
                color: #212529;
            }
            
            .popup-info {
                font-size: 14px;
                color: #6C757D;
                margin-bottom: 8px;
            }
            
            .popup-status {
                font-size: 14px;
                font-weight: 500;
            }
        `;
        document.head.appendChild(style);
    }
    
    addDemandZones() {
        if (!this.map) {
            console.log('❌ Карта не готова для добавления зон');
            return;
        }
        
        console.log('🎯 Добавление зон спроса...');
        
        try {
            // Очищаем существующие зоны
            this.zones.forEach(zone => {
                if (zone.layer) {
                    this.map.removeLayer(zone.layer);
                }
            });
            this.zones = [];
            
            // Добавляем каждую зону
            this.appData.zones.forEach((zone, index) => {
                console.log(`📍 Добавляем зону: ${zone.name}`);
                
                // Создаем круговую зону
                const circle = L.circle(zone.coords, {
                    radius: zone.radius,
                    fillColor: zone.color,
                    color: zone.color,
                    weight: 2,
                    fillOpacity: 0.15,
                    opacity: 0.8
                });
                
                // Добавляем на карту
                circle.addTo(this.map);
                
                // Добавляем попап
                circle.bindPopup(`
                    <div class="zone-popup">
                        <div class="zone-header">
                            <h4 style="color: ${zone.color}; margin: 0 0 8px 0; font-size: 16px;">
                                📍 ${zone.name}
                            </h4>
                        </div>
                        <div class="zone-info">
                            <div style="margin: 4px 0;">
                                <strong>Заказов:</strong> ${zone.orders}
                            </div>
                            <div style="margin: 4px 0;">
                                <strong>Коэффициент:</strong> x${zone.multiplier}
                            </div>
                        </div>
                    </div>
                `, {
                    maxWidth: 200,
                    closeButton: true
                });
                
                // Сохраняем ссылку на зону
                this.zones.push({
                    ...zone,
                    layer: circle
                });
                
                console.log(`✅ Зона ${zone.name} добавлена`);
            });
            
            console.log('✅ Все зоны спроса добавлены');
            
        } catch (error) {
            console.error('❌ Ошибка добавления зон:', error);
        }
    }
    
    showMapFallback() {
        console.warn('🔄 Показ fallback для карты...');
        const mapElement = document.getElementById('map');
        if (mapElement) {
            mapElement.innerHTML = `
                <div class="map-fallback">
                    <div class="fallback-icon">🗺️</div>
                    <div class="fallback-text">Загрузка карты Астаны...</div>
                    <div class="fallback-subtext">Пожалуйста, подождите</div>
                    <button onclick="app.retryMapInit()" class="retry-btn">Повторить попытку</button>
                </div>
            `;
        }
    }
    
    retryMapInit() {
        console.log('🔄 Повторная инициализация карты...');
        this.isMapInitialized = false;
        
        const mapElement = document.getElementById('map');
        if (mapElement) {
            mapElement.innerHTML = '';
        }
        
        setTimeout(() => {
            this.initMap();
        }, 500);
    }

    setupEventListeners() {
        console.log('🎯 Настройка обработчиков событий...');
        
        // Переключение статуса водителя
        const driverStatus = document.getElementById('driverStatus');
        const fabBtn = document.getElementById('goOnlineBtn');
        
        if (driverStatus) {
            driverStatus.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleDriverStatus();
            });
        }

        if (fabBtn) {
            fabBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleDriverStatus();
            });
        }

        // Элементы управления картой
        this.setupMapControls();
        
        // Фильтры зон
        this.setupZoneFilters();
        
        // Действия профиля
        this.setupProfileActions();
        
        // Вкладки фильтров
        this.setupFilterTabs();
        
        console.log('✅ Обработчики настроены');
    }

    toggleDriverStatus() {
        this.isOnline = !this.isOnline;
        console.log(`🚗 Статус водителя: ${this.isOnline ? 'ОНЛАЙН' : 'ОФЛАЙН'}`);
        
        this.updateDriverStatusUI();
        
        if (this.isOnline) {
            this.goOnline();
        } else {
            this.goOffline();
        }
    }

    updateDriverStatusUI() {
        const statusIndicator = document.getElementById('statusIndicator');
        const statusText = document.getElementById('statusText');
        const fabBtn = document.getElementById('goOnlineBtn');
        const fabIcon = fabBtn?.querySelector('.fab-icon');
        const fabText = fabBtn?.querySelector('.fab-text');

        // Обновляем индикатор статуса
        if (statusIndicator) {
            statusIndicator.classList.toggle('online', this.isOnline);
        }
        
        // Обновляем текст статуса
        if (statusText) {
            statusText.textContent = this.isOnline ? 'В сети' : 'Офлайн';
        }

        // Обновляем FAB кнопку
        if (fabBtn && fabIcon && fabText) {
            if (this.isOnline) {
                fabBtn.classList.add('online');
                fabIcon.textContent = '🛑';
                fabText.textContent = 'Завершить смену';
            } else {
                fabBtn.classList.remove('online');
                fabIcon.textContent = '🚗';
                fabText.textContent = 'Выйти в сеть';
            }
        }
    }

    goOnline() {
        console.log('✅ Выход в сеть...');
        this.showNotification('✅ В сети', 'Ожидайте заказы');
        
        // Показываем заказ через 2 секунды
        setTimeout(() => {
            this.showAvailableOrder();
        }, 2000);
    }

    goOffline() {
        console.log('⭕ Завершение смены...');
        this.hideOrderCards();
        this.showNotification('⭕ Офлайн', 'Смена завершена');
    }

    showAvailableOrder() {
        if (!this.isOnline || this.appData.orders.length === 0) return;
        
        const container = document.getElementById('orderCardsContainer');
        if (!container) return;

        const order = this.appData.orders[0];
        const orderCard = this.createOrderCard(order);
        
        container.innerHTML = '';
        container.appendChild(orderCard);
        console.log('📋 Заказ отображен');
    }

    createOrderCard(order) {
        const orderCard = document.createElement('div');
        orderCard.className = 'order-card';
        
        orderCard.innerHTML = `
            <div class="order-header">
                <div class="passenger-info">
                    <div class="passenger-avatar">${order.passenger.avatar}</div>
                    <div class="passenger-details">
                        <div class="passenger-name">${order.passenger.name}</div>
                        <div class="passenger-rating">⭐ ${order.passenger.rating}</div>
                    </div>
                </div>
                <div class="order-price">
                    <div class="price-amount">${order.price.toLocaleString()}₸</div>
                    <div class="price-distance">${order.distance}</div>
                </div>
            </div>
            <div class="order-route">
                <div class="route-point">
                    <div class="route-icon">🟢</div>
                    <div class="route-details">
                        <div class="route-address">${order.from}</div>
                        <div class="route-time">${order.time}</div>
                    </div>
                </div>
                <div class="route-point">
                    <div class="route-icon">🔴</div>
                    <div class="route-details">
                        <div class="route-address">${order.to}</div>
                        <div class="route-time">~15 мин</div>
                    </div>
                </div>
            </div>
            <div class="order-actions">
                <button class="order-action-btn decline">
                    <span>❌</span>
                    <span>Отклонить</span>
                </button>
                <button class="order-action-btn accept">
                    <span>✅</span>
                    <span>Принять</span>
                </button>
            </div>
        `;
        
        // Добавляем обработчики кнопок
        const acceptBtn = orderCard.querySelector('.accept');
        const declineBtn = orderCard.querySelector('.decline');
        
        if (acceptBtn) {
            acceptBtn.addEventListener('click', () => this.acceptOrder(order.id));
        }
        
        if (declineBtn) {
            declineBtn.addEventListener('click', () => this.declineOrder(order.id));
        }
        
        return orderCard;
    }

    acceptOrder(orderId) {
        console.log('✅ Заказ принят:', orderId);
        this.hideOrderCards();
        this.showNotification('🎉 Заказ принят!', 'Едете к пассажиру');
        
        // Обновляем баланс
        const order = this.appData.orders.find(o => o.id === orderId);
        if (order) {
            this.appData.driver.balance += order.price;
            this.updateBalance();
        }
    }

    declineOrder(orderId) {
        console.log('❌ Заказ отклонен:', orderId);
        this.hideOrderCards();
        
        // Показываем следующий заказ через 3 секунды
        setTimeout(() => {
            if (this.isOnline) {
                this.showAvailableOrder();
            }
        }, 3000);
    }

    hideOrderCards() {
        const container = document.getElementById('orderCardsContainer');
        if (container) {
            container.innerHTML = '';
        }
    }

    setupMapControls() {
        const controls = ['myLocationBtn', 'layersBtn', 'trafficBtn'];
        
        controls.forEach(controlId => {
            const btn = document.getElementById(controlId);
            if (btn) {
                btn.addEventListener('click', () => this.handleMapControlClick(controlId));
            }
        });
    }

    handleMapControlClick(controlId) {
        switch(controlId) {
            case 'myLocationBtn':
                this.centerMapOnDriver();
                break;
            case 'layersBtn':
                this.showNotification('🗺️ Слои карты', 'Переключение слоев карты');
                break;
            case 'trafficBtn':
                this.showNotification('🚦 Пробки', 'Показ информации о пробках');
                break;
        }
    }

    centerMapOnDriver() {
        if (this.map && this.driverMarker) {
            this.map.setView(this.astanaCenter, 15);
            this.driverMarker.openPopup();
            this.showNotification('📍 Местоположение', 'Карта центрирована на водителе');
        }
    }

    setupZoneFilters() {
        const filterBtns = document.querySelectorAll('.filter-btn');
        
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const filter = btn.dataset.filter;
                this.setZoneFilter(filter, btn);
            });
        });
    }

    setZoneFilter(filter, activeBtn) {
        const filterBtns = document.querySelectorAll('.filter-btn');
        filterBtns.forEach(btn => btn.classList.remove('active'));
        
        if (activeBtn) {
            activeBtn.classList.add('active');
        }
        
        const filterNames = {
            'all': 'Все зоны',
            'high': 'Горячие зоны', 
            'traffic': 'Быстрые маршруты'
        };
        
        this.showNotification('🎯 Фильтр', `Показаны: ${filterNames[filter] || 'Все зоны'}`);
    }

    setupNavigation() {
        const navItems = document.querySelectorAll('.nav-item');
        
        navItems.forEach(item => {
            const screen = item.dataset.screen;
            item.addEventListener('click', () => this.switchScreen(screen));
        });
    }

    switchScreen(screenName) {
        if (!screenName) return;
        
        // Скрываем все экраны
        const screens = document.querySelectorAll('.screen');
        screens.forEach(screen => screen.classList.remove('active'));

        // Показываем целевой экран
        const targetScreen = document.getElementById(screenName);
        if (targetScreen) {
            targetScreen.classList.add('active');
        }

        // Обновляем навигацию
        this.updateNavigation(screenName);
        
        // Специальные действия для экранов
        this.handleScreenSpecificActions(screenName);
        
        this.currentScreen = screenName;
    }

    updateNavigation(activeScreen) {
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            const isActive = item.dataset.screen === activeScreen;
            item.classList.toggle('active', isActive);
        });
    }

    handleScreenSpecificActions(screenName) {
        switch(screenName) {
            case 'mapScreen':
                setTimeout(() => {
                    if (this.map) {
                        this.map.invalidateSize();
                        console.log('🗺️ Размер карты обновлен при переключении');
                    }
                }, 200);
                break;
            case 'earningsScreen':
                setTimeout(() => this.initEarningsChart(), 300);
                break;
        }
    }

    setupProfileActions() {
        const profileBtns = document.querySelectorAll('.profile-btn');
        profileBtns.forEach(btn => {
            btn.addEventListener('click', () => this.handleProfileAction(btn));
        });
    }

    handleProfileAction(btn) {
        const text = btn.textContent;
        
        if (text.includes('Документы')) {
            this.showNotification('📄 Документы', 'Все документы актуальны');
        } else if (text.includes('Настройки')) {
            this.showNotification('⚙️ Настройки', 'Откроется меню настроек');
        } else if (text.includes('Аналитика')) {
            this.showNotification('📊 Аналитика', 'Детальная статистика');
        } else if (text.includes('Поддержка')) {
            this.showNotification('❓ Поддержка', 'Связь с поддержкой 24/7');
        }
    }

    setupFilterTabs() {
        const tabBtns = document.querySelectorAll('.tab-btn');
        
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const period = btn.dataset.period;
                this.setTimePeriod(period, btn);
            });
        });
    }

    setTimePeriod(period, activeBtn) {
        const tabBtns = document.querySelectorAll('.tab-btn');
        tabBtns.forEach(btn => btn.classList.remove('active'));
        
        if (activeBtn) {
            activeBtn.classList.add('active');
        }
    }

    populateScreens() {
        this.populateOrdersScreen();
    }

    populateOrdersScreen() {
        const ordersList = document.getElementById('ordersList');
        if (!ordersList) return;

        const sampleOrders = [
            { time: '14:30', route: 'ТРЦ Керуен → КазНУ', earnings: '1,350₸', distance: '8.2 км' },
            { time: '13:45', route: 'Байтерек → Аэропорт', earnings: '2,800₸', distance: '18.5 км' },
            { time: '12:20', route: 'Хан Шатыр → Назарбаев Университет', earnings: '980₸', distance: '6.8 км' },
            { time: '11:15', route: 'Сарыарка → Есиль', earnings: '1,200₸', distance: '7.3 км' },
            { time: '10:30', route: 'Алматы → Центр', earnings: '1,450₸', distance: '9.1 км' }
        ];

        ordersList.innerHTML = sampleOrders.map(order => `
            <div class="order-item">
                <div class="order-item-header">
                    <div class="order-time">${order.time}</div>
                    <div class="order-earnings">${order.earnings}</div>
                </div>
                <div class="order-route-summary">${order.route}</div>
                <div class="order-details">
                    <span>${order.distance}</span>
                    <span>⭐ 4.8</span>
                </div>
            </div>
        `).join('');
    }

    initEarningsChart() {
        const canvas = document.getElementById('earningsChart');
        if (!canvas || typeof Chart === 'undefined') return;

        const ctx = canvas.getContext('2d');
        
        if (this.earningsChart) {
            this.earningsChart.destroy();
        }

        this.earningsChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'],
                datasets: [{
                    label: 'Доходы',
                    data: [18350, 22180, 19640, 26420, 28950, 31200, 19850],
                    borderColor: '#1FB8CD',
                    backgroundColor: 'rgba(31, 184, 205, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 6,
                    pointBackgroundColor: '#1FB8CD',
                    pointBorderColor: 'white',
                    pointBorderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(0,0,0,0.05)' },
                        ticks: {
                            callback: value => value.toLocaleString() + '₸'
                        }
                    },
                    x: {
                        grid: { display: false }
                    }
                }
            }
        });
    }

    updateUI() {
        this.updateBalance();
    }

    updateBalance() {
        const balanceEl = document.getElementById('balance');
        if (balanceEl) {
            balanceEl.textContent = `${this.appData.driver.balance.toLocaleString()}₸`;
        }
    }

    showNotification(title, message) {
        // Удаляем существующие уведомления
        const existing = document.querySelectorAll('.notification');
        existing.forEach(n => n.remove());
        
        // Создаем уведомление
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.innerHTML = `
            <div class="notification-content">
                <div class="notification-title">${title}</div>
                <div class="notification-message">${message}</div>
            </div>
        `;

        // Стили уведомления
        Object.assign(notification.style, {
            position: 'fixed',
            top: '90px',
            left: '16px',
            right: '16px',
            background: 'white',
            borderRadius: '12px',
            padding: '16px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
            zIndex: '9999',
            fontSize: '14px',
            transform: 'translateY(-20px)',
            opacity: '0',
            transition: 'all 0.3s ease'
        });

        const titleEl = notification.querySelector('.notification-title');
        const messageEl = notification.querySelector('.notification-message');
        
        if (titleEl) {
            titleEl.style.fontWeight = '600';
            titleEl.style.marginBottom = '4px';
            titleEl.style.color = '#212529';
        }
        
        if (messageEl) {
            messageEl.style.color = '#6C757D';
            messageEl.style.fontSize = '13px';
        }

        document.body.appendChild(notification);

        // Анимация появления
        setTimeout(() => {
            notification.style.transform = 'translateY(0)';
            notification.style.opacity = '1';
        }, 10);

        // Удаление через 3 секунды
        setTimeout(() => {
            notification.style.transform = 'translateY(-20px)';
            notification.style.opacity = '0';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
}

// Инициализация приложения
let app;

// Множественные точки входа для надежности
function initializeApp() {
    if (!app) {
        console.log('🎉 Запуск inDrive для Астаны...');
        app = new InDriveApp();
        window.app = app; // Делаем доступным глобально
    }
}

// Пробуем инициализировать при загрузке DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    // DOM уже загружен
    initializeApp();
}

// Дополнительная проверка при полной загрузке страницы
window.addEventListener('load', () => {
    if (!app) {
        initializeApp();
    }
});

// Обработка изменения размера окна
window.addEventListener('resize', () => {
    if (app?.map) {
        setTimeout(() => {
            try {
                app.map.invalidateSize();
                console.log('📐 Размер карты обновлен при изменении окна');
            } catch (e) {
                console.log('Обработка изменения размера завершена');
            }
        }, 100);
    }
});