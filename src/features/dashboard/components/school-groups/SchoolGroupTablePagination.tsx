/**
 * Composant Pagination pour le tableau des Groupes Scolaires
 * @module SchoolGroupTablePagination
 */

import { Button } from '@/components/ui/button';

interface SchoolGroupTablePaginationProps {
  page: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
  selectedRows: string[];
  onPageChange: (page: number) => void;
}

export const SchoolGroupTablePagination = ({
  page,
  pageSize,
  totalPages,
  totalItems,
  selectedRows,
  onPageChange,
}: SchoolGroupTablePaginationProps) => {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between px-2">
      {/* Compteur */}
      <div className="text-sm text-muted-foreground">
        Affichage de {((page - 1) * pageSize) + 1} à {Math.min(page * pageSize, totalItems)} sur {totalItems} groupe(s)
        {selectedRows.length > 0 && ` • ${selectedRows.length} sélectionné(s)`}
      </div>
      
      {/* Boutons navigation */}
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
        >
          Précédent
        </Button>
        
        <div className="flex items-center gap-1">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
            // Afficher seulement quelques pages autour de la page actuelle
            if (
              pageNum === 1 ||
              pageNum === totalPages ||
              (pageNum >= page - 1 && pageNum <= page + 1)
            ) {
              return (
                <Button
                  key={pageNum}
                  variant={page === pageNum ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onPageChange(pageNum)}
                  className="w-10"
                >
                  {pageNum}
                </Button>
              );
            } else if (pageNum === page - 2 || pageNum === page + 2) {
              return <span key={pageNum} className="px-2">...</span>;
            }
            return null;
          })}
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
        >
          Suivant
        </Button>
      </div>
    </div>
  );
};
