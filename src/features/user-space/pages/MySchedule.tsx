/**
 * Page emploi du temps
 */

import { Card } from '@/components/ui/card';
import { Calendar, Clock } from 'lucide-react';

export const MySchedule = () => {
  const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'];
  const hours = ['08:00', '10:00', '12:00', '14:00', '16:00'];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Calendar className="h-6 w-6 text-[#2A9D8F]" />
        <h1 className="text-2xl font-bold text-gray-900">Mon Emploi du Temps</h1>
      </div>

      <Card className="p-6">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="border border-gray-200 p-3 bg-gray-50">
                  <Clock className="h-4 w-4 mx-auto" />
                </th>
                {days.map((day) => (
                  <th key={day} className="border border-gray-200 p-3 bg-gray-50 font-semibold">
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {hours.map((hour) => (
                <tr key={hour}>
                  <td className="border border-gray-200 p-3 bg-gray-50 font-medium text-sm">
                    {hour}
                  </td>
                  {days.map((day) => (
                    <td key={`${day}-${hour}`} className="border border-gray-200 p-3">
                      <div className="min-h-[80px] flex items-center justify-center text-gray-400 text-sm">
                        -
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="text-center text-gray-500 text-sm">
        📅 Emploi du temps à venir - En cours de développement
      </div>
    </div>
  );
};
