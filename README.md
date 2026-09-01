# Kayora Admin Dashboard

A modern, cross-platform admin dashboard application built with **Expo**, **React Native**, and **TypeScript**. Manage customers, drivers, products, vehicles, and orders from a single unified interface.

## ✨ Features

- **Cross-Platform Support**: Works seamlessly on iOS, Android, and Web
- **Admin Authentication**: Secure login system with role-based access control
- **Dashboard Overview**: Real-time analytics and key metrics
- **Customer Management**: View, manage, and track customer information
- **Driver Management**: Monitor drivers, assign tasks, and track GPS location
- **Product Management**: Manage product catalog and inventory
- **Vehicle Management**: Track and manage vehicle fleet
- **Order Management**: Process and track customer orders
- **Offline Support**: Offline mode detection and graceful degradation
- **Push Notifications**: Real-time alerts and notifications
- **Responsive Design**: Optimized for mobile and web interfaces
- **Dark/Light Theme Support**: Automatic theme switching based on system settings
- **Map Integration**: MapLibre for driver tracking and location visualization

## 🛠️ Tech Stack

### Core Framework

- **Expo** (v57.0.2): React Native development platform
- **React** (19.2.3): UI library
- **React Native** (0.86.0): Cross-platform mobile framework
- **Expo Router** (57.0.3): File-based routing system

### UI & Styling

- **@expo/ui**: Expo design system components
- **React Native Gesture Handler**: Gesture recognition
- **React Native Reanimated**: Animation library
- **React Native Linear Gradient**: Gradient effects
- **Expo Glass Effect**: Blur and glass morphism effects

### Data Visualization

- **React Native Gifted Charts**: Chart and graph components
- **MapLibre React Native**: Maps and location visualization

### Storage & Security

- **AsyncStorage**: Local data persistence
- **Expo Secure Store**: Secure credential storage
- **Expo Image Picker**: Camera and gallery integration

### Development Tools

- **TypeScript** (6.0.3): Type-safe programming
- **Expo Lint**: Code quality and linting

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **npm** (v8 or higher) or **yarn**
- **Expo CLI** (can be installed globally or used via npx)
- **Android Studio** (for Android development) or **Xcode** (for iOS development)
- **Git** (for version control)

Optional but recommended:

- **Visual Studio Code** with Expo extensions
- **Postman** (for API testing)

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/kayora.git
cd kayora
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env.local` file in the project root (if needed):

```env
EXPO_PUBLIC_API_BASE_URL=https://api.kayora.com
EXPO_PUBLIC_APP_ENV=development
```

### 4. Verify Installation

```bash
npm run lint
```

## 🎯 Getting Started

### Start Development Server

```bash
npm start
```

This will launch the Expo development server and display options to:

- Open in Android Emulator
- Open in iOS Simulator
- Open in Expo Go (mobile app)
- Open in Web Browser

### Run on Specific Platforms

#### Android

```bash
npm run android
```

#### iOS (macOS only)

```bash
npm run ios
```

#### Web

```bash
npm run web
```

### Reset Project

To start with a clean slate:

```bash
npm run reset-project
```

This moves existing code to `app-example/` and creates a blank `app/` directory.

## 📁 Project Structure

```
kayora/
├── src/
│   ├── app/                          # Application screens (Expo Router)
│   │   ├── _layout.tsx              # Root layout
│   │   ├── index.tsx                # Home screen
│   │   ├── (auth)/                  # Authentication group
│   │   │   ├── login.tsx            # Login screen
│   │   │   └── _layout.tsx
│   │   └── admin/                   # Admin dashboard routes
│   │       ├── dashboard.tsx        # Dashboard overview
│   │       ├── customers.tsx        # Customer management
│   │       ├── drivers.tsx          # Driver management
│   │       ├── orders.tsx           # Order management
│   │       ├── products.tsx         # Product management
│   │       ├── vehicles.tsx         # Vehicle management
│   │       ├── manage-admins.tsx    # Admin user management
│   │       ├── settings.tsx         # Application settings
│   │       └── _layout.tsx
│   │
│   ├── components/                  # Reusable React components
│   │   ├── OfflineGate.tsx          # Offline mode wrapper
│   │   ├── OfflineScreen.tsx        # Offline UI
│   │   ├── cards/                   # Card components
│   │   │   └── StatCard.tsx         # Statistics display card
│   │   ├── charts/                  # Data visualization
│   │   │   ├── CategoryPieChart.tsx
│   │   │   ├── OrdersLineChart.tsx
│   │   │   └── RevenueBarChart.tsx
│   │   ├── customers/               # Customer-related components
│   │   │   ├── CustomerTable.tsx
│   │   │   ├── CustomerCard.tsx
│   │   │   ├── CustomerAvatar.tsx
│   │   │   ├── DeleteCustomerModal.tsx
│   │   │   ├── DistributorApplicationModal.tsx
│   │   │   ├── InactivationRequestsModal.tsx
│   │   │   ├── CustomersSkeleton.tsx
│   │   │   └── EmptyState.tsx
│   │   ├── drivers/                 # Driver-related components
│   │   │   ├── DriverTable.tsx
│   │   │   ├── DriverCard.tsx
│   │   │   ├── DriverAvatar.tsx
│   │   │   ├── DriverTrackingMap.native.tsx
│   │   │   ├── DriverTrackingMap.web.tsx
│   │   │   ├── DeleteDriverModal.tsx
│   │   │   ├── SetDriverPasswordModal.tsx
│   │   │   ├── StatsCards.tsx
│   │   │   └── DriversSkeleton.tsx
│   │   ├── dashboard/               # Dashboard-specific components
│   │   │   └── DashboardOverview.tsx
│   │   ├── form/                    # Form components
│   │   ├── layout/                  # Layout components
│   │   ├── orders/                  # Order-related components
│   │   ├── products/                # Product-related components
│   │   ├── sidebar/                 # Sidebar navigation
│   │   └── table/                   # Table components
│   │
│   ├── context/                     # React Context for state management
│   │   └── AdminAuthContext.tsx     # Authentication state
│   │
│   ├── contexts/                    # Additional contexts
│   │   └── ThemeContext.tsx         # Theme management
│   │
│   ├── hooks/                       # Custom React hooks
│   │   ├── useAdminAlerts.ts        # Alert notifications
│   │   ├── useAdminPushNotifications.ts
│   │   ├── useNetworkStatus.ts      # Offline/online detection
│   │   └── useResponsive.ts         # Responsive design
│   │
│   ├── services/                    # API and business logic
│   │   ├── adminApi.ts              # API client configuration
│   │   ├── AdminNotificationService.tsx
│   │   ├── adminSettings.ts
│   │   ├── CustomerService.ts
│   │   ├── DashboardServices.ts
│   │   ├── drivers.ts
│   │   ├── orders.ts
│   │   ├── ProductService.ts
│   │   └── vehicles.ts
│   │
│   ├── types/                       # TypeScript type definitions
│   │   ├── adminRoles.ts
│   │   ├── adminSettings.ts
│   │   ├── customer.ts
│   │   ├── dashboard.ts
│   │   ├── driver.ts
│   │   ├── order.ts
│   │   ├── product.ts
│   │   └── vehicle.ts
│   │
│   ├── utils/                       # Utility functions
│   │   └── formatters.ts            # Data formatting helpers
│   │
│   ├── demo/                        # Demo/mock data
│   │   ├── customersDemoData.ts
│   │   ├── dashboradDemoData.ts
│   │   ├── driversDemoData.ts
│   │   ├── ordersDemoData.ts
│   │   ├── productDemoData.ts
│   │   └── vehiclesDemoData.ts
│   │
│   ├── constants/                   # Application constants
│   └── global.css                   # Global styles
│
├── android/                         # Android native code
├── assets/                          # Images, icons, and other assets
├── scripts/                         # Utility scripts
├── app.json                         # Expo configuration
├── eas.json                         # EAS Build configuration
├── tsconfig.json                    # TypeScript configuration
├── package.json                     # Project dependencies
├── expo-env.d.ts                    # Environment type definitions
└── README.md                        # This file
```

## 📜 Available Scripts

### Development

```bash
npm start              # Start Expo development server
npm run web           # Run web version
npm run android       # Build and run on Android
npm run ios           # Build and run on iOS
npm run lint          # Run ESLint and code quality checks
```

### Project Management

```bash
npm run reset-project # Reset project to blank state
```

## 🏗️ Architecture Overview

### State Management

- **React Context API**: Admin authentication state management
- **AsyncStorage**: Local persistent data storage
- **React Hooks**: Local component state

### Navigation

- **Expo Router**: File-based routing system
- Route groups for organizing screens (auth, admin)
- Type-safe route navigation with TypeScript

### API Integration

- Centralized API client (`adminApi.ts`)
- Service layer for business logic
- Error handling and request/response interceptors

### Offline Support

- Network status detection via `useNetworkStatus` hook
- `OfflineGate` wrapper component for offline mode
- Local data caching with AsyncStorage

## ⚙️ Configuration

### Expo Configuration (`app.json`)

- App name: Kayora
- Package: com.kayora.admin (Android)
- Plugins: Expo Router, Splash Screen, Secure Store, MapLibre, Image Picker
- EAS Project ID: 968ff355-b29d-4017-8087-9603872b903e
- OTA Updates enabled via Expo Update service

### TypeScript Configuration

- Target: ES2020
- Module: ESNext
- Strict mode enabled
- JSX support: React-JSX

### Theme Support

- Automatic theme detection (light/dark)
- Customizable via `ThemeContext`

## 🔌 API Integration

All API calls are handled through the service layer located in `src/services/`:

```typescript
// Example: Customer API
import { CustomerService } from "@/services/CustomerService";

const customers = await CustomerService.getAll();
const customer = await CustomerService.getById(id);
```

Services include:

- `adminApi.ts` - Base HTTP client
- `CustomerService.ts` - Customer operations
- `DashboardServices.ts` - Dashboard metrics
- `ProductService.ts` - Product management
- `drivers.ts` - Driver operations
- `orders.ts` - Order management
- `vehicles.ts` - Vehicle management

## 🧪 Testing

Run linting checks:

```bash
npm run lint
```

For unit tests, follow the [Expo testing guide](https://docs.expo.dev/develop/unit-testing/).

## 📱 Platform-Specific Code

Use platform-specific file extensions:

- `.native.tsx` - iOS and Android only
- `.web.tsx` - Web only

Example:

```
DriverTrackingMap.native.tsx  # Mobile implementation
DriverTrackingMap.web.tsx     # Web implementation
```

## 🔐 Security Considerations

- Authentication tokens stored in Secure Store
- Environment variables for sensitive data
- API endpoints configured via environment
- Role-based access control for admin features

## 📦 Build & Deployment

### Local Build

```bash
eas build --platform android   # Android build
eas build --platform ios       # iOS build
```

### Preview Build

```bash
eas build --platform android --profile preview
```

### Production Build

```bash
eas build --platform android --profile production
```

See [EAS Build Documentation](https://docs.expo.dev/build/introduction/) for more details.

## 🤝 Contributing

1. Create a feature branch (`git checkout -b feature/AmazingFeature`)
2. Commit changes (`git commit -m 'Add AmazingFeature'`)
3. Push to branch (`git push origin feature/AmazingFeature`)
4. Open a Pull Request

### Code Style

- Use TypeScript for type safety
- Follow ESLint rules via `npm run lint`
- Format code with Prettier (if configured)
- Use meaningful variable and function names

## 📄 License

This project is licensed under the [MIT License](LICENSE) - see the LICENSE file for details.

## 📚 Resources

### Official Documentation

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [Expo Router Guide](https://docs.expo.dev/router/introduction/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

### Learning Resources

- [Expo Learn](https://expo.dev/learn)
- [React Native Tutorial](https://reactnative.dev/docs/getting-started)
- [EAS Build Guide](https://docs.expo.dev/build/introduction/)

### Tools & Extensions

- [Expo Go](https://expo.dev/go) - Mobile app for testing
- [VS Code Expo Extension](https://marketplace.visualstudio.com/items?itemName=expo.expo)

## 🐛 Troubleshooting

### Common Issues

**Metro bundler issues:**

```bash
npm start -- --reset-cache
```

**Dependency conflicts:**

```bash
npm install --legacy-peer-deps
```

**Clear Expo cache:**

```bash
expo start --reset-cache
```

**Network connection errors:**

- Ensure the backend API is running and accessible
- Check environment variables
- Verify firewall settings

### Getting Help

- Check [Expo Issues](https://github.com/expo/expo/issues)
- Visit [Expo Forums](https://forums.expo.dev/)
- Create an issue in this repository
- Check [React Native Documentation](https://reactnative.dev/docs/troubleshooting)

## 📞 Support & Contact

For questions and support:

- 📧 Email: support@kayora.com
- 💬 Discord: [Join our community](https://discord.gg/kayora)
- 🐙 GitHub Issues: [Report a bug](https://github.com/yourusername/kayora/issues)

## 🙏 Acknowledgments

- [Expo](https://expo.dev) for the fantastic development platform
- [React Native](https://reactnative.dev) community
- [MapLibre](https://maplibre.org/) for mapping solutions
- All contributors and users

---

**Last Updated:** September 2026  
**Expo Version:** 57.0.2  
**React Native Version:** 0.86.0
