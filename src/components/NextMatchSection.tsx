import { motion } from "framer-motion";
import { NextMatchCard } from "@/presentation/components/match/NextMatchCard";
import { useLanguage } from "@/i18n";
import { TEAMS } from "@/config/constants";
import { useUpcomingMatches } from "@/application/hooks/useNextMatch";
import { Loader2 } from "lucide-react";

const YOUTUBE_LINKS: Record<number, string> = {
  // Brasil x França - 26/03 e Brasil x Croácia - 31/03
  // Adicionar links quando disponíveis
};

const NextMatchSection = () => {
  const { t } = useLanguage();
  const { data: fixtures, isLoading } = useUpcomingMatches({ teamId: TEAMS.BRASIL, count: 2 });

  return (
    <section className="py-20 px-4">
      <div className="container mx-auto max-w-5xl">
        <motion.h2
          className="font-heading text-3xl sm:text-4xl uppercase text-center gold-text mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          {t.nextMatch.title}
        </motion.h2>
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {fixtures?.slice(0, 2).map((fixture) => (
              <NextMatchCard
                key={fixture.id}
                fixture={fixture}
                youtubeLink={YOUTUBE_LINKS[fixture.id] || ""}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default NextMatchSection;
