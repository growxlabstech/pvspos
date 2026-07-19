import { useQuery } from "@tanstack/react-query";

export function useSales(search = "") {
  return useQuery({
    queryKey: ["sales", search],
    queryFn: async () => {
      const url = new URL("/api/sales", window.location.origin);
      if (search) url.searchParams.append("search", search);
      
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch sales");
      return res.json();
    },
  });
}

export function useSaleDetail(id: string) {
  return useQuery({
    queryKey: ["sales", id],
    queryFn: async () => {
      if (!id) return null;
      const res = await fetch(`/api/sales/${id}`);
      if (!res.ok) throw new Error("Failed to fetch sale detail");
      return res.json();
    },
    enabled: !!id,
  });
}
