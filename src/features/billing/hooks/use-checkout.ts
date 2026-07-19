import { useMutation } from "@tanstack/react-query";
import { CheckoutPayload } from "../types/billing.types";

export function useCheckoutMutation() {
  return useMutation({
    mutationFn: async (payload: CheckoutPayload) => {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Checkout failed");
      return data;
    },
  });
}
