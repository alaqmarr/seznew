export interface BridgeEvent {
  id: string;
  reference: string | null;
  name: string;
  mobile: string;
  email: string | null;
  occasionDate: Date;
  occasionDay: string | null;
  occasionTime: string;
  description: string;
  hall: string[];
  catererName: string;
  catererPhone: string;
  decoratorName: string | null;
  decoratorPhone: string | null;
  thaalCount: number;
  totalThaalsDone: number | null;
  sarkariThaalSet: number;
  bhaiSaabIzzan: boolean;
  muraqebeenIzzan?: boolean;
  benSaabIzzan: boolean;
  extraChilamchiLota: number;
  tablesAndChairs: number;
  mic: boolean;
  crockeryRequired: boolean;
  thaalForDevri: boolean;
  paat: boolean;
  masjidLight: boolean;
  crockeryStatus: "PENDING" | "NOT_REQUIRED" | "COMPLETED";
  acStartTime: string | null;
  partyTime: string | null;
  decorations: boolean;
  gasCount: number | null;
  menu: string | null;
  status: "BOOKED" | "CANCELLED" | "COMPLETED";
  eventType: "PUBLIC" | "PRIVATE";
  hallCounts: Record<string, number> | null;
  razaGranted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface BridgeHall {
  id: string;
  name: string;
  width: number | null;
  length: number | null;
}

export interface BridgeInventoryItem {
  id: string;
  name: string;
  category: string;
  totalQuantity: number;
  availableQuantity: number;
  unit: string;
}

const DEFAULT_BRIDGE_KEY = "sezsec-internal-bridge-key-2026";

function getBridgeBaseUrl(): string {
  const raw =
    process.env.JAMATEVENTS_API_URL ||
    process.env.NEXT_PUBLIC_JAMATEVENTS_URL ||
    "http://localhost:3000";
  return raw.trim().replace(/\/+$/, "");
}

function getBridgeHeaders(): Record<string, string> {
  const key = (process.env.SEZSEC_BRIDGE_KEY || DEFAULT_BRIDGE_KEY).trim();
  return {
    "Content-Type": "application/json",
    "x-sezsec-bridge-key": key,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function hydrateBridgeEvent(raw: any): BridgeEvent {
  return {
    ...raw,
    hall: Array.isArray(raw.hall) ? raw.hall.map(String) : [],
    occasionDate: new Date(raw.occasionDate),
    createdAt: raw.createdAt ? new Date(raw.createdAt) : new Date(),
    updatedAt: raw.updatedAt ? new Date(raw.updatedAt) : new Date(),
  };
}

export function parseEventTimeString(
  timeStr?: string | null
): { hours: number; minutes: number } {
  if (!timeStr) return { hours: 19, minutes: 30 };
  const trimmed = timeStr.trim();

  // Handle 12-hour format like "07:30 PM" or "7:30 am"
  const ampmMatch = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (ampmMatch) {
    let hours = parseInt(ampmMatch[1], 10);
    const minutes = parseInt(ampmMatch[2], 10);
    const period = ampmMatch[3].toUpperCase();
    if (period === "PM" && hours !== 12) hours += 12;
    if (period === "AM" && hours === 12) hours = 0;
    return { hours, minutes };
  }

  // Handle 24-hour format like "13:30"
  const twentyFourMatch = trimmed.match(/^(\d{1,2}):(\d{2})/);
  if (twentyFourMatch) {
    return {
      hours: parseInt(twentyFourMatch[1], 10) || 0,
      minutes: parseInt(twentyFourMatch[2], 10) || 0,
    };
  }

  return { hours: 19, minutes: 30 };
}

export async function fetchBridgeEvents(params?: {
  types?: Array<"PUBLIC" | "PRIVATE" | string>;
  excludeCancelled?: boolean;
  from?: Date | string;
  to?: Date | string;
  hasMenu?: boolean;
  ids?: string[];
  limit?: number;
  order?: "asc" | "desc";
}): Promise<BridgeEvent[]> {
  const url = new URL(`${getBridgeBaseUrl()}/api/bridge/events`);
  if (params?.types && params.types.length > 0) {
    url.searchParams.set("types", params.types.join(","));
  }
  if (params?.excludeCancelled) {
    url.searchParams.set("excludeCancelled", "true");
  }
  if (params?.from) {
    url.searchParams.set(
      "from",
      params.from instanceof Date ? params.from.toISOString() : params.from
    );
  }
  if (params?.to) {
    url.searchParams.set(
      "to",
      params.to instanceof Date ? params.to.toISOString() : params.to
    );
  }
  if (params?.hasMenu) {
    url.searchParams.set("hasMenu", "true");
  }
  if (params?.ids && params.ids.length > 0) {
    url.searchParams.set("ids", params.ids.join(","));
  }
  if (params?.limit) {
    url.searchParams.set("limit", String(params.limit));
  }
  if (params?.order) {
    url.searchParams.set("order", params.order);
  }

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: getBridgeHeaders(),
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`jamatevents bridge /events returned ${res.status}`);
  }

  const data = await res.json();
  return Array.isArray(data?.events)
    ? data.events.map(hydrateBridgeEvent)
    : [];
}

export async function fetchBridgeEventById(
  id: string
): Promise<BridgeEvent | null> {
  const res = await fetch(
    `${getBridgeBaseUrl()}/api/bridge/events/${encodeURIComponent(id)}`,
    {
      method: "GET",
      headers: getBridgeHeaders(),
      cache: "no-store",
    }
  );
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`jamatevents bridge /events/${id} returned ${res.status}`);
  }
  const data = await res.json();
  return data?.event ? hydrateBridgeEvent(data.event) : null;
}

export async function fetchBridgeMenu(
  mode: "today" | "upcoming"
): Promise<BridgeEvent | null> {
  const url = new URL(`${getBridgeBaseUrl()}/api/bridge/menu`);
  url.searchParams.set("mode", mode);

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: getBridgeHeaders(),
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`jamatevents bridge /menu returned ${res.status}`);
  }

  const data = await res.json();
  return data?.event ? hydrateBridgeEvent(data.event) : null;
}

export async function updateBridgeEventThaals(
  eventId: string,
  payload: {
    hallCounts?: Record<string, number>;
    totalOverride?: number;
    actorId?: string;
    actorName?: string;
  }
): Promise<{ ok: true; event: BridgeEvent } | { ok: false; error: string }> {
  const res = await fetch(
    `${getBridgeBaseUrl()}/api/bridge/events/${encodeURIComponent(eventId)}`,
    {
      method: "PATCH",
      headers: getBridgeHeaders(),
      body: JSON.stringify(payload),
      cache: "no-store",
    }
  );

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return {
      ok: false,
      error: data?.error || "Failed to update thaal count on jamatevents.",
    };
  }

  return {
    ok: true,
    event: hydrateBridgeEvent(data.event),
  };
}

export async function deleteBridgeEvent(
  eventId: string,
  actor?: { actorId?: string; actorName?: string }
): Promise<boolean> {
  const res = await fetch(
    `${getBridgeBaseUrl()}/api/bridge/events/${encodeURIComponent(eventId)}`,
    {
      method: "DELETE",
      headers: getBridgeHeaders(),
      body: JSON.stringify(actor || {}),
      cache: "no-store",
    }
  );
  return res.ok;
}

export async function fetchBridgeHalls(): Promise<BridgeHall[]> {
  const res = await fetch(`${getBridgeBaseUrl()}/api/bridge/halls`, {
    method: "GET",
    headers: getBridgeHeaders(),
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`jamatevents bridge /halls returned ${res.status}`);
  }

  const data = await res.json();
  return Array.isArray(data?.halls) ? data.halls : [];
}

export async function fetchBridgeInventory(): Promise<BridgeInventoryItem[]> {
  const res = await fetch(`${getBridgeBaseUrl()}/api/bridge/inventory`, {
    method: "GET",
    headers: getBridgeHeaders(),
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`jamatevents bridge /inventory returned ${res.status}`);
  }

  const data = await res.json();
  return Array.isArray(data?.items) ? data.items : [];
}
