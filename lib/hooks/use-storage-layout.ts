import { useMutation, useQuery } from "@tanstack/react-query";

import { apiJson } from "@/lib/api/client";
import type { StorageLayoutData } from "@/lib/storage-layout/types";
import { queryClient } from "@/src/lib/query-client";
import { queryKeys } from "@/src/lib/query-keys";

export function useStorageLayout(enabled = true) {
  const query = useQuery({
    queryKey: queryKeys.boxes.layout,
    queryFn: () => apiJson<StorageLayoutData | null>("/api/admin/storage-layout"),
    enabled,
  });

  return {
    layout: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.error,
  };
}

export function useSaveStorageLayout() {
  return useMutation({
    mutationFn: (layout: StorageLayoutData) =>
      apiJson<StorageLayoutData>("/api/admin/storage-layout", {
        method: "PUT",
        body: JSON.stringify(layout),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.boxes.layout });
    },
  });
}

