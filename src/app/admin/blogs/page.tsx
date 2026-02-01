import { prisma } from "@/lib/db";
import { hasModuleAccess } from "@/lib/access-control";
import { deleteBlog } from "@/app/actions/blog";
import { Button } from "@/components/ui/button";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { OrnateHeading, OrnateCard } from "@/components/ui/premium-components";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import Link from "next/link";
import { Plus, Trash2 } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function BlogsAdminPage() {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
        redirect("/login");
    }

    const userId = (session.user as any).id;
    const role = (session.user as any).role;
    const isAdmin = role === "ADMIN";

    const canAccess = isAdmin || await hasModuleAccess(userId, "/admin/blogs");

    if (!canAccess) {
        redirect("/login");
    }

    const blogs = await prisma.blog.findMany({
        orderBy: { createdAt: 'desc' }
    });

    return (
        <div className="min-h-screen bg-background-light py-12 px-6 mt-12">
            <div className="max-w-6xl mx-auto space-y-8">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    <OrnateHeading title="Blog Management" subtitle="Share news and updates" className="mb-0" />
                    <Link href="/admin/blogs/new">
                        <Button className="bg-gold hover:bg-gold-dark text-primary-dark font-bold rounded-full px-8 py-6 shadow-xl shadow-gold/10 transition-all transform hover:scale-105">
                            <Plus className="w-5 h-5 mr-2" />
                            Write New Post
                        </Button>
                    </Link>
                </div>

                <OrnateCard className="p-0 overflow-hidden border border-gold/20 shadow-2xl bg-white/90 backdrop-blur-xl">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-primary-dark/5 hover:bg-primary-dark/5 border-b border-primary/10">
                                    <TableHead className="py-5 px-8 text-primary-dark font-bold uppercase tracking-wider text-xs w-1/2">Title</TableHead>
                                    <TableHead className="py-5 px-6 text-primary-dark font-bold uppercase tracking-wider text-xs">Author</TableHead>
                                    <TableHead className="py-5 px-6 text-primary-dark font-bold uppercase tracking-wider text-xs">Published</TableHead>
                                    <TableHead className="py-5 px-6 text-primary-dark font-bold uppercase tracking-wider text-xs text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {blogs.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-24 text-neutral-400">
                                            <p className="font-serif text-lg text-neutral-600 mb-1">No blog posts yet</p>
                                            <p className="text-sm">Click "Write New Post" to get started.</p>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    blogs.map((blog) => (
                                        <TableRow key={blog.id} className="hover:bg-gold/5 transition-colors border-b border-neutral-100 text-sm">
                                            <TableCell className="py-5 px-8">
                                                <span className="font-serif font-bold text-lg text-primary-dark block mb-1">{blog.title}</span>
                                                <span className="text-xs text-neutral-500 line-clamp-1">{blog.id}</span>
                                            </TableCell>
                                            <TableCell className="py-5 px-6">
                                                <span className="font-medium text-neutral-700">{blog.author}</span>
                                            </TableCell>
                                            <TableCell className="py-5 px-6">
                                                <span className="text-neutral-500 font-medium">{format(new Date(blog.createdAt), "PPP")}</span>
                                            </TableCell>
                                            <TableCell className="py-5 px-6 text-right">
                                                <form action={deleteBlog.bind(null, blog.id)}>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </form>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </OrnateCard>
            </div>
        </div>
    );
}
