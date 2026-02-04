import { cn } from "@/lib/utils";

// 1. Ornate Card
// Glassmorphism + Gold Border + Shadow
export function OrnateCard({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <div
            className={cn(
                "relative rounded-2xl overflow-hidden backdrop-blur-xl bg-cream/90 border border-gold/30 shadow-[0_8px_30px_rgb(0,0,0,0.12)]",
                className
            )}
        >
            {/* Decorative Gold Corner Accent (Top Left) */}
            <div className="absolute top-0 left-0 w-16 h-16 border-t-2 border-l-2 border-gold/50 rounded-tl-2xl pointer-events-none" />
            {/* Decorative Gold Corner Accent (Bottom Right) */}
            <div className="absolute bottom-0 right-0 w-16 h-16 border-b-2 border-r-2 border-gold/50 rounded-br-2xl pointer-events-none" />

            <div className="relative z-10">
                {children}
            </div>
        </div>
    );
}

// 2. Golden Button
// Gradient Gold, dark text, premium hover
export function GoldenButton({
    children,
    className,
    ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
    return (
        <button
            className={cn(
                "relative px-8 py-3 rounded-lg font-bold transition-all duration-300",
                "bg-gradient-to-r from-gold via-gold-light to-gold shadow-md",
                "text-primary-dark border border-gold-dark/20",
                "hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]",
                "disabled:opacity-70 disabled:cursor-not-allowed",
                className
            )}
            {...props}
        >
            {children}
        </button>
    );
}

// 3. Ornate Heading
interface OrnateHeadingProps {
    title: string;
    subtitle?: string;
    arabic?: string;
    className?: string;
}

export function OrnateHeading({ title, subtitle, arabic, className = "" }: OrnateHeadingProps) {
    return (
        <div className={cn("text-center space-y-4", className)}>
            {arabic && (
                <p className="font-[family-name:var(--font-arabic)] text-4xl text-primary-dark/80">
                    {arabic}
                </p>
            )}

            <div className="inline-flex flex-col items-center justify-center w-fit mx-auto gap-2">
                <h1 className={cn(
                    "font-[family-name:var(--font-lobster)] text-5xl md:text-6xl text-primary-dark drop-shadow-sm",
                    "bg-clip-text text-transparent bg-gradient-to-r from-primary-dark via-primary to-primary-dark"
                )}>
                    {title}
                </h1>
                <div className="w-full h-1 bg-gradient-to-r from-transparent via-gold to-transparent rounded-full opacity-60" />
            </div>

            {subtitle && (
                <p className={cn(
                    "text-lg font-medium max-w-2xl mx-auto leading-relaxed",
                    "text-text-muted"
                )}>
                    {subtitle}
                </p>
            )}
        </div>
    );
}
