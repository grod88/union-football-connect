import { motion } from "framer-motion";
import { NextMatchCard } from "@/presentation/components/match/NextMatchCard";
import { useLanguage } from "@/i18n";
import { TEAMS } from "@/config/constants";

const YOUTUBE_LIVE_LINK = "https://www.youtube.com/watch?v=hBuqQbI09qY";

const NextMatchSection = () => {
  const { t } = useLanguage();

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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <NextMatchCard
            teamId={TEAMS.SAO_PAULO}
            youtubeLink={YOUTUBE_LIVE_LINK}
          />
          <NextMatchCard
            teamId={TEAMS.SANTOS}
            youtubeLink={YOUTUBE_LIVE_LINK}
          />
        </div>
      </div>
    </section>
  );
};

export default NextMatchSection;
