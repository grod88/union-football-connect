import { motion } from "framer-motion";
import { CalendarDays, Video, Globe } from "lucide-react";

const steps = [
  {
    icon: CalendarDays,
    title: "Escolhemos o Jogo",
    description: "Selecionamos os melhores jogos da rodada para assistir juntos.",
  },
  {
    icon: Video,
    title: "Abrimos a Live",
    description: "Entramos ao vivo no YouTube com comentários e reações em tempo real.",
  },
  {
    icon: Globe,
    title: "Assistimos Juntos",
    description: "Torcedores do Brasil, Nova Zelândia e do mundo inteiro conectados pelo futebol.",
  },
];

const HowItWorksSection = () => {
  return (
    <section className="py-20 px-4">
      <div className="container mx-auto max-w-5xl">
        <motion.h2
          className="font-heading text-3xl sm:text-4xl uppercase text-center gold-text mb-14"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          Como Funciona
        </motion.h2>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, i) => (
            <motion.div
              key={step.title}
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
