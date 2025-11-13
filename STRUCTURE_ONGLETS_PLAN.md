# 📋 STRUCTURE DES ONGLETS - FORMULAIRE PLAN

## 🎯 ORGANISATION

### **Onglet 1 : Général** (Info icon)
- Informations de base
  - Nom du plan
  - Type de plan (slug)
  - Description
- Fonctionnalités incluses
  - Liste des fonctionnalités (textarea)

### **Onglet 2 : Tarification** (DollarSign icon)
- Prix & Devise
  - Prix
  - Devise (FCFA, EUR, USD)
  - Période (monthly, yearly)
- Promotions
  - Réduction (%)
  - Essai gratuit (jours)

### **Onglet 3 : Limites & Options** (Settings icon)
- Limites & Quotas
  - Nombre d'écoles max
  - Nombre d'élèves max
  - Personnel max
  - Stockage (GB)
- Support & Options
  - Niveau de support
  - Branding personnalisé (switch)
  - Accès API (switch)
  - Plan populaire (switch)

### **Onglet 4 : Modules & Catégories** (Layers icon)
- Sélection des catégories
  - CategorySelector
- Sélection des modules
  - ModuleSelector
- Résumé
  - X catégories, Y modules

---

## 📝 MODIFICATIONS À APPLIQUER

### **1. Fermer l'onglet "Général"** après les fonctionnalités :
```typescript
</div> {/* Fin Fonctionnalités */}
</TabsContent> {/* Fin onglet Général */}
```

### **2. Créer l'onglet "Tarification"** :
```typescript
<TabsContent value="pricing" className="space-y-6 mt-0">
  {/* Tout le contenu Tarification */}
</TabsContent>
```

### **3. Créer l'onglet "Limites & Options"** :
```typescript
<TabsContent value="limits" className="space-y-6 mt-0">
  {/* Limites & Quotas */}
  {/* Support & Options */}
</TabsContent>
```

### **4. Créer l'onglet "Modules & Catégories"** :
```typescript
<TabsContent value="modules" className="space-y-6 mt-0">
  {/* CategorySelector */}
  {/* ModuleSelector */}
  {/* Résumé */}
</TabsContent>
```

### **5. Fermer les balises** :
```typescript
            </div> {/* Fin overflow-y-auto */}
          </Tabs>

          {/* Actions (en dehors des onglets) */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t mt-4">
            <Button type="button" variant="outline">Annuler</Button>
            <Button type="submit">Créer le plan</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
```

---

## 🎨 AVANTAGES

1. **Organisation claire** : Chaque section dans son onglet
2. **Navigation facile** : 4 onglets avec icônes
3. **Espace optimisé** : Dialog agrandi (max-w-6xl)
4. **Scroll indépendant** : Chaque onglet scrollable
5. **Actions visibles** : Boutons toujours en bas

---

**Prêt pour l'implémentation !**
