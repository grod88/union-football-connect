import { motion } from "framer-motion";
import { NextMatchCard } from "@/presentation/components/match/NextMatchCard";
import { useLanguage } from "@/i18n";
import { TEAMS } from "@/config/constants";

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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <NextMatchCard
            teamId={TEAMS.PALMEIRAS}
            youtubeLink="https://youtube.com/live/SZNocJ9U6rU?feature=share"
          />
          <NextMatchCard
            teamId={TEAMS.SAO_PAULO}
            youtubeLink="https://youtube.com/live/hBuqQbI09qY?feature=share"
          />
        </div>
      </div>
    </section>
  );
};

export default NextMatchSection;
