import {
  useAuthStore,
  useCategoriesStore,
  useProductsStore,
  useSuppliersStore,
} from "@/stores";
import { useState } from "react";
import { AuthError, authService } from "../services/auth-service";

export function useSignOut() {
  const reset = useAuthStore((s) => s.reset);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signOut = async () => {
    try {
      setLoading(true);
      setError(null);

      await authService.signOut();
      reset();
      useProductsStore.getState().reset();
      useCategoriesStore.getState().reset();
      useSuppliersStore.getState().reset();
      // Guard in root layout will also catch this, but we navigate explicitly for speed
      // router.replace("/(auth)/login");
    } catch (err) {
      const message = err instanceof AuthError
        ? err.message
        : "Failed to sign out. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return { signOut, loading, error };
}
