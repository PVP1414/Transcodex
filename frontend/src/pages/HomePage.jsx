import { useAuth } from '../context/auth';
import HeroSection from '../components/home/HeroSection';
import FeaturesSection from '../components/home/FeaturesSection';
import HowItWorksSection from '../components/home/HowItWorksSection';
import RecentGallerySection from '../components/home/RecentGallerySection';
import CTASection from '../components/home/CTASection';
import Footer from '../components/home/Footer';

export default function HomePage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen">
      <HeroSection />
      {!user && <FeaturesSection />}
      {!user && <HowItWorksSection />}
      <RecentGallerySection />
      {!user && <CTASection />}
      <Footer />
    </div>
  );
}