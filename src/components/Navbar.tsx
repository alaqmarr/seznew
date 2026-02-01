import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NavbarClient } from "./NavbarClient";
import { getNavModules } from "@/lib/access-control";

export async function Navbar() {
    const session = await getServerSession(authOptions);
    const userModules = session?.user ? await getNavModules() : [];

    return <NavbarClient session={session} userModules={userModules} />;
}
