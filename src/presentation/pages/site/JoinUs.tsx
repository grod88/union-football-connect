/**
 * Join Us Page (/junte-se)
 * Community registration and membership information
 */
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Youtube, MessageCircle, Heart, Globe, CheckCircle } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const benefits = [
  {
    icon: Youtube,
    title: 'Lives Exclusivas',
    titleEn: 'Exclusive Lives',
    description: 'Participe das transmissões ao vivo com chat e interação em tempo real.',
    descriptionEn: 'Join live streams with chat and real-time interaction.',
  },
  {
    icon: MessageCircle,
    title: 'Comunidade Ativa',
    titleEn: 'Active Community',
    description: 'Faça parte do grupo de WhatsApp/Telegram com outros torcedores.',
    descriptionEn: 'Be part of the WhatsApp/Telegram group with other fans.',
  },
  {
    icon: Globe,
    title: 'Torcida Global',
    titleEn: 'Global Fanbase',
    description: 'Conecte-se com torcedores do Brasil, Nova Zelândia e do mundo todo.',
    descriptionEn: 'Connect with fans from Brazil, New Zealand, and worldwide.',
  },
  {
    icon: Heart,
    title: 'Apoio ao Projeto',
    titleEn: 'Support the Project',
    description: 'Ajude a manter as transmissões e expandir a comunidade.',
    descriptionEn: 'Help keep the streams running and expand the community.',
  },
];

const socialLinks = [
  {
    name: 'YouTube',
    url: 'https://youtube.com/@UnionFootballLive',
    color: 'bg-red-600 hover:bg-red-700',
    description: 'Inscreva-se no canal',
  },
  {
    name: 'Instagram',
    url: 'https://instagram.com/unionfootballlive',
    color: 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600',
    description: 'Siga para novidades',
  },
  {
    name: 'Twitter/X',
    url: 'https://x.com/unionfootball',
    color: 'bg-black hover:bg-gray-900',
    description: 'Acompanhe ao vivo',
  },
];

const JoinUs = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    country: '',
    favoriteTeam: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would submit to an API
    console.log('Form submitted:', formData);
    setSubmitted(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-20 pb-16">
        {/* Hero Section */}
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-4xl text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Users className="h-16 w-16 text-primary mx-auto mb-6" />
              <h1 className="font-heading text-4xl sm:text-5xl uppercase gold-text mb-4">
                Junte-se à Torcida
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                O Futebol é Melhor Junto! Faça parte da nossa comunidade global de torcedores apaixonados.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-12 px-4 bg-secondary/20">
          <div className="container mx-auto max-w-5xl">
            <h2 className="font-heading text-2xl uppercase text-center mb-8">
              Por que fazer parte?
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={benefit.title}
                  className="card-surface rounded-xl p-6 text-center"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <benefit.icon className="h-10 w-10 text-primary mx-auto mb-4" />
                  <h3 className="font-heading text-lg uppercase mb-2">{benefit.title}</h3>
                  <p className="text-sm text-muted-foreground">{benefit.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Social Links */}
        <section className="py-12 px-4">
          <div className="container mx-auto max-w-3xl">
            <h2 className="font-heading text-2xl uppercase text-center mb-8">
              Conecte-se Agora
            </h2>
            <div className="grid sm:grid-cols-3 gap-4">
              {socialLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`block p-6 rounded-xl text-white text-center transition-transform hover:scale-105 ${link.color}`}
                >
                  <span className="font-heading text-xl uppercase block mb-1">{link.name}</span>
                  <span className="text-sm opacity-90">{link.description}</span>
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* Registration Form */}
        <section className="py-12 px-4">
          <div className="container mx-auto max-w-lg">
            <motion.div
              className="card-surface rounded-xl p-6 sm:p-8 gold-glow"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="font-heading text-2xl uppercase text-center mb-6">
                Cadastre-se na Comunidade
              </h2>

              {submitted ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                  <h3 className="font-heading text-xl mb-2">Obrigado!</h3>
                  <p className="text-muted-foreground">
                    Em breve você receberá um email com mais informações sobre a comunidade.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium mb-1">
                      Nome / Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                      placeholder="Seu nome"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                      placeholder="seu@email.com"
                    />
                  </div>

                  <div>
                    <label htmlFor="country" className="block text-sm font-medium mb-1">
                      País / Country
                    </label>
                    <select
                      id="country"
                      name="country"
                      value={formData.country}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                    >
                      <option value="">Selecione...</option>
                      <option value="BR">Brasil</option>
                      <option value="NZ">Nova Zelândia / New Zealand</option>
                      <option value="AU">Austrália / Australia</option>
                      <option value="PT">Portugal</option>
                      <option value="US">Estados Unidos / USA</option>
                      <option value="OTHER">Outro / Other</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="favoriteTeam" className="block text-sm font-medium mb-1">
                      Time do Coração / Favorite Team
                    </label>
                    <input
                      type="text"
                      id="favoriteTeam"
                      name="favoriteTeam"
                      value={formData.favoriteTeam}
                      onChange={handleChange}
                      className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                      placeholder="Ex: São Paulo FC"
                    />
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium mb-1">
                      Mensagem (opcional) / Message (optional)
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      rows={3}
                      className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors resize-none"
                      placeholder="Conte-nos sobre você..."
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full gold-gradient text-primary-foreground font-heading uppercase tracking-wider px-6 py-3 rounded-lg hover:opacity-90 transition-opacity"
                  >
                    Cadastrar
                  </button>

                  <p className="text-xs text-center text-muted-foreground">
                    Ao se cadastrar, você concorda em receber comunicações da Union Football Live.
                  </p>
                </form>
              )}
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default JoinUs;
