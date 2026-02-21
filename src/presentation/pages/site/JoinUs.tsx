/**
 * Join Us Page (/junte-se)
 * Community registration with dynamic team selection
 */
import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Users, Youtube, MessageCircle, Heart, Globe, CheckCircle, Loader2 } from 'lucide-react';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

// --- Types ---
interface TeamOption {
  id: number;
  name: string;
  logo: string;
}

// --- Validation ---
const registrationSchema = z.object({
  name: z.string().trim().min(1, 'Nome é obrigatório').max(100, 'Máximo 100 caracteres'),
  email: z.string().trim().email('Email inválido').max(255),
  country: z.string().min(1, 'Selecione um país'),
  favorite_team_id: z.number().optional(),
  favorite_team_name: z.string().optional(),
  message: z.string().max(1000, 'Máximo 1000 caracteres').optional(),
});

// --- Constants ---
const COUNTRIES = [
  { code: 'BR', label: 'Brasil' },
  { code: 'NZ', label: 'Nova Zelândia / New Zealand' },
  { code: 'AU', label: 'Austrália / Australia' },
  { code: 'PT', label: 'Portugal' },
  { code: 'US', label: 'Estados Unidos / USA' },
  { code: 'AR', label: 'Argentina' },
  { code: 'UY', label: 'Uruguai / Uruguay' },
  { code: 'GB', label: 'Inglaterra / England' },
  { code: 'ES', label: 'Espanha / Spain' },
  { code: 'DE', label: 'Alemanha / Germany' },
  { code: 'FR', label: 'França / France' },
  { code: 'IT', label: 'Itália / Italy' },
];

const benefits = [
  { icon: Youtube, title: 'Lives Exclusivas', description: 'Participe das transmissões ao vivo com chat e interação em tempo real.' },
  { icon: MessageCircle, title: 'Comunidade Ativa', description: 'Faça parte do grupo de WhatsApp/Telegram com outros torcedores.' },
  { icon: Globe, title: 'Torcida Global', description: 'Conecte-se com torcedores do Brasil, Nova Zelândia e do mundo todo.' },
  { icon: Heart, title: 'Apoio ao Projeto', description: 'Ajude a manter as transmissões e expandir a comunidade.' },
];

const socialLinks = [
  { name: 'YouTube', url: 'https://youtube.com/@UnionFootballLive', color: 'bg-red-600 hover:bg-red-700', description: 'Inscreva-se no canal' },
  { name: 'Instagram', url: 'https://instagram.com/unionfootballlive', color: 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600', description: 'Siga para novidades' },
  { name: 'Twitter/X', url: 'https://x.com/unionfootball', color: 'bg-black hover:bg-gray-900', description: 'Acompanhe ao vivo' },
];

// --- Hook: useTeamsByCountry ---
function useTeamsByCountry(country: string) {
  const [teams, setTeams] = useState<TeamOption[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTeams = useCallback(async (countryCode: string) => {
    if (!countryCode) { setTeams([]); return; }
    setLoading(true);
    try {
      // Try reading from DB first
      const { data, error } = await supabase
        .from('teams')
        .select('id, name, logo')
        .eq('country', countryCode)
        .order('name');

      if (!error && data && data.length > 0) {
        setTeams(data as TeamOption[]);
        setLoading(false);
        return;
      }

      // If empty, call sync-teams to populate cache
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sync-teams?country=${countryCode}`,
        { headers: { 'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY } },
      );

      if (res.ok) {
        // Re-read from DB after sync (ordered)
        const { data: freshData } = await supabase
          .from('teams')
          .select('id, name, logo')
          .eq('country', countryCode)
          .order('name');
        setTeams((freshData as TeamOption[]) ?? []);
      }
    } catch (err) {
      console.error('Failed to load teams:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeams(country);
  }, [country, fetchTeams]);

  return { teams, loading };
}

// --- Hook: useDetectCountry ---
function useDetectCountry() {
  const [detectedCountry, setDetectedCountry] = useState('');

  useEffect(() => {
    const detect = async () => {
      try {
        const res = await fetch('https://ipapi.co/json/', { signal: AbortSignal.timeout(5000) });
        if (res.ok) {
          const data = await res.json();
          const code = data.country_code?.toUpperCase();
          if (code && COUNTRIES.some((c) => c.code === code)) {
            setDetectedCountry(code);
          }
        }
      } catch { /* ignore */ }
    };
    detect();
  }, []);

  return detectedCountry;
}

// --- Main Component ---
const JoinUs = () => {
  const detectedCountry = useDetectCountry();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    country: '',
    favorite_team_id: undefined as number | undefined,
    favorite_team_name: '',
    message: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Auto-fill country when detected
  useEffect(() => {
    if (detectedCountry && !formData.country) {
      setFormData((prev) => ({ ...prev, country: detectedCountry }));
    }
  }, [detectedCountry]);

  const { teams, loading: teamsLoading } = useTeamsByCountry(formData.country);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setErrors((prev) => ({ ...prev, [name]: '' }));
    setSubmitError('');

    if (name === 'country') {
      setFormData((prev) => ({ ...prev, country: value, favorite_team_id: undefined, favorite_team_name: '' }));
    } else if (name === 'favorite_team_id') {
      const teamId = value ? Number(value) : undefined;
      const team = teams.find((t) => t.id === teamId);
      setFormData((prev) => ({ ...prev, favorite_team_id: teamId, favorite_team_name: team?.name ?? '' }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    // Validate
    const result = registrationSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as string;
        if (!fieldErrors[field]) fieldErrors[field] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/community-register`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify(result.data),
        },
      );

      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.error || 'Erro ao cadastrar. Tente novamente.');
        return;
      }

      setSubmitted(true);
    } catch {
      setSubmitError('Erro de conexão. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = 'w-full px-4 py-2 bg-input border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors';

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-20 pb-16">
        {/* Hero */}
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-4xl text-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <Users className="h-16 w-16 text-primary mx-auto mb-6" />
              <h1 className="font-heading text-4xl sm:text-5xl uppercase gold-text mb-4">Junte-se à Torcida</h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                O Futebol é Melhor Junto! Faça parte da nossa comunidade global de torcedores apaixonados.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Benefits */}
        <section className="py-12 px-4 bg-secondary/20">
          <div className="container mx-auto max-w-5xl">
            <h2 className="font-heading text-2xl uppercase text-center mb-8">Por que fazer parte?</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {benefits.map((b, i) => (
                <motion.div key={b.title} className="card-surface rounded-xl p-6 text-center" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                  <b.icon className="h-10 w-10 text-primary mx-auto mb-4" />
                  <h3 className="font-heading text-lg uppercase mb-2">{b.title}</h3>
                  <p className="text-sm text-muted-foreground">{b.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Social Links */}
        <section className="py-12 px-4">
          <div className="container mx-auto max-w-3xl">
            <h2 className="font-heading text-2xl uppercase text-center mb-8">Conecte-se Agora</h2>
            <div className="grid sm:grid-cols-3 gap-4">
              {socialLinks.map((link) => (
                <a key={link.name} href={link.url} target="_blank" rel="noopener noreferrer" className={`block p-6 rounded-xl text-white text-center transition-transform hover:scale-105 ${link.color}`}>
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
            <motion.div className="card-surface rounded-xl p-6 sm:p-8 gold-glow" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <h2 className="font-heading text-2xl uppercase text-center mb-6">Cadastre-se na Comunidade</h2>

              {submitted ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                  <h3 className="font-heading text-xl mb-2">Obrigado!</h3>
                  <p className="text-muted-foreground">Em breve você receberá informações sobre a comunidade.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Name */}
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium mb-1">Nome / Name</label>
                    <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} className={inputClass} placeholder="Seu nome" />
                    {errors.name && <p className="text-sm text-destructive mt-1">{errors.name}</p>}
                  </div>

                  {/* Email */}
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium mb-1">Email</label>
                    <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} className={inputClass} placeholder="seu@email.com" />
                    {errors.email && <p className="text-sm text-destructive mt-1">{errors.email}</p>}
                  </div>

                  {/* Country */}
                  <div>
                    <label htmlFor="country" className="block text-sm font-medium mb-1">País / Country</label>
                    <select id="country" name="country" value={formData.country} onChange={handleChange} className={inputClass}>
                      <option value="">Selecione...</option>
                      {COUNTRIES.map((c) => (
                        <option key={c.code} value={c.code}>{c.label}</option>
                      ))}
                    </select>
                    {errors.country && <p className="text-sm text-destructive mt-1">{errors.country}</p>}
                  </div>

                  {/* Favorite Team */}
                  <div>
                    <label htmlFor="favorite_team_id" className="block text-sm font-medium mb-1">
                      Time do Coração / Favorite Team
                    </label>
                    {teamsLoading ? (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Carregando times...
                      </div>
                    ) : formData.country ? (
                      <select id="favorite_team_id" name="favorite_team_id" value={formData.favorite_team_id ?? ''} onChange={handleChange} className={inputClass}>
                        <option value="">Selecione um time...</option>
                        {teams.map((t) => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                    ) : (
                      <p className="text-sm text-muted-foreground py-2">Selecione um país primeiro</p>
                    )}
                  </div>

                  {/* Message */}
                  <div>
                    <label htmlFor="message" className="block text-sm font-medium mb-1">Mensagem (opcional) / Message (optional)</label>
                    <textarea id="message" name="message" value={formData.message} onChange={handleChange} rows={3} className={`${inputClass} resize-none`} placeholder="Conte-nos sobre você..." />
                    {errors.message && <p className="text-sm text-destructive mt-1">{errors.message}</p>}
                  </div>

                  {submitError && (
                    <p className="text-sm text-destructive text-center">{submitError}</p>
                  )}

                  <button type="submit" disabled={submitting} className="w-full gold-gradient text-primary-foreground font-heading uppercase tracking-wider px-6 py-3 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50">
                    {submitting ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : 'Cadastrar'}
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
