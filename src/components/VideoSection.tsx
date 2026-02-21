import { motion } from "framer-motion";

const VideoSection = () => {
  return (
    <section className="py-20 px-4 bg-secondary/30">
      <div className="container mx-auto max-w-4xl">
        <motion.h2
          className="font-heading text-3xl sm:text-4xl uppercase text-center gold-text mb-4"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          Conheça o Canal
        </motion.h2>
        <motion.p
          className="text-center text-muted-foreground mb-10 max-w-xl mx-auto"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
        >
          Assista um pouco de como são nossas lives — emoção, zoeira e futebol de verdade!
        </motion.p>

        <motion.div
          className="relative w-full aspect-video rounded-xl overflow-hidden card-surface gold-glow"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
        >
          <iframe
            src="https://www.youtube.com/embed/?listType=user_uploads&list=UnionFootballLive"
            title="Union Football Live"
            className="absolute inset-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
          {/* Fallback placeholder */}
          <div className="absolute inset-0 flex items-center justify-center bg-card">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full gold-gradient flex items-center justify-center">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="hsl(var(--primary-foreground))">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              </div>
              <p className="text-muted-foreground font-heading uppercase tracking-wider text-sm">
                Vídeo de apresentação em breve
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default VideoSection;
