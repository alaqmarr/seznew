import { fetchBridgeMenu } from "@/lib/jamatevents-api";
import { MenuModal } from "./MenuModal";

export async function MenuAlert() {
    try {
        const todaysEvent = await fetchBridgeMenu("today");

        if (!todaysEvent) return null;

        return (
            <MenuModal
                title={todaysEvent.description || todaysEvent.name}
                menu={todaysEvent.menu || "Menu details available on request."}
                time={todaysEvent.occasionTime}
                thaalCount={todaysEvent.thaalCount}
                halls={todaysEvent.hall || []}
                hallCounts={todaysEvent.hallCounts}
                occasionDate={todaysEvent.occasionDate.toISOString()}
            />
        );
    } catch (error) {
        console.error("Failed to fetch today's menu from jamatevents:", error);
        return null;
    }
}
