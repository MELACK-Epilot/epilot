/**
 * Utilitaires d'export pour les demandes de ressources
 * Impression et téléchargement PDF/Excel
 */

import type { ResourceRequest } from '../store/useResourceRequestsStore';

// Fonction d'impression d'une demande
export const printRequest = (request: ResourceRequest) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const totalAmount = request.items?.reduce((sum, item) => sum + (item.total_price || 0), 0) || request.total_estimated_amount || 0;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Demande de Ressources - ${request.title}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 40px;
            color: #333;
          }
          .header {
            text-align: center;
            margin-bottom: 40px;
            border-bottom: 3px solid #9333ea;
            padding-bottom: 20px;
          }
          .header h1 {
            color: #9333ea;
            margin: 0;
          }
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 30px;
          }
          .info-item {
            padding: 10px;
            background: #f9fafb;
            border-radius: 8px;
          }
          .info-label {
            font-weight: bold;
            color: #6b7280;
            font-size: 12px;
            text-transform: uppercase;
          }
          .info-value {
            margin-top: 5px;
            font-size: 16px;
          }
          .badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 14px;
            font-weight: 500;
          }
          .badge-pending { background: #fef3c7; color: #92400e; }
          .badge-approved { background: #d1fae5; color: #065f46; }
          .badge-rejected { background: #fee2e2; color: #991b1b; }
          .badge-completed { background: #dbeafe; color: #1e40af; }
          .badge-low { background: #f3f4f6; color: #374151; }
          .badge-normal { background: #dbeafe; color: #1e40af; }
          .badge-high { background: #fed7aa; color: #9a3412; }
          .badge-urgent { background: #fee2e2; color: #991b1b; }
          .section {
            margin: 30px 0;
          }
          .section-title {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 15px;
            color: #9333ea;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
          }
          th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #e5e7eb;
          }
          th {
            background: #f9fafb;
            font-weight: bold;
            color: #374151;
          }
          .total-row {
            font-weight: bold;
            background: #f3f4f6;
          }
          .footer {
            margin-top: 50px;
            padding-top: 20px;
            border-top: 2px solid #e5e7eb;
            text-align: center;
            color: #6b7280;
            font-size: 12px;
          }
          @media print {
            body { padding: 20px; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>DEMANDE DE RESSOURCES</h1>
          <p style="margin: 10px 0 0 0; color: #6b7280;">E-Pilot Congo - Gestion Scolaire</p>
        </div>

        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">Titre</div>
            <div class="info-value">${request.title}</div>
          </div>
          <div class="info-item">
            <div class="info-label">École</div>
            <div class="info-value">${request.school?.name || 'N/A'}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Demandeur</div>
            <div class="info-value">${request.requester?.first_name} ${request.requester?.last_name}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Date de création</div>
            <div class="info-value">${new Date(request.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Statut</div>
            <div class="info-value">
              <span class="badge badge-${request.status}">
                ${request.status === 'pending' ? '⏳ En attente' : 
                  request.status === 'approved' ? '✅ Approuvée' :
                  request.status === 'rejected' ? '❌ Rejetée' : '🎉 Complétée'}
              </span>
            </div>
          </div>
          <div class="info-item">
            <div class="info-label">Priorité</div>
            <div class="info-value">
              <span class="badge badge-${request.priority}">
                ${request.priority === 'low' ? '🟢 Basse' :
                  request.priority === 'normal' ? '🔵 Normale' :
                  request.priority === 'high' ? '🟠 Haute' : '🔴 Urgente'}
              </span>
            </div>
          </div>
        </div>

        ${request.description ? `
          <div class="section">
            <div class="section-title">Description</div>
            <p style="line-height: 1.6;">${request.description}</p>
          </div>
        ` : ''}

        <div class="section">
          <div class="section-title">Ressources demandées</div>
          <table>
            <thead>
              <tr>
                <th>Ressource</th>
                <th>Catégorie</th>
                <th>Quantité</th>
                <th>Prix unitaire</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${request.items?.map(item => `
                <tr>
                  <td>${item.resource_name}</td>
                  <td>${item.resource_category}</td>
                  <td>${item.quantity} ${item.unit}</td>
                  <td>${item.unit_price.toLocaleString()} FCFA</td>
                  <td>${item.total_price.toLocaleString()} FCFA</td>
                </tr>
              `).join('') || ''}
              <tr class="total-row">
                <td colspan="4" style="text-align: right;">MONTANT TOTAL</td>
                <td>${totalAmount.toLocaleString()} FCFA</td>
              </tr>
            </tbody>
          </table>
        </div>

        ${request.notes ? `
          <div class="section">
            <div class="section-title">Notes</div>
            <p style="line-height: 1.6; background: #fef3c7; padding: 15px; border-radius: 8px;">${request.notes}</p>
          </div>
        ` : ''}

        <div class="footer">
          <p>Document généré le ${new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
          <p>E-Pilot Congo - Plateforme de Gestion Scolaire</p>
        </div>

        <script>
          window.onload = function() {
            window.print();
            window.onafterprint = function() {
              window.close();
            };
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
};

// Fonction de téléchargement CSV
export const downloadRequestsCSV = (requests: ResourceRequest[]) => {
  const headers = ['Titre', 'École', 'Demandeur', 'Statut', 'Priorité', 'Montant', 'Date création'];
  
  const rows = requests.map(req => [
    req.title,
    req.school?.name || 'N/A',
    `${req.requester?.first_name} ${req.requester?.last_name}`,
    req.status === 'pending' ? 'En attente' :
      req.status === 'approved' ? 'Approuvée' :
      req.status === 'rejected' ? 'Rejetée' : 'Complétée',
    req.priority === 'low' ? 'Basse' :
      req.priority === 'normal' ? 'Normale' :
      req.priority === 'high' ? 'Haute' : 'Urgente',
    req.total_estimated_amount.toLocaleString(),
    new Date(req.created_at).toLocaleDateString('fr-FR'),
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `etats-besoins-${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Fonction de téléchargement d'une demande en PDF (simple version texte)
export const downloadRequestPDF = (request: ResourceRequest) => {
  // Pour une vraie génération PDF, utiliser une lib comme jsPDF
  // Pour l'instant, on utilise l'impression
  printRequest(request);
};
