/**
 * Page Plans & Tarification - VERSION PREMIUM
 * Design moderne avec animations et fonctionnalités d'export
 * @module PlansSimplified
 */

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  Package, 
  Users, 
  DollarSign, 
  Plus, 
  Search,
  Edit3,
  Trash2,
  ChevronDown,
  ChevronUp,
  Check,
  Crown,
  Building2,
  Download,
  FileSpreadsheet,
  FileText,
  TrendingUp,
  Sparkles,
  Copy,
  ArrowRightLeft,
  FileBarChart,
  Zap,
  FileDown
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/store/auth.store';
import { useAllPlansWithContent } from '../hooks/usePlanWithContent';
import { usePlanStats } from '../hooks/usePlans';
import { useAllActiveSubscriptions } from '../hooks/usePlanSubscriptions';
import { usePlansPage } from '../hooks/usePlansPage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PlanFormDialog } from '../components/plans/PlanFormDialog';
import { CountUp } from '@/components/ui/count-up';
import { useToast } from '@/hooks/use-toast';

// Animations fluides
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { y: 30, opacity: 0, scale: 0.95 },
  visible: { 
    y: 0, 
    opacity: 1, 
    scale: 1,
    transition: { type: "spring", stiffness: 100, damping: 15 } 
  }
};

export const PlansSimplified = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const isSuperAdmin = user?.role === 'super_admin';
  const [expandedPlanId, setExpandedPlanId] = useState<string | null>(null);
  const printRef = useRef<HTMLDivElement>(null);
  
  const {
    searchQuery,
    selectedPlan,
    dialogOpen,
    dialogMode,
    setSearchQuery,
    setDialogOpen,
    handleCreate,
    handleEdit,
    handleDelete,
  } = usePlansPage();
  
  const { data: plans, isLoading } = useAllPlansWithContent(searchQuery);
  const { data: stats } = usePlanStats();
  const { data: allSubscriptions } = useAllActiveSubscriptions();
  
  // Calculer MRR
  const mrr = allSubscriptions?.reduce((sum, sub) => sum + (sub.price || 0), 0) || 0;
  const arr = mrr * 12;

  // Formater montant
  const formatAmount = (amount: number) => {
    if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `${(amount / 1000).toFixed(0)}K`;
    return amount.toString();
  };

  // Compter abonnements par plan
  const getSubscriptionCount = (planId: string) => {
    return allSubscriptions?.filter(sub => sub.plan_id === planId).length || 0;
  };

  // Export CSV
  // Données pour export
  const getExportData = () => {
    if (!plans) return { headers: [], rows: [] };
    
    const headers = ['Plan', 'Prix (FCFA)', 'Période', 'Écoles Max', 'Élèves Max', 'Personnel Max', 'Stockage', 'Groupes Abonnés'];
    const rows = plans.map(plan => [
      plan.name,
      plan.price || 0,
      plan.billingPeriod === 'yearly' ? 'Annuel' : 'Mensuel',
      plan.maxSchools === -1 ? 'Illimité' : plan.maxSchools,
      plan.maxStudents === -1 ? 'Illimité' : plan.maxStudents,
      plan.maxStaff === -1 ? 'Illimité' : plan.maxStaff,
      `${plan.maxStorage || 1} GB`,
      getSubscriptionCount(plan.id)
    ]);
    
    return { headers, rows };
  };

  // Export Excel (XLSX)
  const exportToExcel = () => {
    if (!plans) return;
    
    const { headers, rows } = getExportData();
    const date = new Date().toLocaleDateString('fr-FR');
    
    // Créer le contenu XML pour Excel
    const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Styles>
    <Style ss:ID="Header">
      <Font ss:Bold="1" ss:Color="#FFFFFF"/>
      <Interior ss:Color="#1D3557" ss:Pattern="Solid"/>
      <Alignment ss:Horizontal="Center"/>
    </Style>
    <Style ss:ID="Title">
      <Font ss:Bold="1" ss:Size="14" ss:Color="#1D3557"/>
    </Style>
    <Style ss:ID="SubTitle">
      <Font ss:Size="10" ss:Color="#666666"/>
    </Style>
    <Style ss:ID="Currency">
      <NumberFormat ss:Format="#,##0"/>
      <Alignment ss:Horizontal="Right"/>
    </Style>
    <Style ss:ID="Center">
      <Alignment ss:Horizontal="Center"/>
    </Style>
  </Styles>
  <Worksheet ss:Name="Plans Tarification">
    <Table>
      <Column ss:Width="120"/>
      <Column ss:Width="100"/>
      <Column ss:Width="80"/>
      <Column ss:Width="90"/>
      <Column ss:Width="90"/>
      <Column ss:Width="100"/>
      <Column ss:Width="80"/>
      <Column ss:Width="110"/>
      <Row>
        <Cell ss:StyleID="Title" ss:MergeAcross="7"><Data ss:Type="String">📊 Plans &amp; Tarification E-Pilot</Data></Cell>
      </Row>
      <Row>
        <Cell ss:StyleID="SubTitle" ss:MergeAcross="7"><Data ss:Type="String">Exporté le ${date} | MRR: ${formatAmount(mrr)} FCFA | ARR: ${formatAmount(arr)} FCFA</Data></Cell>
      </Row>
      <Row></Row>
      <Row>
        ${headers.map(h => `<Cell ss:StyleID="Header"><Data ss:Type="String">${h}</Data></Cell>`).join('')}
      </Row>
      ${rows.map(row => `
      <Row>
        ${row.map((cell, i) => {
          const isNumber = typeof cell === 'number';
          const style = i === 1 ? 'Currency' : (i >= 3 && i <= 6 ? 'Center' : '');
          return `<Cell${style ? ` ss:StyleID="${style}"` : ''}><Data ss:Type="${isNumber ? 'Number' : 'String'}">${cell}</Data></Cell>`;
        }).join('')}
      </Row>`).join('')}
      <Row></Row>
      <Row>
        <Cell ss:StyleID="SubTitle" ss:MergeAcross="7"><Data ss:Type="String">Total: ${plans.length} plans | ${stats?.subscriptions || 0} groupes abonnés</Data></Cell>
      </Row>
    </Table>
  </Worksheet>
</Workbook>`;
    
    const blob = new Blob([xmlContent], { type: 'application/vnd.ms-excel' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `plans-tarification-${new Date().toISOString().split('T')[0]}.xls`;
    link.click();
    
    toast({
      title: "Export Excel réussi",
      description: "Le fichier Excel a été téléchargé",
    });
  };

  // Export PDF
  const exportToPDF = () => {
    if (!plans) return;
    
    const { headers, rows } = getExportData();
    const date = new Date().toLocaleDateString('fr-FR');
    
    // Créer une fenêtre pour l'impression PDF
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({
        title: "Erreur",
        description: "Impossible d'ouvrir la fenêtre d'impression. Vérifiez les popups.",
        variant: "destructive"
      });
      return;
    }
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Plans & Tarification E-Pilot</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            padding: 40px; 
            color: #1D3557;
          }
          .header { 
            text-align: center; 
            margin-bottom: 30px; 
            padding-bottom: 20px;
            border-bottom: 3px solid #2A9D8F;
          }
          .logo { 
            font-size: 28px; 
            font-weight: bold; 
            color: #1D3557;
            margin-bottom: 5px;
          }
          .logo span { color: #2A9D8F; }
          .subtitle { color: #666; font-size: 14px; }
          .stats-row {
            display: flex;
            justify-content: center;
            gap: 40px;
            margin: 20px 0;
            padding: 15px;
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            border-radius: 10px;
          }
          .stat-item {
            text-align: center;
          }
          .stat-value {
            font-size: 24px;
            font-weight: bold;
            color: #1D3557;
          }
          .stat-label {
            font-size: 12px;
            color: #666;
            text-transform: uppercase;
          }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-top: 20px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            border-radius: 8px;
            overflow: hidden;
          }
          th { 
            background: linear-gradient(135deg, #1D3557 0%, #2A9D8F 100%);
            color: white; 
            padding: 14px 12px; 
            text-align: left;
            font-weight: 600;
            font-size: 13px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          td { 
            padding: 12px; 
            border-bottom: 1px solid #e9ecef;
            font-size: 13px;
          }
          tr:nth-child(even) { background: #f8f9fa; }
          tr:hover { background: #e3f2fd; }
          .plan-gratuit { border-left: 4px solid #6c757d; }
          .plan-premium { border-left: 4px solid #2A9D8F; }
          .plan-pro { border-left: 4px solid #1D3557; }
          .plan-institutionnel { border-left: 4px solid #E9C46A; }
          .price { font-weight: bold; color: #2A9D8F; }
          .footer { 
            margin-top: 30px; 
            text-align: center; 
            color: #999; 
            font-size: 11px;
            padding-top: 20px;
            border-top: 1px solid #e9ecef;
          }
          @media print {
            body { padding: 20px; }
            .stats-row { break-inside: avoid; }
            table { page-break-inside: auto; }
            tr { page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">E-<span>Pilot</span> Congo 🇨🇬</div>
          <div class="subtitle">Plans & Tarification - Exporté le ${date}</div>
        </div>
        
        <div class="stats-row">
          <div class="stat-item">
            <div class="stat-value">${stats?.active || 0}</div>
            <div class="stat-label">Plans Actifs</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">${formatAmount(mrr)} FCFA</div>
            <div class="stat-label">MRR</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">${formatAmount(arr)} FCFA</div>
            <div class="stat-label">ARR</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">${stats?.subscriptions || 0}</div>
            <div class="stat-label">Groupes Abonnés</div>
          </div>
        </div>
        
        <table>
          <thead>
            <tr>
              ${headers.map(h => `<th>${h}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${rows.map((row, i) => {
              const planSlug = plans[i]?.slug || 'gratuit';
              return `<tr class="plan-${planSlug}">
                ${row.map((cell, j) => `<td${j === 1 ? ' class="price"' : ''}>${cell}</td>`).join('')}
              </tr>`;
            }).join('')}
          </tbody>
        </table>
        
        <div class="footer">
          <p>Document généré automatiquement par E-Pilot - Système de Gestion Scolaire</p>
          <p>© ${new Date().getFullYear()} E-Pilot Congo. Tous droits réservés.</p>
        </div>
        
        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() { window.close(); }, 500);
          };
        </script>
      </body>
      </html>
    `);
    
    printWindow.document.close();
    
    toast({
      title: "Export PDF",
      description: "La fenêtre d'impression PDF s'est ouverte",
    });
  };

  // Export CSV (compatible Excel)
  const exportToCSV = () => {
    if (!plans) return;
    
    const { headers, rows } = getExportData();
    
    // BOM pour UTF-8 (compatibilité Excel)
    const BOM = '\uFEFF';
    const csvContent = BOM + [headers, ...rows].map(row => 
      row.map(cell => `"${cell}"`).join(';')
    ).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `plans-tarification-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    toast({
      title: "Export CSV réussi",
      description: "Le fichier CSV a été téléchargé",
    });
  };

  // Copier les stats
  const copyStats = () => {
    const statsText = `
📊 Plans & Tarification E-Pilot
================================
📦 Plans Actifs: ${stats?.active || 0}
💰 MRR: ${formatAmount(mrr)} FCFA
📈 ARR: ${formatAmount(arr)} FCFA
🏢 Groupes Abonnés: ${stats?.subscriptions || 0}
📅 Date: ${new Date().toLocaleDateString('fr-FR')}
    `.trim();
    
    navigator.clipboard.writeText(statsText);
    toast({
      title: "Copié !",
      description: "Les statistiques ont été copiées dans le presse-papier",
    });
  };

  return (
    <div className="min-h-screen bg-[#F9F9F9] p-6 print:bg-white print:p-0">
      <motion.div
        ref={printRef}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-[1600px] mx-auto space-y-6"
      >
        {/* Header Premium */}
        <motion.div variants={itemVariants} className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-[#1D3557] to-[#2A9D8F] rounded-2xl shadow-lg print:hidden">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-[#1D3557] tracking-tight">
                Plans & Tarification
              </h1>
              <p className="text-gray-500 text-sm mt-1 flex items-center gap-2">
                <span>Gérez vos offres d'abonnement</span>
                <Badge variant="outline" className="bg-[#2A9D8F]/10 text-[#2A9D8F] border-[#2A9D8F]/20 text-xs print:hidden">
                  {plans?.length || 0} plans
                </Badge>
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 print:hidden">
            {/* Menu Export */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2 border-gray-200 hover:bg-white">
                  <Download className="w-4 h-4" />
                  Exporter
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel className="text-xs text-gray-500 uppercase">Formats de fichier</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={exportToExcel} className="gap-2 cursor-pointer hover:bg-green-50">
                  <FileSpreadsheet className="w-4 h-4 text-green-600" />
                  <div className="flex flex-col">
                    <span className="font-medium">Excel (.xls)</span>
                    <span className="text-xs text-gray-400">Tableau formaté</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={exportToPDF} className="gap-2 cursor-pointer hover:bg-red-50">
                  <FileDown className="w-4 h-4 text-red-600" />
                  <div className="flex flex-col">
                    <span className="font-medium">PDF</span>
                    <span className="text-xs text-gray-400">Document imprimable</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={exportToCSV} className="gap-2 cursor-pointer hover:bg-blue-50">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <div className="flex flex-col">
                    <span className="font-medium">CSV</span>
                    <span className="text-xs text-gray-400">Compatible Excel</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs text-gray-500 uppercase">Actions</DropdownMenuLabel>
                <DropdownMenuItem onClick={copyStats} className="gap-2 cursor-pointer hover:bg-purple-50">
                  <Copy className="w-4 h-4 text-purple-600" />
                  Copier les statistiques
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {isSuperAdmin && (
              <Button 
                onClick={handleCreate}
                className="bg-[#2A9D8F] hover:bg-[#238b7e] text-white gap-2 shadow-lg shadow-[#2A9D8F]/20 hover:-translate-y-0.5 transition-all"
              >
                <Plus className="w-4 h-4" />
                Nouveau Plan
              </Button>
            )}
          </div>
        </motion.div>

        {/* 4 KPIs Premium avec animations */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Plans Actifs */}
          <motion.div whileHover={{ y: -4, scale: 1.02 }} transition={{ duration: 0.2 }}>
            <Card className="relative overflow-hidden border-0 shadow-md bg-white p-6 hover:shadow-xl transition-all group cursor-pointer">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#1D3557]/10 to-transparent rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-[#1D3557]/10 rounded-xl group-hover:scale-110 transition-transform">
                    <Package className="w-6 h-6 text-[#1D3557]" />
                  </div>
                  <Badge variant="outline" className="bg-[#1D3557]/5 text-[#1D3557] border-[#1D3557]/20 text-xs">
                    Actifs
                  </Badge>
                </div>
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-1">Plans</p>
                <CountUp 
                  value={stats?.active || 0} 
                  className="text-4xl font-bold text-[#1D3557]"
                />
              </div>
            </Card>
          </motion.div>

          {/* MRR */}
          <motion.div whileHover={{ y: -4, scale: 1.02 }} transition={{ duration: 0.2 }}>
            <Card className="relative overflow-hidden border-0 shadow-md bg-white p-6 hover:shadow-xl transition-all group cursor-pointer">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#2A9D8F]/10 to-transparent rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-[#2A9D8F]/10 rounded-xl group-hover:scale-110 transition-transform">
                    <DollarSign className="w-6 h-6 text-[#2A9D8F]" />
                  </div>
                  <Badge variant="outline" className="bg-[#2A9D8F]/5 text-[#2A9D8F] border-[#2A9D8F]/20 text-xs">
                    Mensuel
                  </Badge>
                </div>
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-1">MRR</p>
                <div className="flex items-baseline gap-2">
                  <CountUp 
                    value={mrr} 
                    formatter={formatAmount}
                    className="text-4xl font-bold text-[#1D3557]"
                  />
                  <span className="text-sm font-semibold text-gray-400">FCFA</span>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* ARR */}
          <motion.div whileHover={{ y: -4, scale: 1.02 }} transition={{ duration: 0.2 }}>
            <Card className="relative overflow-hidden border-0 shadow-md bg-white p-6 hover:shadow-xl transition-all group cursor-pointer">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#8B5CF6]/10 to-transparent rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-[#8B5CF6]/10 rounded-xl group-hover:scale-110 transition-transform">
                    <TrendingUp className="w-6 h-6 text-[#8B5CF6]" />
                  </div>
                  <Badge variant="outline" className="bg-[#8B5CF6]/5 text-[#8B5CF6] border-[#8B5CF6]/20 text-xs">
                    Annuel
                  </Badge>
                </div>
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-1">ARR</p>
                <div className="flex items-baseline gap-2">
                  <CountUp 
                    value={arr} 
                    formatter={formatAmount}
                    className="text-4xl font-bold text-[#1D3557]"
                  />
                  <span className="text-sm font-semibold text-gray-400">FCFA</span>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Groupes Abonnés */}
          <motion.div whileHover={{ y: -4, scale: 1.02 }} transition={{ duration: 0.2 }}>
            <Card className="relative overflow-hidden border-0 shadow-md bg-white p-6 hover:shadow-xl transition-all group cursor-pointer">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#E9C46A]/10 to-transparent rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-[#E9C46A]/10 rounded-xl group-hover:scale-110 transition-transform">
                    <Building2 className="w-6 h-6 text-[#E9C46A]" />
                  </div>
                  <Badge variant="outline" className="bg-[#E9C46A]/5 text-[#E9C46A] border-[#E9C46A]/20 text-xs">
                    Clients
                  </Badge>
                </div>
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-1">Groupes</p>
                <CountUp 
                  value={stats?.subscriptions || 0} 
                  className="text-4xl font-bold text-[#1D3557]"
                />
              </div>
            </Card>
          </motion.div>
        </motion.div>

        {/* Actions Rapides */}
        <motion.div variants={itemVariants}>
          <Card className="border-0 shadow-md bg-white p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-[#E9C46A]" />
                <h3 className="font-semibold text-[#1D3557]">Actions Rapides</h3>
              </div>
              <Badge variant="outline" className="text-xs text-gray-500">
                Raccourcis
              </Badge>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {/* Nouveau Plan */}
              {isSuperAdmin && (
                <motion.button
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCreate}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl bg-gradient-to-br from-[#2A9D8F]/10 to-[#2A9D8F]/5 border border-[#2A9D8F]/20 hover:border-[#2A9D8F]/40 transition-all group"
                >
                  <div className="p-2.5 rounded-xl bg-[#2A9D8F] text-white group-hover:scale-110 transition-transform shadow-lg shadow-[#2A9D8F]/20">
                    <Plus className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-medium text-gray-700">Nouveau Plan</span>
                </motion.button>
              )}

              {/* Demandes de changement */}
              <motion.button
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/dashboard/plan-change-requests')}
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-gradient-to-br from-[#1D3557]/10 to-[#1D3557]/5 border border-[#1D3557]/20 hover:border-[#1D3557]/40 transition-all group"
              >
                <div className="p-2.5 rounded-xl bg-[#1D3557] text-white group-hover:scale-110 transition-transform shadow-lg shadow-[#1D3557]/20">
                  <ArrowRightLeft className="w-5 h-5" />
                </div>
                <span className="text-xs font-medium text-gray-700">Changements</span>
              </motion.button>

              {/* Abonnements */}
              <motion.button
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/dashboard/subscriptions')}
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-gradient-to-br from-[#8B5CF6]/10 to-[#8B5CF6]/5 border border-[#8B5CF6]/20 hover:border-[#8B5CF6]/40 transition-all group"
              >
                <div className="p-2.5 rounded-xl bg-[#8B5CF6] text-white group-hover:scale-110 transition-transform shadow-lg shadow-[#8B5CF6]/20">
                  <Users className="w-5 h-5" />
                </div>
                <span className="text-xs font-medium text-gray-700">Abonnements</span>
              </motion.button>

              {/* Rapports */}
              <motion.button
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/dashboard/reports')}
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-gradient-to-br from-[#E9C46A]/10 to-[#E9C46A]/5 border border-[#E9C46A]/20 hover:border-[#E9C46A]/40 transition-all group"
              >
                <div className="p-2.5 rounded-xl bg-[#E9C46A] text-white group-hover:scale-110 transition-transform shadow-lg shadow-[#E9C46A]/20">
                  <FileBarChart className="w-5 h-5" />
                </div>
                <span className="text-xs font-medium text-gray-700">Rapports</span>
              </motion.button>

              {/* Finances */}
              <motion.button
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/dashboard/finances')}
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20 hover:border-emerald-500/40 transition-all group"
              >
                <div className="p-2.5 rounded-xl bg-emerald-500 text-white group-hover:scale-110 transition-transform shadow-lg shadow-emerald-500/20">
                  <DollarSign className="w-5 h-5" />
                </div>
                <span className="text-xs font-medium text-gray-700">Finances</span>
              </motion.button>

              {/* Export Excel */}
              <motion.button
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={exportToExcel}
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20 hover:border-green-500/40 transition-all group"
              >
                <div className="p-2.5 rounded-xl bg-green-500 text-white group-hover:scale-110 transition-transform shadow-lg shadow-green-500/20">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <span className="text-xs font-medium text-gray-700">Excel</span>
              </motion.button>

              {/* Export PDF */}
              <motion.button
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={exportToPDF}
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-gradient-to-br from-red-500/10 to-red-500/5 border border-red-500/20 hover:border-red-500/40 transition-all group"
              >
                <div className="p-2.5 rounded-xl bg-red-500 text-white group-hover:scale-110 transition-transform shadow-lg shadow-red-500/20">
                  <FileDown className="w-5 h-5" />
                </div>
                <span className="text-xs font-medium text-gray-700">PDF</span>
              </motion.button>
            </div>
          </Card>
        </motion.div>

        {/* Barre de recherche et titre section */}
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-[#1D3557]">Tous les Plans</h2>
            <p className="text-sm text-gray-500">{plans?.length || 0} plan{(plans?.length || 0) > 1 ? 's' : ''} disponible{(plans?.length || 0) > 1 ? 's' : ''}</p>
          </div>
          <div className="relative w-full sm:w-auto sm:min-w-[300px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Rechercher un plan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 border-gray-200 focus:border-[#1D3557] focus:ring-[#1D3557] bg-white"
            />
          </div>
        </motion.div>

        {/* Grille des Plans */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="p-6 animate-pulse border-0 shadow-md">
                <div className="h-6 bg-gray-100 rounded w-24 mb-4" />
                <div className="h-10 bg-gray-100 rounded w-32 mb-4" />
                <div className="h-4 bg-gray-100 rounded w-full mb-2" />
                <div className="h-4 bg-gray-100 rounded w-3/4" />
              </Card>
            ))}
          </div>
        ) : plans && plans.length > 0 ? (
          <motion.div 
            variants={containerVariants}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {plans.map((plan) => {
              const subscriptionCount = getSubscriptionCount(plan.id);
              const isExpanded = expandedPlanId === plan.id;
              const isPopular = plan.slug === 'premium';
              const isPro = plan.slug === 'pro';
              const isInstitutionnel = plan.slug === 'institutionnel';
              
              // Couleurs et dégradés par plan
              const planThemes: Record<string, { 
                gradient: string; 
                headerGradient: string;
                text: string; 
                border: string;
                badge: string;
                badgeText: string;
                icon: string;
                checkColor: string;
                priceColor: string;
              }> = {
                gratuit: { 
                  gradient: 'from-slate-50 to-gray-100',
                  headerGradient: 'from-slate-600 to-slate-700',
                  text: 'text-slate-700', 
                  border: 'border-slate-200',
                  badge: 'bg-slate-100',
                  badgeText: 'text-slate-600',
                  icon: 'text-slate-500',
                  checkColor: 'text-slate-500',
                  priceColor: 'text-slate-700'
                },
                premium: { 
                  gradient: 'from-teal-50 via-emerald-50 to-cyan-50',
                  headerGradient: 'from-[#2A9D8F] to-[#1d7a6f]',
                  text: 'text-[#2A9D8F]', 
                  border: 'border-[#2A9D8F]/30',
                  badge: 'bg-[#2A9D8F]',
                  badgeText: 'text-white',
                  icon: 'text-[#2A9D8F]',
                  checkColor: 'text-[#2A9D8F]',
                  priceColor: 'text-[#2A9D8F]'
                },
                pro: { 
                  gradient: 'from-indigo-50 via-blue-50 to-violet-50',
                  headerGradient: 'from-[#1D3557] to-[#0d1f3d]',
                  text: 'text-[#1D3557]', 
                  border: 'border-[#1D3557]/30',
                  badge: 'bg-[#1D3557]',
                  badgeText: 'text-white',
                  icon: 'text-[#1D3557]',
                  checkColor: 'text-[#1D3557]',
                  priceColor: 'text-[#1D3557]'
                },
                institutionnel: { 
                  gradient: 'from-amber-50 via-yellow-50 to-orange-50',
                  headerGradient: 'from-[#E9C46A] to-[#d4a84f]',
                  text: 'text-amber-700', 
                  border: 'border-[#E9C46A]/40',
                  badge: 'bg-gradient-to-r from-amber-500 to-orange-500',
                  badgeText: 'text-white',
                  icon: 'text-amber-600',
                  checkColor: 'text-amber-600',
                  priceColor: 'text-amber-700'
                },
              };
              
              const theme = planThemes[plan.slug] || planThemes.gratuit;

              return (
                <motion.div
                  key={plan.id}
                  variants={itemVariants}
                  whileHover={{ y: -8, scale: 1.02 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="h-full"
                >
                  <Card className={`relative overflow-hidden border-2 ${theme.border} shadow-lg hover:shadow-2xl transition-all duration-300 bg-gradient-to-br ${theme.gradient} h-full flex flex-col`}>
                    {/* Header coloré */}
                    <div className={`h-2 bg-gradient-to-r ${theme.headerGradient}`} />
                    
                    {/* Badge Populaire / Pro / Institutionnel */}
                    {(isPopular || isPro || isInstitutionnel) && (
                      <div className="absolute top-2 right-0">
                        <div className={`${theme.badge} ${theme.badgeText} text-xs font-bold px-3 py-1.5 rounded-l-full flex items-center gap-1.5 shadow-lg`}>
                          <Crown className="w-3.5 h-3.5" />
                          {isPopular ? 'Populaire' : isPro ? 'Avancé' : 'Premium'}
                        </div>
                      </div>
                    )}

                    <div className="p-6 flex-1 flex flex-col">
                      {/* Icône du plan */}
                      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${theme.headerGradient} flex items-center justify-center mb-4 shadow-lg`}>
                        <Package className="w-6 h-6 text-white" />
                      </div>

                      {/* Nom du plan */}
                      <h3 className={`text-2xl font-bold ${theme.text} mb-1`}>
                        {plan.name}
                      </h3>
                      <p className="text-sm text-gray-500 mb-4">{plan.description || 'Plan d\'abonnement'}</p>

                      {/* Prix avec style premium */}
                      <div className="mb-6">
                        <div className="flex items-baseline gap-1">
                          <span className={`text-4xl font-extrabold ${theme.priceColor}`}>
                            {plan.price ? formatAmount(plan.price) : '0'}
                          </span>
                          <span className="text-lg text-gray-400 font-medium">FCFA</span>
                        </div>
                        <span className="text-sm text-gray-500">/{plan.billingPeriod === 'yearly' ? 'an' : 'mois'}</span>
                      </div>

                      {/* Nombre de groupes abonnés - Style badge */}
                      <div className={`flex items-center gap-3 mb-5 p-3 rounded-xl bg-white/80 backdrop-blur border ${theme.border}`}>
                        <div className={`p-2 rounded-lg bg-gradient-to-br ${theme.headerGradient}`}>
                          <Users className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <span className={`text-xl font-bold ${theme.text}`}>{subscriptionCount}</span>
                          <span className="text-sm text-gray-500 ml-1">groupe{subscriptionCount > 1 ? 's' : ''}</span>
                        </div>
                      </div>

                      {/* Limites principales */}
                      <div className="space-y-3 mb-4 flex-1">
                        <div className="flex items-center gap-3">
                          <div className={`w-6 h-6 rounded-full bg-white flex items-center justify-center shadow-sm`}>
                            <Check className={`w-4 h-4 ${theme.checkColor}`} />
                          </div>
                          <span className="text-sm text-gray-700 font-medium">
                            {plan.maxSchools === -1 ? 'Écoles illimitées' : `${plan.maxSchools} écoles max`}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className={`w-6 h-6 rounded-full bg-white flex items-center justify-center shadow-sm`}>
                            <Check className={`w-4 h-4 ${theme.checkColor}`} />
                          </div>
                          <span className="text-sm text-gray-700 font-medium">
                            {plan.maxStudents === -1 ? 'Élèves illimités' : `${plan.maxStudents?.toLocaleString()} élèves max`}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className={`w-6 h-6 rounded-full bg-white flex items-center justify-center shadow-sm`}>
                            <Check className={`w-4 h-4 ${theme.checkColor}`} />
                          </div>
                          <span className="text-sm text-gray-700 font-medium">
                            {plan.maxStorage || 1} GB stockage
                          </span>
                        </div>
                      </div>

                      {/* Bouton Détails */}
                      <button
                        onClick={() => setExpandedPlanId(isExpanded ? null : plan.id)}
                        className={`w-full flex items-center justify-center gap-2 text-sm ${theme.text} hover:opacity-80 transition-all py-2 font-medium`}
                      >
                        {isExpanded ? (
                          <>Moins de détails <ChevronUp className="w-4 h-4" /></>
                        ) : (
                          <>Plus de détails <ChevronDown className="w-4 h-4" /></>
                        )}
                      </button>

                      {/* Détails étendus */}
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="border-t border-gray-200/50 pt-4 mt-2 space-y-3"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-6 h-6 rounded-full bg-white flex items-center justify-center shadow-sm`}>
                              <Check className={`w-4 h-4 ${theme.checkColor}`} />
                            </div>
                            <span className="text-sm text-gray-700">
                              {plan.maxStaff === -1 ? 'Personnel illimité' : `${plan.maxStaff?.toLocaleString()} personnel max`}
                            </span>
                          </div>
                          {plan.apiAccess && (
                            <div className="flex items-center gap-3">
                              <div className={`w-6 h-6 rounded-full bg-white flex items-center justify-center shadow-sm`}>
                                <Check className={`w-4 h-4 ${theme.checkColor}`} />
                              </div>
                              <span className="text-sm text-gray-700">Accès API</span>
                            </div>
                          )}
                          {plan.customBranding && (
                            <div className="flex items-center gap-3">
                              <div className={`w-6 h-6 rounded-full bg-white flex items-center justify-center shadow-sm`}>
                                <Check className={`w-4 h-4 ${theme.checkColor}`} />
                              </div>
                              <span className="text-sm text-gray-700">Branding personnalisé</span>
                            </div>
                          )}
                        </motion.div>
                      )}

                      {/* Actions Admin */}
                      {isSuperAdmin && (
                        <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200/50">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(plan)}
                            className={`flex-1 gap-1 ${theme.text} border-current/20 hover:bg-white/50`}
                          >
                            <Edit3 className="w-3 h-3" />
                            Modifier
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(plan)}
                            className="gap-1 text-[#E63946] border-[#E63946]/20 hover:bg-[#E63946]/10"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        ) : (
          <Card className="p-12 text-center border-0 shadow-md">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {searchQuery ? 'Aucun résultat' : 'Aucun plan disponible'}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchQuery 
                ? `Aucun plan ne correspond à "${searchQuery}"`
                : 'Créez votre premier plan d\'abonnement'
              }
            </p>
            {!searchQuery && isSuperAdmin && (
              <Button 
                onClick={handleCreate}
                className="bg-[#2A9D8F] hover:bg-[#238b7e] text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Créer un plan
              </Button>
            )}
          </Card>
        )}
      </motion.div>

      {/* Dialog de création/édition */}
      <PlanFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        plan={selectedPlan}
        mode={dialogMode}
      />
    </div>
  );
};

export default PlansSimplified;
