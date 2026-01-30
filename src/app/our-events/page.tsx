import { prisma } from "@/lib/db";
import { format } from "date-fns";
import { OrnateCard, OrnateHeading } from "@/components/ui/premium-components";

export const dynamic = 'force-dynamic';

export default async function BlogsPage() {
    const blogs = await prisma.blog.findMany({
        orderBy: {
            publishedAt: 'desc'
        }
    });

    return (
        <div className="min-h-screen py-12 px-4 md:px-8 mt-12">
            <div className="max-w-4xl mx-auto space-y-12">
                <OrnateHeading
                    title="Our Stories"
                    subtitle="Updates and highlights from our community engagements"
                    arabic="أخبارنا"
                />

                {blogs.length === 0 ? (
                    <OrnateCard className="text-center py-20 px-8">
                        <h3 className="text-2xl font-serif font-bold text-primary-dark">No posts yet</h3>
                        <p className="text-text-muted mt-2 text-lg">Check back later for community updates.</p>
                    </OrnateCard>
                ) : (
                    <div className="space-y-10">
                        {blogs.map((blog) => (
                            <OrnateCard key={blog.id} className="p-8 md:p-10 hover:shadow-2xl transition-all duration-300">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-4 text-sm font-bold tracking-wider text-gold uppercase">
                                        <span>{format(blog.publishedAt, "MMMM do, yyyy")}</span>
                                        <span className="w-1 h-1 rounded-full bg-gold"></span>
                                        <span>{blog.author}</span>
                                    </div>
                                    <h2 className="text-3xl md:text-4xl font-[family-name:var(--font-lobster)] font-bold text-primary-dark leading-tight tracking-wide">
                                        {blog.title}
                                    </h2>
                                    <div className="w-16 h-[2px] bg-gold/50"></div>
                                    <div
                                        className="prose max-w-none text-text-muted text-lg leading-relaxed font-light [&_img]:rounded-xl [&_img]:shadow-lg [&_p]:mb-4"
                                        dangerouslySetInnerHTML={{ __html: blog.content }}
                                    />
                                </div>
                            </OrnateCard>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
