/**
 * Fonctions utilitaires pour les modules
 * @module ModuleHelpers
 */

import React from 'react';
import {
  School, BarChart3, Clock, MessageSquare, ClipboardList, FileText,
  GraduationCap, Users, UserCheck, Settings, Package, Bot, CreditCard,
  FolderOpen, UserPlus, ListChecks, ArrowRightLeft, BookMarked,
  FileSpreadsheet, Calculator, BookOpen, Mail, Bell, ShieldAlert,
  UserX, KeyRound, ShieldCheck, UserCog, FileCheck, FileBarChart,
  DollarSign, Wallet, Receipt, AlertTriangle, Banknote, Target,
  Palmtree, FileSignature, HardHat, Library, UtensilsCrossed,
  Cross, Stethoscope, Wrench, DoorOpen, Bus, Calendar, Award, TrendingUp,
} from 'lucide-react';

/**
 * Mapping des slugs de modules vers leurs icônes
 */
export function getModuleIcon(slug: string): React.ReactNode {
  const icons: Record<string, React.ReactNode> = {
    'gestion-classes': <School className="w-full h-full" />,
    'notes-evaluations': <BarChart3 className="w-full h-full" />,
    'emplois-du-temps': <Clock className="w-full h-full" />,
    'communication-notifications': <MessageSquare className="w-full h-full" />,
    'suivi-absences': <ClipboardList className="w-full h-full" />,
    'discipline-sanctions': <ShieldAlert className="w-full h-full" />,
    'bulletins-scolaires': <FileText className="w-full h-full" />,
    'rapports-pedagogiques': <TrendingUp className="w-full h-full" />,
    'admission-eleves': <GraduationCap className="w-full h-full" />,
    'gestion-inscriptions': <Users className="w-full h-full" />,
    'suivi-eleves': <UserCheck className="w-full h-full" />,
    'gestion-utilisateurs': <Settings className="w-full h-full" />,
    'rapports-automatiques': <Bot className="w-full h-full" />
  };
  
  return icons[slug] || <Package className="w-full h-full" />;
}

/**
 * Mapping des noms d'icônes de la base de données vers composants Lucide
 */
export function mapIconNameToComponent(iconName: string | null): React.ReactNode | null {
  if (!iconName) return null;

  const normalized = iconName.replace(/[^a-zA-Z]/g, '').toLowerCase();

  const iconMap: Record<string, React.ReactNode> = {
    'checkcircle': <UserCheck className="w-full h-full" />,
    'creditcard': <CreditCard className="w-full h-full" />,
    'folderopen': <FolderOpen className="w-full h-full" />,
    'userplus': <UserPlus className="w-full h-full" />,
    'listchecks': <ListChecks className="w-full h-full" />,
    'arrowrightleft': <ArrowRightLeft className="w-full h-full" />,
    'filetext': <FileText className="w-full h-full" />,
    'bookmarked': <BookMarked className="w-full h-full" />,
    'calendar': <Calendar className="w-full h-full" />,
    'award': <Award className="w-full h-full" />,
    'filespreadsheet': <FileSpreadsheet className="w-full h-full" />,
    'school': <School className="w-full h-full" />,
    'calculator': <Calculator className="w-full h-full" />,
    'bookopen': <BookOpen className="w-full h-full" />,
    'clipboardlist': <ClipboardList className="w-full h-full" />,
    'barchart3': <BarChart3 className="w-full h-full" />,
    'messagesquare': <MessageSquare className="w-full h-full" />,
    '✉️': <Mail className="w-full h-full" />,
    '🔔': <Bell className="w-full h-full" />,
    'shieldalert': <ShieldAlert className="w-full h-full" />,
    'userx': <UserX className="w-full h-full" />,
    'clock': <Clock className="w-full h-full" />,
    'usercheck': <UserCheck className="w-full h-full" />,
    'users': <Users className="w-full h-full" />,
    'keyround': <KeyRound className="w-full h-full" />,
    'shieldcheck': <ShieldCheck className="w-full h-full" />,
    'usercog': <UserCog className="w-full h-full" />,
    'filecheck': <FileCheck className="w-full h-full" />,
    'filebarchart': <FileBarChart className="w-full h-full" />,
    'trendingup': <TrendingUp className="w-full h-full" />,
    'dollarsign': <DollarSign className="w-full h-full" />,
    'wallet': <Wallet className="w-full h-full" />,
    'receipt': <Receipt className="w-full h-full" />,
    'alerttriangle': <AlertTriangle className="w-full h-full" />,
    'banknote': <Banknote className="w-full h-full" />,
    'target': <Target className="w-full h-full" />,
    'palmtree': <Palmtree className="w-full h-full" />,
    'filesignature': <FileSignature className="w-full h-full" />,
    'hardhat': <HardHat className="w-full h-full" />,
    'library': <Library className="w-full h-full" />,
    'utensilscrossed': <UtensilsCrossed className="w-full h-full" />,
    'cross': <Cross className="w-full h-full" />,
    'stethoscope': <Stethoscope className="w-full h-full" />,
    'wrench': <Wrench className="w-full h-full" />,
    'dooropen': <DoorOpen className="w-full h-full" />,
    'bus': <Bus className="w-full h-full" />,
  };

  return iconMap[normalized] || null;
}

/**
 * Couleurs par catégorie
 */
export function getCategoryColor(categoryName: string): string {
  const colors: Record<string, string> = {
    'Pédagogie & Évaluations': '#3B82F6',
    'Scolarité & Admissions': '#10B981',
    'Vie Scolaire & Discipline': '#F59E0B',
    'Sécurité & Accès': '#EF4444',
    'Documents & Rapports': '#8B5CF6',
    'Communication': '#06B6D4',
    'Finances & Comptabilité': '#EC4899',
    'Ressources Humaines': '#F97316',
    'Services & Infrastructures': '#14B8A6',
  };
  
  return colors[categoryName] || '#6B7280';
}

/**
 * Descriptions par défaut des modules
 */
export function getModuleDescription(slug: string): string {
  const descriptions: Record<string, string> = {
    'gestion-classes': 'Gérez vos classes, groupes et affectations',
    'notes-evaluations': 'Saisissez et consultez les notes',
    'emplois-du-temps': 'Créez et gérez les emplois du temps',
    'communication-notifications': 'Communiquez avec les parents et le personnel',
    'suivi-absences': 'Suivez les absences des élèves',
    'discipline-sanctions': 'Gérez les incidents disciplinaires',
    'bulletins-scolaires': 'Générez les bulletins de notes',
    'rapports-pedagogiques': 'Créez des rapports pédagogiques',
    'admission-eleves': 'Gérez les admissions des nouveaux élèves',
    'gestion-inscriptions': 'Gérez les inscriptions',
    'suivi-eleves': 'Suivez le parcours des élèves',
    'gestion-utilisateurs': 'Gérez les utilisateurs de la plateforme',
    'rapports-automatiques': 'Générez des rapports automatiques',
  };
  
  return descriptions[slug] || 'Module pédagogique';
}
