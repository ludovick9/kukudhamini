import { Serwist } from "serwist";

declare const self: typeof globalThis & {
  __SW_MANIFEST: Array<{ revision: string | null; url: string }>;
};

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
});

serwist.addEventListeners();
