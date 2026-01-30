import Link from 'next/link';
import { GoldenButton } from './ui/premium-components';

export function Footer() {
    return (
        <footer className="bg-primary-dark text-cream pt-20 pb-10 px-6 md:px-12 border-t-4 border-gold relative overflow-hidden">
            {/* Pattern overlay */}
            <div className="absolute inset-0 bg-[url('/bg.svg')] opacity-5 pointer-events-none mix-blend-overlay"></div>

            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-16 relative z-10">
                <div className="space-y-6">
                    <div className="flex items-center gap-3">
                        <img src="/logo-no-bg.png" alt="SEZ Logo" className="h-16 w-auto brightness-0 invert drop-shadow-lg" />
                        <div>
                            <h3 className="text-3xl font-[family-name:var(--font-lobster)] font-bold text-gold tracking-wide">Shabab Ul<br />Eidiz Zahabi</h3>
                        </div>
                    </div>
                    <p className="text-cream/80 leading-relaxed max-w-sm text-lg">
                        We Always Try To Reform & Develop into a visionary committee to Sincerity and a mission of Service before self.
                    </p>
                </div>

                <div>
                    <h4 className="text-gold font-bold font-[family-name:var(--font-lobster)] text-2xl mb-8 tracking-wide">Navigation</h4>
                    <ul className="space-y-4 text-base">
                        <li><Link href="/" className="hover:text-gold transition-colors flex items-center gap-2"><span className="text-gold">›</span> Home</Link></li>
                        <li><Link href="/events" className="hover:text-gold transition-colors flex items-center gap-2"><span className="text-gold">›</span> Calendar</Link></li>
                        <li><Link href="/our-events" className="hover:text-gold transition-colors flex items-center gap-2"><span className="text-gold">›</span> Our Events</Link></li>
                        <li><Link href="/khidmat" className="hover:text-gold transition-colors flex items-center gap-2"><span className="text-gold">›</span> Khidmat Invitation</Link></li>

                    </ul>
                </div>

                <div>
                    <h4 className="text-gold font-bold font-[family-name:var(--font-lobster)] text-2xl mb-8 tracking-wide">Connect</h4>
                    <p className="text-cream/80 mb-4">Burhani Housing Society,<br />Trimulgherry, Secunderabad.</p>
                    <div className="space-y-2">
                        <a href="mailto:sezsecbad@gmail.com" className="hover:text-gold transition-colors block text-lg font-medium">
                            sezsecbad@gmail.com
                        </a>
                        <a href="mailto:secsez@gmail.com" className="hover:text-gold transition-colors block text-lg font-medium">
                            secsez@gmail.com
                        </a>
                    </div>
                    <div className="mt-8">
                        <Link href="/join">
                            <GoldenButton className="w-full text-center">Join Committee</GoldenButton>
                        </Link>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-gold/20 flex flex-col md:flex-row justify-between items-center text-sm text-cream/60 relative z-10">
                <p>© {new Date().getFullYear()} Shabab Ul Eidiz Zahabi. All rights reserved.</p>
                <div className="flex gap-6 mt-4 md:mt-0 font-medium">
                    <Link href="#" className="hover:text-gold transition-colors">Privacy Policy</Link>
                    <Link href="#" className="hover:text-gold transition-colors">Terms of Use</Link>
                </div>
            </div>
        </footer>
    );
}
