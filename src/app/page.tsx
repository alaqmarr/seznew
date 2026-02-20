import { GoldenButton, OrnateCard } from "@/components/ui/premium-components";
import { Utensils, Building2, Moon, ClipboardList, Package, HandHeart, Activity, Scissors, Trophy, GraduationCap, Handshake } from "lucide-react";
import Link from "next/link";
import { TopBanner } from "@/components/TopBanner";
import { MenuAlert } from "@/components/MenuAlert";
export const revalidate = 0;
const khidmats = [
  { title: "Jaman & Niyaz", icon: Utensils, description: "Serving community meals with dedication." },
  { title: "Masjid Tanzeem", icon: Building2, description: "Maintaining cleanliness and order in the Masjid." },
  { title: "10mi Raat Majlis", icon: Moon, description: "Organizing religiously significant gatherings." },
  { title: "Jamaat Survey", icon: ClipboardList, description: "Door-to-door data collection for community welfare." },
  { title: "FMB Khidmat", icon: Package, description: "Faiz al-Mawaid al-Burhaniyah distribution." },
  { title: "Upliftment Projects", icon: HandHeart, description: "Initiatives to support underprivileged families." },
  { title: "Qardan Hasana", icon: Handshake, description: "Interest-free benevolent loans." },
  { title: "Medical", icon: Activity, description: "Healthcare support and medical camps." },
  { title: "Zabihat", icon: Scissors, description: "Organizing systematic Zabihat services." },
  { title: "Sports", icon: Trophy, description: "Community sports events and fitness activities." },
  { title: "Minhat Talimiyah", icon: GraduationCap, description: "Educational grants and guidance." },
];

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen relative selection:bg-gold/30">
      {/* Background Pattern */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `url("https://www.transparenttextures.com/patterns/arabesque.png")`,
          backgroundSize: '300px'
        }}
      />

      {/* Menu Alert - Section moved out for seamless attachment */}
      <div className="relative z-20">
        <MenuAlert />
      </div>

      <div className="relative z-10 py-12 space-y-16 px-4 md:px-8">

        {/* 1. Hero Banner Section */}
        <TopBanner />

        {/* Hero Content */}
        <section className="relative flex flex-col items-center justify-center text-center space-y-8">
          <h1 className="text-6xl md:text-9xl font-[family-name:var(--font-lobster)] font-bold text-[#2B0F14] drop-shadow-lg leading-tight py-4">
            Shabab Ul<br />Eidiz Zahabi
          </h1>

          <div className="flex items-center justify-center gap-4">
            <div className="h-[2px] w-12 bg-gold"></div>
            <p className="text-xl md:text-2xl text-text-muted font-light italic tracking-wide">Secunderabad</p>
            <div className="h-[2px] w-12 bg-gold"></div>
          </div>

          <p className="text-xl text-text-muted max-w-3xl mx-auto leading-relaxed font-medium">
            "We Always Try To Reform & Develop into a visionary committee to Sincerity and a mission of Service before self."
          </p>

          <div className="pt-6 flex flex-col sm:flex-row gap-6 justify-center">
            <Link href="/join">
              <GoldenButton className="text-xl px-10 py-4 shadow-xl">
                Join the Committee
              </GoldenButton>
            </Link>
          </div>
        </section>
      </div>

      {/* About Section */}
      {/* About Section */}
      <section className="py-24 px-6 md:px-12 bg-gradient-to-b from-primary-dark to-primary text-white relative overflow-hidden">
        {/* Pattern overlay for dark section */}
        <div className="absolute inset-0 bg-[url('/bg.svg')] bg-repeat opacity-10 blur-[1px] pointer-events-none"></div>

        <div className="max-w-4xl mx-auto text-center space-y-12 relative z-10">
          <div className="space-y-4">
            <h2 className="text-5xl md:text-6xl font-[family-name:var(--font-lobster)] font-bold text-gold tracking-wide py-2">Our Mission</h2>
            <div className="mx-auto w-24 h-1 bg-gold rounded-full" />
          </div>

          <div className="space-y-8 text-xl font-medium leading-relaxed drop-shadow-sm text-balance">
            <p>
              With Raza Mubarak of Dai-al-Mutlaq Dr. Syedna Mohammed Burhanuddin Saheb (R.A) & Syedna Aali Qadar Mufaddal Saifuddin (TUS), We Shabab Ul Eidiz Zahabi-Secunderabad, Under Umoor Mawarid Bashariya Stand tall to Perform various khidmat in our community with immense pride.
            </p>
            <p>
              The word <span className="text-gold font-bold">'khidmat'</span>, when translated literally, means 'service not governed by reward'. The word 'Shabab', when translated literally, means 'youth'. However, the concept of youth is not in age, but the youthful nature that everyone has within themselves.
            </p>
          </div>
        </div>
      </section>

      {/* Khidmats Grid */}
      <section className="py-24 px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-bold font-[family-name:var(--font-lobster)] text-gold mb-6 tracking-wide py-2">Our Khidmats</h2>
            <div className="mx-auto w-24 h-1 bg-gold rounded-full mb-6" />
            <p className="text-xl text-text-muted">Services we perform with pride and dedication</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {khidmats.map((k, i) => (
              <OrnateCard key={i} className="p-8 transition-all duration-500 group border-l-2 border-t-2 border-gold border-r-2 border-b-2 border-primary hover:border-l-primary hover:border-t-primary hover:border-r-gold hover:border-b-gold hover:-translate-y-2">
                <div className="mb-6 p-4 rounded-full bg-primary/5 w-fit text-primary group-hover:bg-primary group-hover:text-gold transition-colors duration-500 border border-gold/20">
                  <k.icon className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold text-primary mb-3">
                  {k.title}
                </h3>
                <p className="text-text-muted leading-relaxed group-hover:text-primary-dark/90 text-lg">
                  {k.description}
                </p>
              </OrnateCard>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
