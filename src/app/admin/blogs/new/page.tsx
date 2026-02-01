import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { BlogForm } from "@/components/forms/BlogForm";

export const dynamic = 'force-dynamic';

export default async function NewBlogPage() {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
        redirect("/login");
    }

    return (
        <div className="min-h-screen bg-background-light py-12 px-6 mt-12">
            <div className="max-w-4xl mx-auto">
                <BlogForm />
            </div>
        </div>
    );
}
