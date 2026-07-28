# ContractAnalyzer — Expo SDK 54

Single Expo app. Entry: `index.ts` → `App.tsx` → `src/App.tsx`.

## Commands

```sh
npm start        # expo start (dev server)
npm run android  # expo start --android
npm run ios      # expo start --ios
npm run web      # expo start --web (dev, PWA works with web/ static files)
npm run build:web # expo export --platform web + PWA assets (dist/)
npm run typecheck # tsc --noEmit
npm run lint     # eslint . --ext .ts,.tsx
npm run format   # prettier --write src/**/*.{ts,tsx}
npm test         # jest
```

TypeScript strict, ESLint (`universe/native`), Prettier (120 print width, single quotes, trailing commas, arrow parens avoid).

## Environment

- `.env` requires `EXPO_PUBLIC_GEMINI_API_KEY` + `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`
- Portrait only — set in `app.json`

## Navigation

`src/navigation/AppNavigator.tsx` — bottom tabs (4) + root stack:
- **Tabs**: DashboardTab → HomeScreen, ScanTab → ScanPickerScreen, FilesTab → FilesScreen, SettingsTab → SettingsScreen
- **Root stack** (pushed from tabs): Scanner, ContractResult, ContractHistory, TSJScanner, TSJResult, TSJHistory, DrivePicker
- Tab screens use `useNavigation()` hook; root screens receive `{ navigation, route }` as props
- `navigation.replace()` for Scanner→Result, `navigation.popToTop()` from Result screens
- Param lists: `RootStackParamList`, `TabStackParamList` exported from AppNavigator

## Theme

`src/theme/ThemeContext.tsx` exposes both:
- `material: MaterialColors` — **use for all new code**. 40+ semantic tokens (`primary`, `onSurface`, `surfaceContainerLowest`, etc.) from `src/theme/colors.ts`
- `colors: ThemeColors` — legacy alias via `mapToLegacy()`. Avoid in new code.

Design tokens in `src/theme/tokens.ts`: `spacing` (unit1=4/unit2=8/unit4=16/unit6=24/unit8=32 — no unit3/unit5), `fontSize`, `borderRadius`, `shadow`.

## Gemini

`src/services/geminiService.ts` — falls through models on failure, returns raw JSON (`responseMimeType: "application/json"`). No markdown parsing needed. Prompts in Spanish (Venezuelan law) in `src/utils/prompts.ts`.
- **Caching**: In-memory cache with 30-min TTL, 50-entry max. Same image returns cached result.

## Storage

AsyncStorage keys: `theme`, `biometric_lock`, `retention_days`, `contract_history` (max 30), `tsj_history` (max 30). Service: `src/services/historyService.ts`.

## 4 contract types

`alquiler` | `compra-venta` | `laboral` | `seguros` — defined in `src/types/contract.ts`. Also exports `CONTRACT_TYPES`, `ICON_MAP`, `getContractLabel`. **Do not duplicate these in screens.**

## Gotchas

- **No `react-native-reanimated`** — incompatible with Expo Go at SDK 54. Use RN `Animated` API.
- **`CameraView` does not support children** — overlay must be outside in `<View style={StyleSheet.absoluteFill}>`.
- **Spacing tokens skip 3, 5, etc.** — use unit1/2/4/6/8 only. No unit3/5.
- **Lazy screens need prop forwarding** — `React.lazy` wrappers in AppNavigator pass `{...props}` to preserve navigation/route.
- **Web (PWA)**: Metro-based web (no webpack). `web/` dir has `index.html`, `manifest.json`, `service-worker.js`, `assets/`. Service worker uses manual network-first / cache-first strategies. `build:web` copies PWA files and injects manifest/SW into generated `dist/index.html`.
- **Camera on web**: `expo-camera` unavailable. ScannerScreen/TSJScannerScreen render a file-picker-only UI when `Platform.OS === 'web'`. BiometricGate auto-unlocks on web.

## Conventions

- Inline styles per file (no style modules). Import tokens from `src/theme/tokens.ts`.
- Shared components: `TopAppBar`, `ScanLine`, `RiskLabel`, `FileCard`, `AnimatedPressable` (has haptics), `LoadingOverlay`, `Toast`, `Skeleton` (+ SkeletonCard, SkeletonCardRow), `ErrorBoundary`.
- `expo-linear-gradient` imported as `LinearGradient`
- PDF: markdown→HTML via `src/services/pdfService.ts`, then `expo-print` → `expo-sharing`
- `useFocusEffect` + `useCallback` for screen-focus data refresh
- `MarkdownText` in `ResultScreen.tsx` parses `##`/`###`/`**bold**`/`-`/numbered lists into styled components
- Contract type picker: bottom sheet modal with `CONTRACT_TYPES`; used in HomeScreen + DrivePickerScreen
- `useDocumentScanner` hook (`src/hooks/`) shares camera/gallery/PDF logic between ScannerScreen and TSJScannerScreen
- History items support `starred` (boolean) and `notes` (string)
- `BiometricGate` in `App.tsx` wraps content; toggled via SettingsScreen
- Image >10MB triggers compression warning (`src/utils/imageCompression.ts`)
- Tests in `src/__tests__/` — `npm test` (jest, jest-expo preset)

## Performance Patterns

- **FlatList optimization**: `getItemLayout`, `windowSize={11}`, `maxToRenderPerBatch={10}`, `removeClippedSubviews` on HistoryScreen + TSJHistoryScreen
- **Lazy loading**: ResultScreen, TSJResultScreen use `React.lazy()` with Suspense fallback
- **Memoization**: `useMemo` for static data (contract types), `useCallback` for handlers
- **Error boundaries**: Wrap screens in `ErrorBoundary` component for graceful failure recovery
