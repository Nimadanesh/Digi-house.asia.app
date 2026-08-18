"use client";
// File responsibility: Telegram requestContact for phone prefills (TMA only).
import { useCallback, useState } from "react";
import { requestContact } from "@telegram-apps/sdk";

export function useRequestTelegramContact(): {
  available: boolean;
  requesting: boolean;
  requestPhone: () => Promise<string | null>;
} {
  const available =
    typeof requestContact.isAvailable === "function"
      ? requestContact.isAvailable()
      : false;

  const [requesting, setRequesting] = useState(false);

  const requestPhone = useCallback(async (): Promise<string | null> => {
    if (!requestContact.isAvailable()) return null;
    setRequesting(true);
    try {
      const data = await requestContact();
      const phone = data.contact?.phone_number?.trim();
      if (!phone) return null;
      return phone.startsWith("+") ? phone : `+${phone}`;
    } catch {
      return null;
    } finally {
      setRequesting(false);
    }
  }, []);

  return { available, requesting, requestPhone };
}
