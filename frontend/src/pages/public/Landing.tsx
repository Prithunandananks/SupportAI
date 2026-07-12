import Navbar from "@/components/layout/Navbar";
import Hero from "@/components/landing/Hero";
import Features from "@/components/landing/Features";
import Footer from "@/components/landing/Footer";

function Landing() {
  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar forcePublic={true} />
      <Hero />
      <Features />
      <Footer />
    </div>
  );
}

export default Landing;