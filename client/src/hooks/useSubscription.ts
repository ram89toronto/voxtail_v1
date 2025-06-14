import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Subscription } from "@shared/schema";

export function useSubscription() {
  const queryClient = useQueryClient();

  const { data: subscription, isLoading } = useQuery<Subscription>({
    queryKey: ["/api/subscription"],
  });

  const upgradeMutation = useMutation({
    mutationFn: async (plan: "free" | "pro") => {
      return apiRequest("POST", "/api/subscription/upgrade", { plan });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subscription"] });
    },
  });

  return {
    subscription,
    isLoading,
    isPro: subscription?.plan === "pro",
    isFree: subscription?.plan === "free",
    upgrade: upgradeMutation.mutateAsync,
    isUpgrading: upgradeMutation.isPending,
  };
}