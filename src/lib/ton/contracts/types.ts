// File responsibility: typing for SC getter calls and outbound message bodies.
// Phase 2 skeleton — NOT wired into the app yet. Phase 6+ real contracts extend these.
import type { Cell } from "@ton/core";
import type { NanoTon } from "@/types/units";

export type GetterReturn = string | number | bigint | boolean | Cell | null;

export interface GetterCall<T extends GetterReturn = GetterReturn> {
  /** GET-method name on the contract. */
  name: string;
  /** Stack arguments in source order (TVM stack values). */
  args?: GetterReturn[];
  /** Decode the raw TVM stack slice into the typed return. */
  decode: (stack: unknown) => T;
}

export interface SendMessageBody {
  /** 32-bit operation code (stored first in the message body cell). */
  opCode: number;
  /** The payload cell, or a lazy builder. */
  body: Cell | (() => Cell);
  /** Value to attach, in nanoTON. Optional — defaults to 0 in the caller. */
  nanoTonValue?: NanoTon | bigint;
}