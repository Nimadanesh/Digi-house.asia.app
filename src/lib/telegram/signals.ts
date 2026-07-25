// File responsibility: thin re-export of the signals this app reads. No logic.
export {
  init,
  backButton,
  mainButton,
  hapticFeedback,
  themeParams,
  viewport,
  miniApp,
  closingBehavior,
  isTMA,
  mockTelegramEnv,
  retrieveLaunchParams,
  isLaunchParamsRetrieveError,
} from "@telegram-apps/sdk";
export type { SafeAreaInsets, ThemeParams } from "@telegram-apps/sdk";