"use client";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function hash32(input: string, seed: number): number {
  let h = seed >>> 0;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function toHex32(value: number): string {
  return value.toString(16).padStart(8, "0");
}

function deterministicUuid(source: string): string {
  const h1 = hash32(source, 0x811c9dc5);
  const h2 = hash32(source, 0x9e3779b1);
  const h3 = hash32(source, 0xc2b2ae35);
  const h4 = hash32(source, 0x27d4eb2f);

  const hex = `${toHex32(h1)}${toHex32(h2)}${toHex32(h3)}${toHex32(h4)}`.slice(
    0,
    32,
  );

  const part1 = hex.slice(0, 8);
  const part2 = hex.slice(8, 12);
  const part3 = `4${hex.slice(13, 16)}`;
  const variantNibble = ((parseInt(hex[16], 16) & 0x3) | 0x8).toString(16);
  const part4 = `${variantNibble}${hex.slice(17, 20)}`;
  const part5 = hex.slice(20, 32);

  return `${part1}-${part2}-${part3}-${part4}-${part5}`;
}

export function toRemoteUuid(value: string): string {
  const candidate = (value ?? "").trim().toLowerCase();
  if (UUID_REGEX.test(candidate)) return candidate;
  return deterministicUuid(candidate || "npp-empty-id");
}
