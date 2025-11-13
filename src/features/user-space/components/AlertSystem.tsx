/**
 * Système d'alertes intelligentes pour le dashboard directeur
 * Analyse automatique des KPIs et génération d'alertes contextuelles
 */

import { memo, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  AlertTriangle, 
  CheckCircle, 
  Info, 
  TrendingDown, 
  TrendingUp,
  Users,
  Target,
  DollarSign,
  X,
  Bell
} from 'lucide-react';

export interface Alert {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message: string;
  niveau?: string;
  metric: string;
  value: number;
  threshold?: number;
  trend?: 'up' | 'down' | 'stable';
  priority: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  actionable: boolean;
  suggestions?: string[];
}

interface AlertSystemProps {
  kpiData: {
    eleves: number;
    taux_reussite: number;
    revenus: number;
    enseignants: number;
  };
  niveauxData: Array<{
    id: string;
    nom: string;
    kpis: {
      eleves: number;
      taux_reussite: number;
      revenus: number;
      enseignants: number;
      trend: 'up' | 'down' | 'stable';
    };
  }>;
  onDismissAlert: (alertId: string) => void;
  className?: string;
}

const AlertSystem = memo(({ 
  kpiData, 
  niveauxData, 
  onDismissAlert, 
  className = '' 
}: AlertSystemProps) => {

  // Génération intelligente des alertes
  const alerts = useMemo((): Alert[] => {
    const generatedAlerts: Alert[] = [];

    // Analyse globale
    if (kpiData.taux_reussite < 75) {
      generatedAlerts.push({
        id: 'global-success-rate',
        type: 'warning',
        title: 'Taux de réussite global en baisse',
        message: `Le taux de réussite global est de ${kpiData.taux_reussite}%, en dessous du seuil recommandé de 75%`,
        metric: 'taux_reussite',
        value: kpiData.taux_reussite,
        threshold: 75,
        priority: 'high',
        timestamp: new Date(),
        actionable: true,
        suggestions: [
          'Organiser des séances de soutien scolaire',
          'Analyser les matières en difficulté',
          'Renforcer l\'accompagnement pédagogique'
        ]
      });
    }

    if (kpiData.taux_reussite >= 90) {
      generatedAlerts.push({
        id: 'global-excellent',
        type: 'success',
        title: 'Excellents résultats !',
        message: `Félicitations ! Le taux de réussite global atteint ${kpiData.taux_reussite}%`,
        metric: 'taux_reussite',
        value: kpiData.taux_reussite,
        priority: 'medium',
        timestamp: new Date(),
        actionable: false
      });
    }

    // Analyse par niveau
    niveauxData.forEach(niveau => {
      // Alerte baisse d'effectifs
      if (niveau.kpis.trend === 'down' && niveau.kpis.eleves < 50) {
        generatedAlerts.push({
          id: `${niveau.id}-low-students`,
          type: 'warning',
          title: `Effectifs en baisse - ${niveau.nom}`,
          message: `Le ${niveau.nom} compte seulement ${niveau.kpis.eleves} élèves avec une tendance à la baisse`,
          niveau: niveau.nom,
          metric: 'eleves',
          value: niveau.kpis.eleves,
          trend: 'down',
          priority: 'medium',
          timestamp: new Date(),
          actionable: true,
          suggestions: [
            'Campagne de communication ciblée',
            'Révision des frais de scolarité',
            'Amélioration de l\'offre pédagogique'
          ]
        });
      }

      // Alerte taux de réussite critique
      if (niveau.kpis.taux_reussite < 70) {
        generatedAlerts.push({
          id: `${niveau.id}-critical-success`,
          type: 'error',
          title: `Taux de réussite critique - ${niveau.nom}`,
          message: `Le taux de réussite du ${niveau.nom} est de ${niveau.kpis.taux_reussite}%, situation critique`,
          niveau: niveau.nom,
          metric: 'taux_reussite',
          value: niveau.kpis.taux_reussite,
          threshold: 70,
          priority: 'critical',
          timestamp: new Date(),
          actionable: true,
          suggestions: [
            'Audit pédagogique urgent',
            'Formation des enseignants',
            'Réduction des effectifs par classe',
            'Mise en place de tutorat'
          ]
        });
      }

      // Alerte performance exceptionnelle
      if (niveau.kpis.taux_reussite >= 95 && niveau.kpis.trend === 'up') {
        generatedAlerts.push({
          id: `${niveau.id}-exceptional`,
          type: 'success',
          title: `Performance exceptionnelle - ${niveau.nom}`,
          message: `Le ${niveau.nom} affiche un excellent taux de réussite de ${niveau.kpis.taux_reussite}% en progression`,
          niveau: niveau.nom,
          metric: 'taux_reussite',
          value: niveau.kpis.taux_reussite,
          trend: 'up',
          priority: 'low',
          timestamp: new Date(),
          actionable: false
        });
      }

      // Alerte ratio élèves/enseignants
      const ratio = niveau.kpis.eleves / niveau.kpis.enseignants;
      if (ratio > 25) {
        generatedAlerts.push({
          id: `${niveau.id}-ratio-high`,
          type: 'warning',
          title: `Ratio élèves/enseignants élevé - ${niveau.nom}`,
          message: `Ratio de ${ratio.toFixed(1)} élèves par enseignant au ${niveau.nom} (recommandé: <25)`,
          niveau: niveau.nom,
          metric: 'ratio',
          value: ratio,
          threshold: 25,
          priority: 'medium',
          timestamp: new Date(),
          actionable: true,
          suggestions: [
            'Recruter des enseignants supplémentaires',
            'Réorganiser les classes',
            'Mettre en place des assistants pédagogiques'
          ]
        });
      }
    });

    // Tri par priorité et date
    return generatedAlerts.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }
      return b.timestamp.getTime() - a.timestamp.getTime();
    });
  }, [kpiData, niveauxData]);

  const getAlertIcon = (type: Alert['type']) => {
    switch (type) {
      case 'success': return CheckCircle;
      case 'warning': return AlertTriangle;
      case 'error': return AlertTriangle;
      case 'info': return Info;
      default: return Info;
    }
  };

  const getAlertColor = (type: Alert['type']) => {
    switch (type) {
      case 'success': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-orange-600 bg-orange-100';
      case 'error': return 'text-red-600 bg-red-100';
      case 'info': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityColor = (priority: Alert['priority']) => {
    switch (priority) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  if (alerts.length === 0) {
    return (
      <Card className={`p-6 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 ${className}`}>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-green-900">Tout va bien !</h3>
            <p className="text-green-700">Aucune alerte détectée. Tous les indicateurs sont dans les normes.</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`p-6 bg-white border-0 shadow-lg rounded-2xl ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center shadow-md">
            <Bell className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Alertes & Recommandations</h3>
            <p className="text-sm text-gray-600">{alerts.length} alerte{alerts.length > 1 ? 's' : ''} détectée{alerts.length > 1 ? 's' : ''}</p>
          </div>
        </div>
        
        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
          {alerts.filter(a => a.priority === 'critical' || a.priority === 'high').length} prioritaire{alerts.filter(a => a.priority === 'critical' || a.priority === 'high').length > 1 ? 's' : ''}
        </Badge>
      </div>

      {/* Liste des alertes */}
      <div className="space-y-4">
        <AnimatePresence>
          {alerts.map((alert) => {
            const IconComponent = getAlertIcon(alert.type);
            
            return (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="relative p-4 bg-gray-50 rounded-xl border border-gray-200 hover:shadow-md transition-all duration-200"
              >
                {/* Indicateur de priorité */}
                <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl ${getPriorityColor(alert.priority)}`} />
                
                <div className="flex items-start gap-4 ml-2">
                  {/* Icône */}
                  <div className={`p-2 rounded-lg ${getAlertColor(alert.type)}`}>
                    <IconComponent className="h-5 w-5" />
                  </div>
                  
                  {/* Contenu */}
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-900">{alert.title}</h4>
                      <div className="flex items-center gap-2">
                        {alert.niveau && (
                          <Badge variant="outline" className="text-xs">
                            {alert.niveau}
                          </Badge>
                        )}
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${
                            alert.priority === 'critical' ? 'bg-red-50 text-red-700 border-red-200' :
                            alert.priority === 'high' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                            alert.priority === 'medium' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                            'bg-green-50 text-green-700 border-green-200'
                          }`}
                        >
                          {alert.priority === 'critical' ? 'Critique' :
                           alert.priority === 'high' ? 'Élevée' :
                           alert.priority === 'medium' ? 'Moyenne' : 'Faible'}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDismissAlert(alert.id)}
                          className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <p className="text-gray-700 mb-3">{alert.message}</p>
                    
                    {/* Suggestions */}
                    {alert.suggestions && alert.suggestions.length > 0 && (
                      <div className="bg-white p-3 rounded-lg border border-gray-200">
                        <p className="text-sm font-medium text-gray-900 mb-2">Recommandations :</p>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {alert.suggestions.map((suggestion, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <span className="text-blue-500 mt-1">•</span>
                              {suggestion}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </Card>
  );
});

AlertSystem.displayName = 'AlertSystem';

export default AlertSystem;
