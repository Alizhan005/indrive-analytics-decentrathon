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
            }
        };
    }
}

// Инициализация приложения
let app;
function initializeApp() {
    if (!app) {
        console.log('🎉 Запуск inDrive для Астаны...');
        app = new InDriveApp();
        window.app = app;
    }
}
initializeApp();
