import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X, Globe } from "lucide-react";
import logoUnion from "@/assets/logo-union.jpg";
import { useLanguage } from "@/i18n";

const Header = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { t, locale, toggleLocale } = useLanguage();

  const navItems = [
    { label: t.nav.home, href: "/" },
    { label: t.nav.live, href: "/ao-vivo" },
    { label: t.nav.todayMatches, href: "/jogos-do-dia" },
    { label: t.nav.joinUs, href: "/junte-se" },
    { label: t.nav.community, href: "/comunidade" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <Link to="/" className="flex items-center gap-3">
          <img src={logoUnion} alt="Union Football Live" className="h-10 w-10 rounded-full object-cover" />
          <span className="font-heading text-lg uppercase tracking-wider gold-text hidden sm:block">
            Union Football Live
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          {navItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className="font-heading text-sm uppercase tracking-wider text-muted-foreground hover:text-primary transition-colors"
            >
              {item.label}
            </Link>
          ))}
          <button
            onClick={toggleLocale}
            className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors ml-2"
            aria-label="Toggle language"
          >
            <Globe size={16} />
            <span className="font-heading text-xs uppercase tracking-wider">
              {locale === 'pt-BR' ? 'EN' : 'PT'}
            </span>
          </button>
        </nav>

        <button
          className="md:hidden text-foreground"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {mobileOpen && (
        <nav className="md:hidden bg-background/95 backdrop-blur-md border-b border-border px-4 pb-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className="block py-3 font-heading text-sm uppercase tracking-wider text-muted-foreground hover:text-primary transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          <button
            onClick={() => { toggleLocale(); setMobileOpen(false); }}
            className="flex items-center gap-2 py-3 text-muted-foreground hover:text-primary transition-colors"
          >
            <Globe size={16} />
            <span className="font-heading text-sm uppercase tracking-wider">
              {locale === 'pt-BR' ? 'English' : 'Português'}
            </span>
          </button>
        </nav>
      )}
    </header>
  );
};

export default Header;
