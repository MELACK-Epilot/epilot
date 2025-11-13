/**
 * Workflow d'approbation des dépenses
 * @module ApprovalWorkflow
 */

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle2, XCircle, Clock, User, MessageSquare } from 'lucide-react';
import { useState } from 'react';
import { motion } from 'framer-motion';

interface ApprovalStep {
  role: string;
  user?: string;
  status: 'completed' | 'pending' | 'waiting' | 'rejected';
  date?: string;
  comment?: string;
}

interface ApprovalWorkflowProps {
  expense: any;
  steps: ApprovalStep[];
  currentUserRole?: string;
  onApprove?: (comment: string) => void;
  onReject?: (comment: string) => void;
  isLoading?: boolean;
}

export const ApprovalWorkflow = ({
  expense,
  steps,
  currentUserRole,
  onApprove,
  onReject,
  isLoading = false,
}: ApprovalWorkflowProps) => {
  const [comment, setComment] = useState('');
  const [showCommentBox, setShowCommentBox] = useState(false);
  const [action, setAction] = useState<'approve' | 'reject' | null>(null);

  const getStepIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-600 animate-pulse" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStepColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 border-green-300';
      case 'pending':
        return 'bg-yellow-100 border-yellow-300';
      case 'rejected':
        return 'bg-red-100 border-red-300';
      default:
        return 'bg-gray-100 border-gray-300';
    }
  };

  const canApprove = steps.some(
    (step) => step.status === 'pending' && step.role === currentUserRole
  );

  const handleAction = (actionType: 'approve' | 'reject') => {
    setAction(actionType);
    setShowCommentBox(true);
  };

  const handleSubmit = () => {
    if (action === 'approve' && onApprove) {
      onApprove(comment);
    } else if (action === 'reject' && onReject) {
      onReject(comment);
    }
    setComment('');
    setShowCommentBox(false);
    setAction(null);
  };

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Workflow d'Approbation</h3>
        <p className="text-sm text-gray-600">
          Dépense de {expense?.amount?.toLocaleString()} FCFA - {expense?.category}
        </p>
      </div>

      {/* Timeline */}
      <div className="space-y-4 mb-6">
        {steps.map((step, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="relative"
          >
            {/* Ligne de connexion */}
            {index < steps.length - 1 && (
              <div className="absolute left-6 top-12 w-0.5 h-full bg-gray-200" />
            )}

            <div className={`flex items-start gap-4 p-4 rounded-lg border-2 ${getStepColor(step.status)}`}>
              {/* Icône */}
              <div className="relative z-10 bg-white rounded-full p-2">
                {getStepIcon(step.status)}
              </div>

              {/* Contenu */}
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-semibold text-gray-900">{step.role}</p>
                    {step.user && (
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <User className="w-3 h-3" />
                        {step.user}
                      </div>
                    )}
                  </div>
                  <Badge
                    className={
                      step.status === 'completed'
                        ? 'bg-green-100 text-green-700'
                        : step.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-700'
                        : step.status === 'rejected'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-gray-100 text-gray-700'
                    }
                  >
                    {step.status === 'completed'
                      ? 'Approuvé'
                      : step.status === 'pending'
                      ? 'En cours'
                      : step.status === 'rejected'
                      ? 'Rejeté'
                      : 'En attente'}
                  </Badge>
                </div>

                {step.date && (
                  <p className="text-xs text-gray-500 mb-2">{step.date}</p>
                )}

                {step.comment && (
                  <div className="mt-2 p-2 bg-white rounded border">
                    <div className="flex items-start gap-2">
                      <MessageSquare className="w-4 h-4 text-gray-400 mt-0.5" />
                      <p className="text-sm text-gray-700">{step.comment}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Actions */}
      {canApprove && !showCommentBox && (
        <div className="flex gap-3 pt-4 border-t">
          <Button
            onClick={() => handleAction('reject')}
            variant="outline"
            className="flex-1 border-red-300 text-red-700 hover:bg-red-50"
            disabled={isLoading}
          >
            <XCircle className="w-4 h-4 mr-2" />
            Refuser
          </Button>
          <Button
            onClick={() => handleAction('approve')}
            className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white"
            disabled={isLoading}
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Approuver
          </Button>
        </div>
      )}

      {/* Boîte de commentaire */}
      {showCommentBox && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3 pt-4 border-t"
        >
          <Textarea
            placeholder={
              action === 'approve'
                ? 'Ajouter un commentaire (optionnel)...'
                : 'Expliquer la raison du refus...'
            }
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
          />
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowCommentBox(false);
                setComment('');
                setAction(null);
              }}
              disabled={isLoading}
            >
              Annuler
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isLoading || (action === 'reject' && !comment)}
              className={
                action === 'approve'
                  ? 'bg-gradient-to-r from-green-600 to-green-700'
                  : 'bg-gradient-to-r from-red-600 to-red-700'
              }
            >
              Confirmer {action === 'approve' ? "l'approbation" : 'le refus'}
            </Button>
          </div>
        </motion.div>
      )}
    </Card>
  );
};
