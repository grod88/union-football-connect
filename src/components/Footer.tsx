import { Instagram, Youtube, Mail } from "lucide-react";
import { SOCIAL_LINKS } from "@/lib/constants";

const logoUnion = "https://ibdmydtnasimlplpojxn.supabase.co/storage/v1/object/public/union-logo/logo-new1.jpeg";
import { useLanguage } from "@/i18n";

const Footer = () => {
  const { t } = useLanguage();

  return (
    <footer className="border-t border-border py-12 px-4">
      <div className="container mx-auto max-w-5xl">
        <div className="flex flex-col items-center gap-6">
          <img src={logoUnion} alt="Union Football Live" className="w-12 h-12 rounded-full object-cover" />
          <div className="flex items-center gap-4">
            <a href={SOCIAL_LINKS.instagram} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors"><Instagram size={20} /></a>
            <a href={SOCIAL_LINKS.youtube} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors"><Youtube size={20} /></a>
            <a href={SOCIAL_LINKS.tiktok} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.75a8.24 8.24 0 0 0 4.76 1.5v-3.4a4.85 4.85 0 0 1-1-.16z"/></svg>
            </a>
            <a href={`mailto:${SOCIAL_LINKS.email}`} className="text-muted-foreground hover:text-primary transition-colors"><Mail size={20} /></a>
          </div>
          <p className="text-muted-foreground text-sm text-center">{t.footer.copyright}</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
