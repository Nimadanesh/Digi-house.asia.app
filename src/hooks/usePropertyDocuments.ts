"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { getRepo } from "@/lib/api/getRepo";

export function usePropertyDocuments(propertyId: string | null) {
  const list = useQuery({
    queryKey: ["property-documents", propertyId],
    queryFn: () => getRepo().documents.list(propertyId!),
    enabled: Boolean(propertyId),
    staleTime: 60_000,
  });

  const download = useMutation({
    mutationFn: (docId: string) =>
      getRepo().documents.getDownloadUrl(propertyId!, docId),
    onSuccess: (data) => {
      window.open(data.url, "_blank");
    },
  });

  return {
    documents: list.data ?? [],
    isLoading: list.isLoading,
    isError: list.isError,
    error: list.error,
    download,
  };
}
