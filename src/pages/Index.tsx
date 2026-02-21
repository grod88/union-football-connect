import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import NextMatchSection from "@/components/NextMatchSection";
import VideoSection from "@/components/VideoSection";
import HowItWorksSection from "@/components/HowItWorksSection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <HeroSection />
      <NextMatchSection />
      <VideoSection />
      <HowItWorksSection />
      <Footer />
    </div>
  );
};

export default Index;
