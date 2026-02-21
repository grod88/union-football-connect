import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Calendar, Clock, ExternalLink } from "lucide-react";

// Demo match data — in production this would come from API-Football
const DEMO_MATCH = {
  homeTeam: "São Paulo",
  awayTeam: "Palmeiras",
  homeLogo: "https://media.api-sports.io/football/teams/126.png",
  awayLogo: "https://media.api-sports.io/football/teams/121.png",
  league: "Paulistão 2026",
  round: "Quartas de Final",
  // Set match to 3 days from now for demo countdown
  date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
  youtubeLink: "https://youtube.com/@UnionFootballLive",
};

const getTimeRemaining = (targetDate: string) => {
  const diff = new Date(targetDate).getTime() - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
};

const formatInTimezone = (dateStr: string, tz: string, label: string) => {
  try {
    const date = new Date(dateStr);
    const formatted = date.toLocaleTimeString("pt-BR", {
      timeZone: tz,
      hour: "2-digit",
      minute: "2-digit",
    });
    return { label, time: formatted };
  } catch {
    return { label, time: "--:--" };
  }
};

const NextMatchSection = () => {
  const [timeLeft, setTimeLeft] = useState(getTimeRemaining(DEMO_MATCH.date));

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(getTimeRemaining(DEMO_MATCH.date));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const timezones = [
    formatInTimezone(DEMO_MATCH.date, "America/Sao_Paulo", "🇧🇷 Brasil"),
    formatInTimezone(DEMO_MATCH.date, "Pacific/Auckland", "🇳🇿 Nova Zelândia"),
    formatInTimezone(DEMO_MATCH.date, Intl.DateTimeFormat().resolvedOptions().timeZone, "📍 Seu horário"),
  ];

  const matchDate = new Date(DEMO_MATCH.date);
  const formattedDate = matchDate.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const generateICS = () => {
    const start = matchDate.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    const end = new Date(matchDate.getTime() + 2 * 60 * 60 * 1000)
      .toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    const ics = `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nDTSTART:${start}\nDTEND:${end}\nSUMMARY:${DEMO_MATCH.homeTeam} x ${DEMO_MATCH.awayTeam} - Union Football Live\nDESCRIPTION:Assista ao vivo: ${DEMO_MATCH.youtubeLink}\nEND:VEVENT\nEND:VCALENDAR`;
    const blob = new Blob([ics], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "union-football-live.ics";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="py-20 px-4">
      <div className="container mx-auto max-w-4xl">
        <motion.h2
          className="font-heading text-3xl sm:text-4xl uppercase text-center gold-text mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          Próximo Jogo
        </motion.h2>

        <motion.div
          className="card-surface rounded-xl p-6 sm:p-10 gold-glow"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
        >
          {/* League info */}
          <div className="text-center mb-6">
            <span className="text-primary font-heading uppercase tracking-wider text-sm">
              {DEMO_MATCH.league} — {DEMO_MATCH.round}
            </span>
          </div>

          {/* Teams */}
          <div className="flex items-center justify-center gap-6 sm:gap-12 mb-8">
            <div className="text-center">
              <img src={DEMO_MATCH.homeLogo} alt={DEMO_MATCH.homeTeam} className="w-20 h-20 sm:w-28 sm:h-28 mx-auto mb-3" />
              <span className="font-heading text-lg sm:text-xl uppercase text-foreground">{DEMO_MATCH.homeTeam}</span>
            </div>
            <span className="font-heading text-4xl sm:text-5xl text-primary">VS</span>
            <div className="text-center">
              <img src={DEMO_MATCH.awayLogo} alt={DEMO_MATCH.awayTeam} className="w-20 h-20 sm:w-28 sm:h-28 mx-auto mb-3" />
              <span className="font-heading text-lg sm:text-xl uppercase text-foreground">{DEMO_MATCH.awayTeam}</span>
            </div>
          </div>

          {/* Date */}
          <div className="flex items-center justify-center gap-2 text-muted-foreground mb-4">
            <Calendar size={16} />
            <span className="capitalize">{formattedDate}</span>
          </div>

          {/* Timezones */}
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            {timezones.map((tz) => (
              <div key={tz.label} className="flex items-center gap-2 bg-secondary/50 px-4 py-2 rounded-lg">
                <Clock size={14} className="text-primary" />
                <span className="text-sm text-muted-foreground">{tz.label}</span>
                <span className="text-sm font-semibold text-foreground">{tz.time}</span>
              </div>
            ))}
          </div>

          {/* Countdown */}
          <div className="grid grid-cols-4 gap-3 sm:gap-6 max-w-md mx-auto mb-8">
            {[
              { value: timeLeft.days, label: "Dias" },
              { value: timeLeft.hours, label: "Horas" },
              { value: timeLeft.minutes, label: "Min" },
              { value: timeLeft.seconds, label: "Seg" },
            ].map((item) => (
              <div key={item.label} className="text-center">
                <div className="card-surface rounded-lg p-3 sm:p-4 gold-border border">
                  <span className="font-heading text-3xl sm:text-5xl gold-text">
                    {String(item.value).padStart(2, "0")}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground mt-2 block uppercase tracking-wider">
                  {item.label}
                </span>
              </div>
            ))}
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href={DEMO_MATCH.youtubeLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 gold-gradient text-primary-foreground font-heading uppercase tracking-wider px-8 py-3 rounded-lg hover:opacity-90 transition-opacity"
            >
              <ExternalLink size={18} />
              Assistir Live
            </a>
            <button
              onClick={generateICS}
              className="inline-flex items-center gap-2 border border-primary/30 text-primary font-heading uppercase tracking-wider px-8 py-3 rounded-lg hover:bg-primary/10 transition-colors"
            >
              <Calendar size={18} />
              Lembrar-me
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default NextMatchSection;
