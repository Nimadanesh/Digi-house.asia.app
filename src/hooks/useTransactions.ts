"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getRepo } from "@/lib/api/getRepo";

const PAGE_SIZE = 50;

export function useTransactions() {
  const [offset, setOffset] = useState(0);

  const query = useQuery({
    queryKey: ["transactions", offset],
    queryFn: () => getRepo().tx.listTransactions({ limit: PAGE_SIZE, offset }),
    staleTime: 30_000,
  });

  const loadMore = () => {
    if (query.data?.hasMore) {
      setOffset((o) => o + PAGE_SIZE);
    }
  };

  return {
    transactions: query.data?.transactions ?? [],
    hasMore: query.data?.hasMore ?? false,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    loadMore,
    refetch: query.refetch,
  };
}
