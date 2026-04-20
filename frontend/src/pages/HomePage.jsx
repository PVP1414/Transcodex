import HeroSection from '../components/home/HeroSection';
import FeaturesSection from '../components/home/FeaturesSection';
import HowItWorksSection from '../components/home/HowItWorksSection';
import RecentGallerySection from '../components/home/RecentGallerySection';
import CTASection from '../components/home/CTASection';
import Footer from '../components/home/Footer';

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <RecentGallerySection />
      <CTASection />
      <Footer />
    </div>
  );
}