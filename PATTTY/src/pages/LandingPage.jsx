import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import AppPreviewCarousel from "../components/AppPreviewCarousel";
import {
  Apple,
  Play,
  Heart,
  Shield,
  Sparkles,
} from "lucide-react";

/* ---------------- MOTION PRESETS ---------------- */

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0 },
};

const stagger = {
  visible: {
    transition: { staggerChildren: 0.15 },
  },
};

/* ---------------- PAGE ---------------- */

export default function LandingPage() {
  return (
    <div className="relative min-h-[100svh] overflow-x-hidden text-white font-sans">

      {/* GLOBAL BACKGROUND (KESİNTİSİZ) */}
      <div className="fixed inset-0 -z-20 bg-gradient-to-br from-[#0b0b12] via-[#0f0f18] to-black" />

      {/* GLOBAL GLOW */}
      <div className="fixed inset-0 -z-10 flex justify-center pointer-events-none">
        <div className="w-[900px] h-[900px] bg-indigo-500/25 rounded-full blur-[180px] mt-[-200px]" />
      </div>

      {/* ================= NAVBAR ================= */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-black/40 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <Brand />

          <div className="hidden md:flex items-center gap-6 text-sm text-gray-400">
            <a href="#features" className="hover:text-white transition">
              Features
            </a>
            <a href="#preview" className="hover:text-white transition">
              Preview
            </a>
            <a href="#legal" className="hover:text-white transition">
              Legal
            </a>
          </div>
        </div>
      </nav>

      {/* ================= HERO ================= */}
      <header className="relative">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="max-w-4xl mx-auto px-6 pt-32 pb-36 text-center"
        >
          <motion.div variants={fadeUp}>
            <Badge />
          </motion.div>

          <motion.h1
            variants={fadeUp}
            className="text-5xl md:text-7xl font-black tracking-tight mb-8"
          >
            Smarter care for
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
              the pets you love.
            </span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto mb-12"
          >
            Pattty is a mobile-only pet care app designed to manage health,
            routines and wellbeing — all in one place.
          </motion.p>

          <motion.div
            variants={fadeUp}
            className="flex flex-col sm:flex-row justify-center gap-5"
          >
            <StoreButton icon={Apple} title="Download on the" store="App Store" />
            <StoreButton icon={Play} title="Get it on" store="Google Play" />
          </motion.div>
        </motion.div>
      </header>

      {/* ================= PREVIEW ================= */}
      <section id="preview" className="px-6 pb-32">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="max-w-5xl mx-auto rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl p-10"
        >
          <AppPreviewCarousel />
          <p className="text-center text-gray-500 text-sm mt-6">
            App interface preview – final screenshots coming soon
          </p>
        </motion.div>
      </section>

      {/* ================= FEATURES ================= */}
      <section id="features" className="max-w-7xl mx-auto px-6 pb-32">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={stagger}
          className="grid md:grid-cols-3 gap-8"
        >
          <Feature icon={Heart} title="Health Tracking" desc="Vaccines, medications and routines always organized." />
          <Feature icon={Sparkles} title="Smart Experience" desc="Designed for clarity, speed and peace of mind." />
          <Feature icon={Shield} title="Privacy First" desc="Your data is protected and never sold or shared." />
        </motion.div>
      </section>

      {/* ================= LEGAL ================= */}
      <section id="legal" className="border-t border-white/10 bg-black/40 backdrop-blur-xl">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="max-w-7xl mx-auto px-6 py-16 grid md:grid-cols-3 gap-8 text-sm"
        >
          <LegalItem title="Terms of Use" desc="Rules and conditions for using the Pattty mobile application." to="/terms" />
          <LegalItem title="Privacy Policy" desc="How we collect, use and protect your personal data." to="/privacy" />
          <LegalItem title="Contact" desc="Questions or support? Reach us anytime." href="mailto:support@pattty.com" />
        </motion.div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="border-t border-white/10 py-10 text-center text-xs text-gray-500">
        © 2025 Pattty. All rights reserved.
      </footer>
    </div>
  );
}

/* ---------------- COMPONENTS ---------------- */

const Brand = () => (
  <div className="flex items-center gap-2 font-bold text-xl">
    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center">P</div>
    Pattty
  </div>
);

const Badge = () => (
  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/10 text-indigo-300 text-xs mb-6">
    <Sparkles size={14} />
    Mobile-only pet care app
  </div>
);

const StoreButton = ({ icon: Icon, title, store }) => (
  <motion.button
    whileHover={{ scale: 1.04 }}
    whileTap={{ scale: 0.97 }}
    disabled
    className="flex items-center gap-4 px-6 py-4 rounded-2xl bg-white/10 border border-white/10 text-left cursor-not-allowed opacity-80"
  >
    <Icon size={28} />
    <div>
      <p className="text-xs text-gray-400">{title}</p>
      <p className="text-lg font-bold">{store}</p>
      <p className="text-xs text-gray-500">Coming soon</p>
    </div>
  </motion.button>
);

const Feature = ({ icon: Icon, title, desc }) => (
  <motion.div variants={fadeUp} className="p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl">
    <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 mb-6">
      <Icon size={28} />
    </div>
    <h3 className="text-xl font-bold mb-3">{title}</h3>
    <p className="text-gray-400 leading-relaxed">{desc}</p>
  </motion.div>
);

const LegalItem = ({ title, desc, to, href }) => {
  const Wrapper = to ? Link : "a";
  const props = to ? { to } : { href, target: "_blank", rel: "noopener noreferrer" };

  return (
    <Wrapper {...props} className="block hover:opacity-80 transition">
      <h4 className="font-semibold text-white mb-2">{title}</h4>
      <p className="text-gray-400">{desc}</p>
    </Wrapper>
  );
};
