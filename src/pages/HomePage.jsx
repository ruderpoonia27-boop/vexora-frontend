
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trophy, Users, Zap, Search, ShieldCheck, ChevronRight, Target, Gift } from 'lucide-react';
import CountUp from 'react-countup';
import { Helmet } from 'react-helmet';
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';
import { getPlatformName, useSettings } from '@/hooks/useSettings';
import TournamentCard from '@/components/TournamentCard';
import { TournamentCardSkeleton } from '@/components/Skeleton';
import LiveAnnouncementBar from '@/components/LiveAnnouncementBar';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

const HomePage = () => {
  const { settings } = useSettings();
  const platformName = getPlatformName(settings);

  // Use sorting by newest to get active tournaments, ideally we'd sort by prize_pool
  const { data: featuredTournaments, loading: tournamentsLoading } = useRealtimeSubscription('tournaments', {
    filter: 'status = "active"',
    sort: '-created',
    perPage: 6
  });

  const { data: usersData } = useRealtimeSubscription('users', { perPage: 1 });
  const { data: tournamentsData } = useRealtimeSubscription('tournaments', { perPage: 1 });

  const totalUsers = usersData?.length > 0 ? 1254 + (usersData[0]?.totalItems || 0) : 1254; // Base dummy number + real
  const totalTournamentsCount = tournamentsData?.length > 0 ? 342 + (tournamentsData[0]?.totalItems || 0) : 342;
  const totalPrizeDistributed = 850000; // Mocked realistic base

  const steps = [
    { icon: Search, title: "Browse", desc: "Find tournaments that match your game style and preferred entry fee." },
    { icon: Target, title: "Join", desc: "Secure your slot instantly using your wallet balance." },
    { icon: ShieldCheck, title: "Play", desc: "Get room details, join the match, and prove your skills." },
    { icon: Gift, title: "Win", desc: "Top players receive instant wallet credits that can be withdrawn." }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col overflow-x-clip">
      <Helmet>
        <title>{platformName} | Epic Mobile Esports</title>
      </Helmet>

      {/* Hero Section */}
      <section className="relative min-h-[100dvh] flex items-center justify-center pt-16 pb-32 hero-gaming-bg">
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(0,212,255,0.15)_0%,transparent_50%)]"></div>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(217,70,239,0.15)_0%,transparent_50%)]"></div>
        </div>

        <div className="container mx-auto px-4 z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="max-w-5xl mx-auto"
          >
            <span className="inline-block py-1.5 px-4 rounded-full bg-primary/10 text-primary font-bold text-sm mb-6 tracking-wide border border-primary/20">
              {platformName.toUpperCase()} MOBILE GAMING
            </span>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tighter mb-6 text-glow-primary uppercase leading-[1.1]">
              Dominate <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-white to-accent">The Arena</span>
            </h1>
            <p className="text-lg md:text-2xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
              Compete in daily BGMI and Free Fire tournaments. Show your skills, climb the leaderboard, and win real cash prizes instantly.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link 
                to="/tournaments" 
                className="w-full sm:w-auto px-8 py-4 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 hover:scale-105 transition-all box-glow-primary flex items-center justify-center gap-2 text-lg group"
              >
                Browse Tournaments <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link 
                to="/leaderboard" 
                className="w-full sm:w-auto px-8 py-4 bg-card/80 backdrop-blur-sm text-foreground border border-border/50 font-bold rounded-xl hover:bg-accent/20 hover:text-accent transition-all flex items-center justify-center gap-2 text-lg"
              >
                View Leaderboard
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <LiveAnnouncementBar />

      {/* Stats Section */}
      <section className="relative z-20 mb-24 container mx-auto px-4">
        <div className="bg-card/80 backdrop-blur-xl border border-border/50 rounded-3xl p-8 md:p-12 shadow-2xl grid grid-cols-1 md:grid-cols-3 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-border/50">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
            <p className="text-muted-foreground font-medium mb-2 flex items-center justify-center gap-2"><Trophy className="w-4 h-4 text-accent" /> Tournaments</p>
            <h3 className="text-4xl md:text-5xl font-bold text-accent text-glow-accent">
              <CountUp end={totalTournamentsCount} duration={2.5} separator="," />+
            </h3>
          </motion.div>
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.2 }}>
            <p className="text-muted-foreground font-medium mb-2 flex items-center justify-center gap-2"><Users className="w-4 h-4 text-primary" /> Active Players</p>
            <h3 className="text-4xl md:text-5xl font-bold text-primary text-glow-primary">
              <CountUp end={totalUsers} duration={2.5} separator="," />+
            </h3>
          </motion.div>
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.4 }}>
            <p className="text-muted-foreground font-medium mb-2 flex items-center justify-center gap-2"><Zap className="w-4 h-4 text-secondary" /> Prize Distributed</p>
            <h3 className="text-4xl md:text-5xl font-bold text-secondary text-glow-secondary">
              ₹<CountUp end={totalPrizeDistributed} duration={2.5} separator="," />+
            </h3>
          </motion.div>
        </div>
      </section>

      {/* Featured Tournaments */}
      <section className="py-24 bg-card/20">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-end justify-between mb-12 gap-4">
            <div>
              <h2 className="text-3xl md:text-5xl font-bold mb-4">Featured Battles</h2>
              <p className="text-muted-foreground text-lg">High-stakes tournaments filling up right now.</p>
            </div>
            <Link to="/tournaments" className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-bold transition-colors">
              See All Matches <ChevronRight className="w-5 h-5" />
            </Link>
          </div>

          {tournamentsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <TournamentCardSkeleton />
              <TournamentCardSkeleton />
              <TournamentCardSkeleton />
            </div>
          ) : featuredTournaments.length > 0 ? (
            <Carousel className="w-full" opts={{ align: "start", loop: false }}>
              <CarouselContent className="-ml-4">
                {featuredTournaments.map(tournament => (
                  <CarouselItem key={tournament._id} className="pl-4 md:basis-1/2 lg:basis-1/3">
                    <div className="p-1 h-full">
                      <TournamentCard tournament={tournament} onJoin={() => {}} />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <div className="flex justify-end gap-2 mt-8">
                <CarouselPrevious className="static transform-none bg-card border-border hover:bg-primary/20 hover:text-primary" />
                <CarouselNext className="static transform-none bg-card border-border hover:bg-primary/20 hover:text-primary" />
              </div>
            </Carousel>
          ) : (
            <div className="text-center py-20 bg-background rounded-3xl border border-dashed border-border/50">
              <p className="text-muted-foreground text-lg">No active tournaments right now. Rest your thumbs!</p>
            </div>
          )}
        </div>
      </section>

      {/* How it Works */}
      <section className="py-32">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">Path to Victory</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Four simple steps stand between you and the prize pool. Start your journey today.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
            <div className="hidden lg:block absolute top-1/2 left-0 w-full h-0.5 bg-gradient-to-r from-primary/10 via-primary/50 to-accent/10 -translate-y-1/2 z-0"></div>
            
            {steps.map((step, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                className="relative z-10 bg-card border border-border/50 p-8 rounded-3xl text-center hover:border-primary/50 transition-colors shadow-xl"
              >
                <div className="w-16 h-16 mx-auto bg-background rounded-2xl flex items-center justify-center mb-6 shadow-inner border border-border/50 text-primary box-glow-primary">
                  <step.icon className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold mb-3">{i + 1}. {step.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 bg-card/20 border-t border-border/50">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">Frequently Asked Questions</h2>
            <p className="text-muted-foreground text-lg">Got questions? We've got answers.</p>
          </div>

          <Accordion type="single" collapsible className="w-full space-y-4">
            <AccordionItem value="item-1" className="bg-card border border-border/50 rounded-xl px-6 data-[state=open]:border-primary/50 transition-colors">
              <AccordionTrigger className="text-lg font-bold hover:no-underline hover:text-primary">How do I add money to my wallet?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-base leading-relaxed">
                Open the Wallet page, choose Deposit, enter the amount, complete the payment using the shown UPI details, and submit your UTR or transaction ID. Your request is then reviewed by the admin and shown in wallet activity.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2" className="bg-card border border-border/50 rounded-xl px-6 data-[state=open]:border-primary/50 transition-colors">
              <AccordionTrigger className="text-lg font-bold hover:no-underline hover:text-primary">When do I get the room ID and password?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-base leading-relaxed">
                After you join a tournament, room details appear only for joined players. Admins can prepare them earlier, but they become visible on your Tournament Details page at the scheduled match start time.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3" className="bg-card border border-border/50 rounded-xl px-6 data-[state=open]:border-primary/50 transition-colors">
              <AccordionTrigger className="text-lg font-bold hover:no-underline hover:text-primary">How are winnings distributed?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-base leading-relaxed">
                Once a match is completed, the admin declares the winner and prize amount. Approved winnings are added to your wallet balance, and you can request a withdrawal directly from the Wallet page.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-4" className="bg-card border border-border/50 rounded-xl px-6 data-[state=open]:border-primary/50 transition-colors">
              <AccordionTrigger className="text-lg font-bold hover:no-underline hover:text-primary">Is there a minimum withdrawal amount?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-base leading-relaxed">
                Yes. The minimum withdrawal amount is Rs.100. Withdrawal requests are reviewed by the admin, and approved payouts are usually completed within a few hours depending on queue and verification.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
