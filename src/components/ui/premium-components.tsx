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
export function OrnateHeading({
    title,
    subtitle,
    arabic,
    className,
    isDarkBg = false,
}: {
    title: string;
    subtitle?: string;
    arabic?: string;
    className?: string;
    isDarkBg?: boolean;
}) {
    return (
        <div className={cn("text-center space-y-3 mb-8", className)}>
            {arabic && (
                <p className={cn(
                    "font-arabic text-3xl mb-2 drop-shadow-sm",
                    isDarkBg ? "text-gold" : "text-primary"
                )}>
                    {arabic}
                </p>
            )}
            <h1 className={cn(
                "text-5xl md:text-6xl font-[family-name:var(--font-lobster)] font-bold tracking-wide drop-shadow-lg py-2",
                isDarkBg ? "text-gold" : "text-primary"
            )}>
                {title}
            </h1>
            <div className="mx-auto w-32 h-1.5 bg-gradient-to-r from-transparent via-gold to-transparent rounded-full" />
            {subtitle && (
                <p className={cn(
                    "text-lg font-medium max-w-2xl mx-auto leading-relaxed",
                    isDarkBg ? "text-cream/80" : "text-text-muted"
                )}>
                    {subtitle}
                </p>
            )}
        </div>
    );
}
