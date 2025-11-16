/**
 * Utilitaires d'impression avec logos pour les demandes de ressources
 */

import type { ResourceRequest } from '../store/useResourceRequestsStore';

export const printRequestWithLogos = async (request: ResourceRequest) => {
  if (!request) return;

  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const totalAmount = request.items?.reduce((sum, item) => sum + (item.total_price || 0), 0) || request.total_estimated_amount || 0;

  // Récupérer les informations du groupe et de l'école depuis la demande
  const schoolGroupName = 'Groupe Scolaire'; // À récupérer depuis la BDD si nécessaire
  const schoolName = request.school?.name || 'École';
  const requesterName = `${request.requester?.first_name || ''} ${request.requester?.last_name || ''}`.trim();
  const requesterRole = request.requester?.role || '';

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Demande de Ressources - ${request.title}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            padding: 30px;
            color: #1a1a1a;
            background: white;
          }

          /* En-tête avec logos */
          .print-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 4px solid #9333ea;
          }

          .header-left {
            flex: 1;
          }

          .header-center {
            flex: 2;
            text-align: center;
            padding: 0 20px;
          }

          .header-right {
            flex: 1;
            text-align: right;
          }

          .logo-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 8px;
          }

          .logo-placeholder {
            width: 80px;
            height: 80px;
            border-radius: 12px;
            background: linear-gradient(135deg, #9333ea 0%, #7c3aed 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 24px;
            box-shadow: 0 4px 6px rgba(147, 51, 234, 0.2);
          }

          .logo-text {
            font-size: 11px;
            font-weight: 600;
            color: #4b5563;
            text-align: center;
            max-width: 100px;
          }

          .main-title {
            font-size: 28px;
            font-weight: bold;
            color: #9333ea;
            margin-bottom: 8px;
          }

          .subtitle {
            font-size: 14px;
            color: #6b7280;
            font-weight: 500;
          }

          .epilot-badge {
            display: inline-block;
            background: linear-gradient(135deg, #9333ea 0%, #7c3aed 100%);
            color: white;
            padding: 6px 16px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            margin-top: 8px;
            box-shadow: 0 2px 4px rgba(147, 51, 234, 0.3);
          }

          /* Informations principales */
          .request-info {
            background: #f9fafb;
            border-radius: 12px;
            padding: 24px;
            margin-bottom: 24px;
          }

          .request-title {
            font-size: 24px;
            font-weight: bold;
            color: #111827;
            margin-bottom: 16px;
          }

          .info-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 16px;
            margin-top: 16px;
          }

          .info-item {
            display: flex;
            flex-direction: column;
            gap: 4px;
          }

          .info-label {
            font-size: 11px;
            font-weight: 600;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }

          .info-value {
            font-size: 15px;
            color: #111827;
            font-weight: 500;
          }

          .badge {
            display: inline-block;
            padding: 6px 14px;
            border-radius: 16px;
            font-size: 13px;
            font-weight: 600;
          }

          .badge-pending { background: #fef3c7; color: #92400e; }
          .badge-approved { background: #d1fae5; color: #065f46; }
          .badge-rejected { background: #fee2e2; color: #991b1b; }
          .badge-completed { background: #dbeafe; color: #1e40af; }
          .badge-low { background: #f3f4f6; color: #374151; }
          .badge-normal { background: #dbeafe; color: #1e40af; }
          .badge-high { background: #fed7aa; color: #9a3412; }
          .badge-urgent { background: #fee2e2; color: #991b1b; }

          /* Description */
          .description-section {
            margin: 24px 0;
          }

          .section-title {
            font-size: 18px;
            font-weight: bold;
            color: #9333ea;
            margin-bottom: 12px;
            padding-bottom: 8px;
            border-bottom: 2px solid #e5e7eb;
          }

          .description-text {
            font-size: 14px;
            line-height: 1.8;
            color: #374151;
            background: white;
            padding: 16px;
            border-radius: 8px;
            border-left: 4px solid #9333ea;
          }

          /* Tableau des ressources */
          .resources-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          }

          .resources-table thead {
            background: linear-gradient(135deg, #9333ea 0%, #7c3aed 100%);
            color: white;
          }

          .resources-table th {
            padding: 14px 12px;
            text-align: left;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }

          .resources-table td {
            padding: 14px 12px;
            border-bottom: 1px solid #e5e7eb;
            font-size: 14px;
            color: #374151;
          }

          .resources-table tbody tr:hover {
            background: #f9fafb;
          }

          .resources-table tbody tr:last-child td {
            border-bottom: none;
          }

          .total-row {
            background: #f3f4f6 !important;
            font-weight: bold;
            font-size: 16px;
          }

          .total-row td {
            padding: 16px 12px !important;
            border-top: 2px solid #9333ea;
          }

          .amount-highlight {
            color: #9333ea;
            font-weight: bold;
          }

          /* Signatures */
          .signatures {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 40px;
            margin-top: 60px;
            page-break-inside: avoid;
          }

          .signature-box {
            text-align: center;
          }

          .signature-line {
            border-top: 2px solid #374151;
            margin-top: 60px;
            padding-top: 8px;
            font-size: 13px;
            color: #6b7280;
          }

          .signature-title {
            font-weight: 600;
            color: #111827;
            margin-bottom: 4px;
          }

          /* Footer */
          .print-footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #e5e7eb;
            text-align: center;
            color: #6b7280;
            font-size: 11px;
          }

          .footer-epilot {
            margin-top: 12px;
            font-weight: 600;
            color: #9333ea;
          }

          /* Print styles */
          @media print {
            body {
              padding: 15px;
            }
            .no-print {
              display: none;
            }
            @page {
              margin: 1.5cm;
            }
          }
        </style>
      </head>
      <body>
        <!-- En-tête avec logos -->
        <div class="print-header">
          <!-- Logo Groupe Scolaire -->
          <div class="header-left">
            <div class="logo-container">
              <div class="logo-placeholder">GS</div>
              <div class="logo-text">${schoolGroupName}</div>
            </div>
          </div>

          <!-- Titre central -->
          <div class="header-center">
            <div class="main-title">DEMANDE DE RESSOURCES</div>
            <div class="subtitle">État des Besoins</div>
            <div class="epilot-badge">⚡ E-Pilot Congo</div>
          </div>

          <!-- Logo École -->
          <div class="header-right">
            <div class="logo-container">
              <div class="logo-placeholder">📚</div>
              <div class="logo-text">${schoolName}</div>
            </div>
          </div>
        </div>

        <!-- Informations de la demande -->
        <div class="request-info">
          <div class="request-title">${request.title}</div>
          
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">Demandeur</div>
              <div class="info-value">${requesterName}</div>
            </div>
            
            <div class="info-item">
              <div class="info-label">Fonction</div>
              <div class="info-value">${requesterRole === 'proviseur' ? 'Proviseur' : 
                requesterRole === 'directeur' ? 'Directeur' : 
                requesterRole === 'directeur_etudes' ? 'Directeur des Études' : 
                requesterRole === 'admin_groupe' ? 'Admin de Groupe' : requesterRole}</div>
            </div>
            
            <div class="info-item">
              <div class="info-label">École</div>
              <div class="info-value">${schoolName}</div>
            </div>
            
            <div class="info-item">
              <div class="info-label">Date de création</div>
              <div class="info-value">${new Date(request.created_at).toLocaleDateString('fr-FR', { 
                day: 'numeric', 
                month: 'long', 
                year: 'numeric' 
              })}</div>
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
        </div>

        ${request.description ? `
          <div class="description-section">
            <div class="section-title">Description</div>
            <div class="description-text">${request.description}</div>
          </div>
        ` : ''}

        <!-- Tableau des ressources -->
        <div class="section-title">Ressources demandées</div>
        <table class="resources-table">
          <thead>
            <tr>
              <th>Ressource</th>
              <th>Catégorie</th>
              <th style="text-align: center;">Quantité</th>
              <th style="text-align: right;">Prix unitaire</th>
              <th style="text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${request.items?.map(item => `
              <tr>
                <td><strong>${item.resource_name}</strong></td>
                <td>${item.resource_category}</td>
                <td style="text-align: center;">${item.quantity} ${item.unit}</td>
                <td style="text-align: right;">${item.unit_price.toLocaleString()} FCFA</td>
                <td style="text-align: right;"><strong>${item.total_price.toLocaleString()} FCFA</strong></td>
              </tr>
              ${item.justification ? `
                <tr>
                  <td colspan="5" style="padding-left: 24px; font-size: 12px; color: #6b7280; font-style: italic;">
                    Justification: ${item.justification}
                  </td>
                </tr>
              ` : ''}
            `).join('') || '<tr><td colspan="5" style="text-align: center; padding: 20px;">Aucune ressource</td></tr>'}
            <tr class="total-row">
              <td colspan="4" style="text-align: right;"><strong>MONTANT TOTAL</strong></td>
              <td style="text-align: right;"><span class="amount-highlight">${totalAmount.toLocaleString()} FCFA</span></td>
            </tr>
          </tbody>
        </table>

        <!-- Signatures -->
        <div class="signatures">
          <div class="signature-box">
            <div class="signature-line">
              <div class="signature-title">Le Demandeur</div>
              <div>${requesterName}</div>
              <div>${requesterRole === 'proviseur' ? 'Proviseur' : 
                requesterRole === 'directeur' ? 'Directeur' : 
                requesterRole === 'directeur_etudes' ? 'Directeur des Études' : requesterRole}</div>
            </div>
          </div>
          
          <div class="signature-box">
            <div class="signature-line">
              <div class="signature-title">L'Administrateur</div>
              <div>Admin de Groupe</div>
              <div>${schoolGroupName}</div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="print-footer">
          <div>Document généré le ${new Date().toLocaleDateString('fr-FR', { 
            day: 'numeric', 
            month: 'long', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}</div>
          <div class="footer-epilot">⚡ E-Pilot Congo - Plateforme de Gestion Scolaire Intelligente</div>
        </div>

        <script>
          // Ajouter bouton d'impression en haut de la page
          window.onload = function() {
            // Créer barre d'outils
            const toolbar = document.createElement('div');
            toolbar.className = 'no-print';
            toolbar.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; background: linear-gradient(135deg, #9333ea 0%, #7c3aed 100%); padding: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); z-index: 1000; display: flex; justify-content: center; gap: 12px;';
            
            // Bouton Imprimer
            const printBtn = document.createElement('button');
            printBtn.innerHTML = '🖨️ Imprimer';
            printBtn.style.cssText = 'background: white; color: #9333ea; border: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 14px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); transition: all 0.2s;';
            printBtn.onmouseover = function() { this.style.transform = 'scale(1.05)'; };
            printBtn.onmouseout = function() { this.style.transform = 'scale(1)'; };
            printBtn.onclick = function() {
              window.print();
            };
            
            // Bouton Fermer
            const closeBtn = document.createElement('button');
            closeBtn.innerHTML = '✕ Fermer';
            closeBtn.style.cssText = 'background: rgba(255,255,255,0.2); color: white; border: 1px solid white; padding: 12px 24px; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 14px; transition: all 0.2s;';
            closeBtn.onmouseover = function() { this.style.background = 'rgba(255,255,255,0.3)'; };
            closeBtn.onmouseout = function() { this.style.background = 'rgba(255,255,255,0.2)'; };
            closeBtn.onclick = function() {
              window.close();
            };
            
            toolbar.appendChild(printBtn);
            toolbar.appendChild(closeBtn);
            document.body.insertBefore(toolbar, document.body.firstChild);
            
            // Ajouter marge en haut pour la barre d'outils
            document.body.style.paddingTop = '80px';
            
            // Fermer après impression
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
