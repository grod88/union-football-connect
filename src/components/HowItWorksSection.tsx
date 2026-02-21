import { motion } from "framer-motion";
import { CalendarDays, Video, Globe } from "lucide-react";
import { useLanguage } from "@/i18n";

const HowItWorksSection = () => {
  const { t } = useLanguage();

  const steps = [
    { icon: CalendarDays, title: t.howItWorks.step1Title, description: t.howItWorks.step1Desc },
    { icon: Video, title: t.howItWorks.step2Title, description: t.howItWorks.step2Desc },
    { icon: Globe, title: t.howItWorks.step3Title, description: t.howItWorks.step3Desc },
  ];

  return (
    <section className="py-20 px-4">
      <div className="container mx-auto max-w-5xl">
        <motion.h2
          className="font-heading text-3xl sm:text-4xl uppercase text-center gold-text mb-14"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          {t.howItWorks.title}
        </motion.h2>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, i) => (
            <motion.div
              key={i}
              className="card-surface rounded-xl p-8 text-center hover:gold-glow transition-shadow duration-500"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
            >
              <div className="w-16 h-16 mx-auto mb-6 rounded-full gold-gradient flex items-center justify-center">
                <step.icon size={28} className="text-primary-foreground" />
              </div>
              <h3 className="font-heading text-xl uppercase text-foreground mb-3">{step.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
