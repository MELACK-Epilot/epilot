/**
 * Page de connexion E-Pilot Congo - Design moderne mobile-first
 * React 19.2 | Activity API | PWA-ready | TypeScript
 * Accessible WCAG 2.2 AA | Optimisé pour tous les écrans
 * @module LoginPage
 */

import { motion } from 'framer-motion';
import { Shield, Tablet, Monitor } from 'lucide-react';
import { LoginForm } from '../components/LoginForm';


/**
 * Skeleton loader ultra-léger pour le formulaire
 */
const FormSkeleton = () => (
  <div className="space-y-4 animate-pulse">
    <div className="h-10 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 rounded-lg animate-shimmer" />
    <div className="h-10 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 rounded-lg animate-shimmer" style={{ animationDelay: '0.1s' }} />
    <div className="h-10 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 rounded-lg animate-shimmer" style={{ animationDelay: '0.2s' }} />
  </div>
);

/**
 * Section gauche - Branding E-Pilot Congo
 */
const BrandingSection = () => (
  <div className="hidden lg:flex lg:flex-1 relative overflow-hidden z-10">
    {/* Overlay gradient plus léger pour meilleure visibilité */}
    <div className="absolute inset-0 bg-gradient-to-br from-[#1D3557]/85 via-[#1D3557]/80 to-[#0d1f3d]/85" />

    {/* Contenu branding */}
    <div className="relative z-10 flex flex-col justify-center items-center w-full p-8 text-white">
      {/* Logo principal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
        className="mb-6"
      >
        <img 
          src="/images/logo/logo.svg" 
          alt="E-Pilot Congo"
          className="w-28 h-28 object-contain drop-shadow-2xl"
        />
      </motion.div>

      {/* Titre principal */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="text-center mb-6"
      >
        <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-white via-white to-[#2A9D8F] bg-clip-text text-transparent">
          E-Pilot Congo
        </h1>
        <p className="text-base text-white/95 max-w-lg leading-relaxed">
          Solution tout-en-un pour gérer votre établissement
        </p>
      </motion.div>

      {/* Valeur ajoutée principale */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="w-full max-w-lg space-y-3"
      >
        {/* Message principal */}
        <div className="bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-xl rounded-xl border border-white/30 p-4 shadow-xl">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#2A9D8F] to-[#1d7a6f] flex items-center justify-center flex-shrink-0 shadow-lg">
              <span className="text-2xl">🎓</span>
            </div>
            <div>
              <h3 className="font-bold text-base text-white mb-1">Automatisation complète</h3>
              <p className="text-white/90 text-xs leading-relaxed">
                Gain de temps et d'efficacité pour toutes vos tâches administratives
              </p>
            </div>
          </div>
        </div>

        {/* Fonctionnalités clés - Simplifié */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-white/10 backdrop-blur-md rounded-lg border border-white/20 p-3 hover:bg-white/15 transition-all cursor-pointer">
            <div className="text-xl mb-1">📋</div>
            <h4 className="font-semibold text-white text-xs mb-0.5">Gestion complète</h4>
            <p className="text-white/70 text-[10px]">Élèves, personnel, finances</p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-lg border border-white/20 p-3 hover:bg-white/15 transition-all cursor-pointer">
            <div className="text-xl mb-1">📄</div>
            <h4 className="font-semibold text-white text-xs mb-0.5">Documents auto</h4>
            <p className="text-white/70 text-[10px]">Relevés, reçus, badges</p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-lg border border-white/20 p-3 hover:bg-white/15 transition-all cursor-pointer">
            <div className="text-xl mb-1">🗓</div>
            <h4 className="font-semibold text-white text-xs mb-0.5">Emplois du temps</h4>
            <p className="text-white/70 text-[10px]">Dynamiques et flexibles</p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-lg border border-white/20 p-3 hover:bg-white/15 transition-all cursor-pointer">
            <div className="text-xl mb-1">✨</div>
            <h4 className="font-semibold text-white text-xs mb-0.5">Adaptable</h4>
            <p className="text-white/70 text-[10px]">Selon vos besoins</p>
          </div>
        </div>

        {/* Badge différenciateur */}
        <div className="bg-gradient-to-r from-[#E9C46A]/30 to-[#2A9D8F]/30 backdrop-blur-md rounded-lg border border-[#E9C46A]/40 p-3 text-center">
          <p className="text-white font-semibold text-xs">
            💡 Solution modélisable contrairement aux logiciels classiques
          </p>
        </div>
      </motion.div>
    </div>
  </div>
);

/**
 * Section droite - Formulaire ultra-moderne avec card
 */
const FormSection = () => (
  <div className="flex-1 flex items-center justify-center p-6 lg:p-8 relative overflow-hidden z-10">
    
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="w-full max-w-md relative z-10"
    >
      {/* Card moderne avec effets premium */}
      <div className="bg-white/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/60 p-6 relative overflow-hidden group hover:shadow-3xl transition-all duration-300">
        {/* Effet de brillance au survol */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/5 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        {/* Bordure lumineuse subtile */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#2A9D8F]/10 via-transparent to-[#1D3557]/10 opacity-50" />
      {/* Contenu de la card */}
      <div className="relative z-10">
      {/* Titre et description */}
      <div className="mb-6 text-center">
        <h1 className="text-3xl font-bold text-[#1D3557] mb-2">
          Connexion
        </h1>
        <p className="text-[#1D3557]/70 text-sm mb-3">
          Connectez-vous à votre compte pour accéder à la plateforme
        </p>
        {/* Ligne décorative aux couleurs du Congo-Brazzaville */}
        <motion.div 
          className="flex justify-center gap-1 mt-3"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <div className="h-1.5 w-20 bg-[#009E49] rounded-full shadow-sm" /> {/* Vert */}
          <div className="h-1.5 w-20 bg-[#FBDE4A] rounded-full shadow-sm" /> {/* Jaune */}
          <div className="h-1.5 w-20 bg-[#DC241F] rounded-full shadow-sm" /> {/* Rouge */}
        </motion.div>
      </div>

      {/* Badge sécurité 2FA renforcé */}
      <div className="mb-6 p-4 bg-gradient-to-r from-[#2A9D8F]/10 to-[#1D3557]/10 border-l-4 border-[#2A9D8F] rounded-lg">
        <div className="flex items-center gap-3">
          <Shield className="w-5 h-5 text-[#2A9D8F] flex-shrink-0" />
          <p className="text-sm text-[#1D3557] font-semibold">
            Connexion sécurisée • Authentification 2FA
          </p>
        </div>
      </div>

      {/* Formulaire */}
      <LoginForm />

      {/* Footer enrichi */}
      <div className="mt-6 pt-4 border-t border-gray-200 text-center space-y-2">
        <p className="text-sm text-[#1D3557]/70">
          Besoin d'aide ? <a href="/support" className="text-[#1D3557] hover:text-[#2A9D8F] font-semibold transition-colors">Support technique</a>
        </p>
        <p className="text-xs text-gray-500">
          © 2025 E-Pilot Congo • République du Congo 🇨🇬
        </p>
      </div>
      </div>
      {/* Fin du contenu de la card */}
      </div>
      {/* Fin de la card */}
    </motion.div>
  </div>
);

/**
 * Composant page de connexion principale
 */
export const LoginPage = () => {
  return (
    <div className="min-h-screen flex relative">
      {/* Background image sur toute la page */}
      <div className="absolute inset-0 z-0">
        <img 
          src="/images/backgrounds/bk.webp" 
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          loading="eager"
        />
      </div>

      {/* Section branding gauche (desktop uniquement) */}
      <BrandingSection />
      
      {/* Section formulaire droite */}
      <FormSection />
    </div>
  );
};

export default LoginPage;
