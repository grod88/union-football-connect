import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import logoUnion from "@/assets/logo-union.jpg";

const navItems = [
  { label: "Início", href: "/" },
  { label: "Ao Vivo", href: "/ao-vivo" },
  { label: "Calendário", href: "/calendario" },
  { label: "Junte-se", href: "/junte-se" },
  { label: "Comunidade", href: "/comunidade" },
];

const Header = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

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
        </nav>
      )}
    </header>
  );
};

export default Header;
