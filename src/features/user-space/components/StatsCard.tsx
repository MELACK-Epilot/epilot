import { motion } from 'framer-motion';
import { TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface StatsCardProps {
  title: string;
  value: number | string;
  subtitle: string;
  icon: any;
  color: string;
  delay?: number;
}

export const StatsCard = ({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  color,
  delay = 0
}: StatsCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, type: 'spring', stiffness: 100 }}
    whileHover={{ scale: 1.02, y: -4 }}
    className="relative group"
  >
    <div className={`absolute inset-0 bg-gradient-to-br ${color}/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300`} />
    <Card className="relative p-6 bg-white/90 backdrop-blur-xl border-white/60 shadow-xl hover:shadow-2xl transition-all duration-300 rounded-2xl overflow-hidden">
      <div className={`absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br ${color}/10 rounded-full group-hover:scale-150 transition-transform duration-500`} />
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-xl bg-gradient-to-br ${color}`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
          <TrendingUp className="h-4 w-4 text-green-500" />
        </div>
        <h3 className="text-sm font-medium text-gray-600 mb-1">{title}</h3>
        <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
        <p className="text-xs text-gray-500">{subtitle}</p>
      </div>
    </Card>
  </motion.div>
);
