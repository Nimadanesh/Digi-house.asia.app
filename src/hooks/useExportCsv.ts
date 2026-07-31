"use client";
import { useCallback, useState } from "react";
import { getRepo } from "@/lib/api/getRepo";
import { haptics } from "@/lib/telegram/haptics";

export function useExportCsv() {
  const [downloading, setDownloading] = useState(false);

  const download = useCallback(async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      haptics.impact("light");
      const csv = await getRepo().portfolio.exportCsv();
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "portfolio.csv";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  }, [downloading]);

  return { download, downloading };
}
