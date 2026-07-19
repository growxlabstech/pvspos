import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export function useInventory() {
  return useQuery({
    queryKey: ["inventory"],
    queryFn: async () => {
      const res = await fetch("/api/inventory");
      if (!res.ok) throw new Error("Failed to fetch inventory");
      return res.json();
    },
  });
}

export function useRestockMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, quantity }: { id: string; quantity: number }) => {
      const res = await fetch(`/api/inventory/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity }),
      });
      if (!res.ok) throw new Error("Failed to restock");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
    },
  });
}
