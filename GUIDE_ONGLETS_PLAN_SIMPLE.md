# 📋 GUIDE SIMPLE : AJOUTER LES ONGLETS AU FORMULAIRE PLAN

**Fichier** : `src/features/dashboard/components/plans/PlanFormDialog.tsx`

---

## ✅ CE QUI A ÉTÉ FAIT

1. ✅ Imports ajoutés (Tabs, TabsContent, TabsList, TabsTrigger, icônes)
2. ✅ État `activeTab` ajouté
3. ✅ Dialog agrandi à `max-w-6xl`
4. ✅ Structure Tabs avec 4 onglets créée
5. ✅ Début de l'onglet "Général" ajouté

---

## 🔧 MODIFICATIONS MANUELLES NÉCESSAIRES

### **Ligne ~565 : Fermer l'onglet "Général"**

**Chercher** :
```typescript
              <p className="text-xs text-gray-500">Séparez chaque fonctionnalité par un retour à la ligne</p>
            </div>
          </div>
```

**Remplacer par** :
```typescript
              <p className="text-xs text-gray-500">Séparez chaque fonctionnalité par un retour à la ligne</p>
            </div>
          </div>
              </TabsContent>
```

---

### **Ligne ~567 : Créer l'onglet "Tarification"**

**Chercher** :
```typescript
          {/* Tarification */}
          <div className="space-y-4">
```

**Remplacer par** :
```typescript
              {/* Onglet 2: Tarification */}
              <TabsContent value="pricing" className="space-y-6 mt-0">
          {/* Tarification */}
          <div className="space-y-4">
```

---

### **Ligne ~425 : Fermer l'onglet "Tarification" et créer "Limites & Options"**

**Chercher** (après la section Tarification) :
```typescript
          </div>

          {/* Limites */}
          <div className="space-y-4">
```

**Remplacer par** :
```typescript
          </div>
              </TabsContent>

              {/* Onglet 3: Limites & Options */}
              <TabsContent value="limits" className="space-y-6 mt-0">
          {/* Limites */}
          <div className="space-y-4">
```

---

### **Ligne ~542 : Fermer "Limites & Options" et créer "Modules & Catégories"**

**Chercher** (après la section Support & Options) :
```typescript
          </div>

          {/* Modules & Catégories */}
          <div className="space-y-4">
```

**Remplacer par** :
```typescript
          </div>
              </TabsContent>

              {/* Onglet 4: Modules & Catégories */}
              <TabsContent value="modules" className="space-y-6 mt-0">
          {/* Modules & Catégories */}
          <div className="space-y-4">
```

---

### **Ligne ~593 : Fermer l'onglet "Modules & Catégories"**

**Chercher** (après le résumé des modules) :
```typescript
            </div>
          </div>

          {/* Actions */}
```

**Remplacer par** :
```typescript
            </div>
          </div>
              </TabsContent>
            </div> {/* Fin overflow-y-auto */}
          </Tabs>

          {/* Actions */}
```

---

## 🎯 RÉSULTAT ATTENDU

### **Structure finale** :
```
<Dialog>
  <DialogContent className="max-w-6xl">
    <DialogHeader>...</DialogHeader>
    
    <form>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="general">Général</TabsTrigger>
          <TabsTrigger value="pricing">Tarification</TabsTrigger>
          <TabsTrigger value="limits">Limites & Options</TabsTrigger>
          <TabsTrigger value="modules">Modules & Catégories</TabsTrigger>
        </TabsList>

        <div className="overflow-y-auto">
          <TabsContent value="general">
            {/* Informations de base + Fonctionnalités */}
          </TabsContent>

          <TabsContent value="pricing">
            {/* Prix, devise, période, réduction, essai */}
          </TabsContent>

          <TabsContent value="limits">
            {/* Limites + Support & Options */}
          </TabsContent>

          <TabsContent value="modules">
            {/* CategorySelector + ModuleSelector + Résumé */}
          </TabsContent>
        </div>
      </Tabs>

      {/* Actions (en dehors des onglets) */}
      <div className="actions">
        <Button>Annuler</Button>
        <Button type="submit">Créer</Button>
      </div>
    </form>
  </DialogContent>
</Dialog>
```

---

## 🚀 ALTERNATIVE RAPIDE

Si les modifications manuelles sont trop complexes, je peux :

1. **Créer un fichier complet** `PlanFormDialogWithTabs.tsx` avec tout restructuré
2. Vous le copiez-collez pour remplacer l'ancien
3. Vous testez

**Voulez-vous que je crée le fichier complet ?** 

Répondez "oui" et je génère le fichier complet prêt à l'emploi ! 🎯
