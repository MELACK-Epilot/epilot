/**
 * Grille de widgets avec drag & drop
 * @module DashboardGrid
 */

import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, rectSortingStrategy } from '@dnd-kit/sortable';
import { useDashboardLayout } from '../hooks/useDashboardLayout';
import { WidgetRenderer } from './WidgetRenderer';

export const DashboardGrid = () => {
  const { layout, updateLayout } = useDashboardLayout();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px de mouvement avant d'activer le drag
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = layout.findIndex((item) => item.id === active.id);
      const newIndex = layout.findIndex((item) => item.id === over.id);

      const newLayout = arrayMove(layout, oldIndex, newIndex).map((item, index) => ({
        ...item,
        order: index,
      }));

      updateLayout(newLayout);
    }
  };

  // Filtrer les widgets activés et les trier par ordre
  const enabledWidgets = layout
    .filter((item) => item.enabled)
    .sort((a, b) => a.order - b.order);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={enabledWidgets.map((w) => w.id)}
        strategy={rectSortingStrategy}
      >
        <div className="grid grid-cols-12 gap-3 auto-rows-max">
          {enabledWidgets.map((widget) => (
            <WidgetRenderer key={widget.id} widget={widget} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
};
