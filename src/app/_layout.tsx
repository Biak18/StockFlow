import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { Appearance, StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { ErrorBoundary } from "@/components/feedback/ErrorBoundary";
import { ConfirmDialogHost } from "@/components/ui/ConfirmDialogHost";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { getDatabase } from "@/database/client";
import { authService } from "@/features/auth";
import { resolveWorkspace } from "@/features/auth/services/resolve-workspace";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { setupNotificationChannels } from "@/services/notifications/low-stock";
import { registerAndSavePushToken } from "@/services/notifications/register-push";
import { supabase } from "@/services/supabase";
import { syncEngine } from "@/services/sync/sync-engine";
import { loadThemeMode } from "@/services/theme-storage";
import { useAuthStore, useUIStore } from "@/stores";
import * as Notifications from "expo-notifications";
import * as SystemUI from "expo-system-ui";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useNetworkStatus();

  const router = useRouter();
  const segments = useSegments();

  const theme = useUIStore((s) => s.theme);
  const isOnline = useUIStore((s) => s.isOnline);
  const hydrateThemeMode = useUIStore((s) => s.hydrateThemeMode);
  const syncSystemScheme = useUIStore((s) => s.syncSystemScheme);

  const isInitialized = useAuthStore((s) => s.isInitialized);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isResolvingOrg = useAuthStore((s) => s.isResolvingOrg);
  const organization = useAuthStore((s) => s.currentOrganization);

  const setInitialized = useAuthStore((s) => s.setInitialized);
  const setSession = useAuthStore((s) => s.setSession);
  const setProfile = useAuthStore((s) => s.setProfile);
  const setOrganization = useAuthStore((s) => s.setOrganization);
  const setResolvingOrg = useAuthStore((s) => s.setResolvingOrg);
  const reset = useAuthStore((s) => s.reset);

  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((res) => {
      const filter = res.notification.request.content.data?.filter;
      if (filter === "low" || filter === "out") {
        router.push("/(app)/products"); // chips can read a global param later
      }
    });
    setupNotificationChannels();
    return () => sub.remove();
  }, []);

  // Theme hydrate + system scheme
  useEffect(() => {
    let mounted = true;

    (async () => {
      const stored = await loadThemeMode();
      if (!mounted) return;

      hydrateThemeMode(stored ?? "system");
      syncSystemScheme(Appearance.getColorScheme()!);
    })();

    const sub = Appearance.addChangeListener(({ colorScheme }) => {
      syncSystemScheme(colorScheme);
    });

    return () => {
      mounted = false;
      sub.remove();
    };
  }, [hydrateThemeMode, syncSystemScheme]);

  // System bar background
  useEffect(() => {
    SystemUI.setBackgroundColorAsync(theme.colors.background);
  }, [theme.colors.background]);

  // Offline → online sync
  useEffect(() => {
    if (isOnline) {
      syncEngine.flush();
    }
  }, [isOnline]);

  // Bootstrap session + org
  useEffect(() => {
    let isMounted = true;

    async function bootstrap() {
      try {
        await getDatabase();

        const session = await authService.getSession();

        if (session?.user && isMounted) {
          setSession(session);
          setResolvingOrg(true);
          registerAndSavePushToken(session.user.id).catch(console.warn);
          try {
            const profile = await authService.getProfile(session.user.id);
            if (profile) setProfile(profile);

            const workspace = await resolveWorkspace(session.user.id);
            if (workspace) {
              setOrganization(workspace.organization, workspace.membership);
            } else {
              setOrganization(null, null);
            }
          } finally {
            setResolvingOrg(false);
          }
        } else if (isMounted) {
          setSession(null);
          setOrganization(null, null);
        }
      } catch (error) {
        console.error("Bootstrap failed:", error);
        if (isMounted) {
          setSession(null);
          setOrganization(null, null);
          setResolvingOrg(false);
        }
      } finally {
        if (isMounted) {
          setInitialized(true);
          await SplashScreen.hideAsync();
        }
      }
    }

    bootstrap();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;

        if (event === "SIGNED_OUT") {
          reset();
          return;
        }

        if (event === "SIGNED_IN" && useAuthStore.getState().isResolvingOrg) {
          setSession(session);
          return;
        }

        setSession(session);

        if (
          session?.user &&
          (event === "SIGNED_IN" || event === "TOKEN_REFRESHED")
        ) {
          if (event === "TOKEN_REFRESHED") return; // session only

          setResolvingOrg(true);
          try {
            const profile = await authService.getProfile(session.user.id);
            setProfile(profile);

            const workspace = await resolveWorkspace(session.user.id);
            if (workspace) {
              setOrganization(workspace.organization, workspace.membership);
            } else {
              setOrganization(null, null);
            }
          } catch (err) {
            console.error("Failed to load user data after auth change", err);
          } finally {
            setResolvingOrg(false);
          }
        }
      },
    );

    return () => {
      isMounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  // Auth guard
  // useEffect(() => {
  //   if (!isInitialized || isResolvingOrg) return;

  //   const inAuthGroup = segments[0] === "(auth)";
  //   const currentScreen = segments[1];
  //   const hasOrganization = !!organization;

  //   if (!isAuthenticated) {
  //     if (!inAuthGroup) {
  //       router.replace("/(auth)/login");
  //     }
  //     return;
  //   }

  //   if (!hasOrganization) {
  //     if (currentScreen !== "create-organization") {
  //       router.replace("/(auth)/create-organization");
  //     }
  //     return;
  //   }

  //   if (inAuthGroup) {
  //     router.replace("/(app)");
  //   }
  // }, [
  //   isInitialized,
  //   isResolvingOrg,
  //   isAuthenticated,
  //   organization,
  //   segments,
  //   router,
  // ]);

  const booting = !isInitialized || isResolvingOrg;

  const inApp = isAuthenticated && !!organization;
  const needsOrg = isAuthenticated && !organization;
  const loggedOut = !isAuthenticated;
  return (
    <ErrorBoundary>
      <GestureHandlerRootView
        style={{ flex: 1, backgroundColor: theme.colors.background }}
      >
        <KeyboardProvider>
          <SafeAreaProvider>
            <StatusBar style={theme.mode === "dark" ? "light" : "dark"} />

            {booting ? (
              <LoadingScreen />
            ) : (
              <Stack
                screenOptions={{
                  headerShown: false,
                  animation: "fade", // softer than default push
                  contentStyle: { backgroundColor: theme.colors.background },
                }}
              >
                <Stack.Protected guard={inApp}>
                  <Stack.Screen name="(app)" />
                </Stack.Protected>

                {/* <Stack.Protected guard={needsOrg}>
                  <Stack.Screen name="(auth)/create-organization" />
                </Stack.Protected> */}

                <Stack.Protected guard={loggedOut || needsOrg}>
                  <Stack.Screen name="(auth)" />
                </Stack.Protected>
              </Stack>
            )}

            <ConfirmDialogHost />
          </SafeAreaProvider>
        </KeyboardProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
