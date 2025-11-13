/**
 * Renderer de widget avec lazy loading et drag & drop
 * @module WidgetRenderer
 */

import { lazy, Suspense } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import type { WidgetLayoutItem } from '../types/widget.types';

// Lazy loading des widgets
const SystemAlertsWidget = lazy(() => import('./widgets/SystemAlertsWidget'));
const FinancialOverviewWidget = lazy(() => import('./widgets/FinancialOverviewWidget'));
const ModuleStatusWidget = lazy(() => import('./widgets/ModuleStatusWidget'));
const RealtimeActivityWidget = lazy(() => import('./widgets/RealtimeActivityWidget'));

interface WidgetRendererProps {
  widget: WidgetLayoutItem;
}

export const WidgetRenderer = ({ widget }: WidgetRendererProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: widget.id });

  const [intersectionRef, isVisible] = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: '100px',
    freezeOnceVisible: true,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Sélectionner le bon widget
  const getWidget = () => {
    switch (widget.id) {
      case 'system-alerts':
        return <SystemAlertsWidget />;
      case 'financial-overview':
        return <FinancialOverviewWidget />;
      case 'module-status':
        return <ModuleStatusWidget />;
      case 'realtime-activity':
        return <RealtimeActivityWidget />;
      default:
        return null;
    }
  };

  return (
    <div
      ref={(node) => {
        setNodeRef(node);
        if (node) {
          (intersectionRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
        }
      }}
      style={style}
      className={`col-span-12 lg:col-span-${widget.cols} row-span-${widget.rows} relative group`}
      {...attributes}
    >
      {/* Poignée de drag */}
      <div
        {...listeners}
        className="absolute -top-1 left-1/2 -translate-x-1/2 z-10 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
      >
        <div className="bg-white rounded border border-gray-300 px-2 py-0.5">
          <GripVertical className="h-3 w-3 text-gray-400" />
        </div>
      </div>

      {/* Contenu du widget avec lazy loading */}
      {isVisible ? (
        <Suspense fallback={<WidgetSkeleton />}>
          {getWidget()}
        </Suspense>
      ) : (
        <WidgetSkeleton />
      )}
    </div>
  );
};

// Skeleton loader pour les widgets
const WidgetSkeleton = () => (
  <div className="bg-white rounded border border-gray-200 p-4 animate-pulse">
    <div className="h-4 bg-gray-200 rounded w-24 mb-3" />
    <div className="space-y-2">
      <div className="h-3 bg-gray-200 rounded w-full" />
      <div className="h-3 bg-gray-200 rounded w-5/6" />
      <div className="h-3 bg-gray-200 rounded w-4/6" />
    </div>
  </div>
);
