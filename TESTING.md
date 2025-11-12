# Test de l'Interface VidP - Mode Démonstration

## 🎬 Comment tester l'interface sans backend

L'interface VidP peut être testée de plusieurs façons :

### 1. Test avec Backend FastAPI (Recommandé)
Si vous avez le service FastAPI en cours d'exécution sur `http://localhost:8000` :
- ✅ Upload réel de fichiers vidéo
- ✅ Traitement complet
- ✅ Réponse avec video_id

### 2. Test avec Mock/Simulation
Pour tester l'interface sans backend, vous pouvez modifier temporairement le code :

#### Option A : Simulation de succès
Dans `src/app/page.tsx`, remplacez la fonction `handleUpload` par :

```typescript
const handleUpload = async () => {
  if (!selectedFile) return

  setUploadState('UPLOADING')
  setUploadProgress(0)
  setErrorMessage('')

  // Simulation de progression
  for (let i = 0; i <= 100; i += 10) {
    setUploadProgress(i)
    await new Promise(resolve => setTimeout(resolve, 200))
  }

  // Simulation de réponse réussie
  setApiResponse({
    video_id: 'demo_' + Date.now(),
    message: 'Vidéo uploadée avec succès (mode démonstration)'
  })
  setUploadState('SUCCESS')
}
```

#### Option B : Simulation avec serveur local
Créez un serveur mock simple avec Node.js :

```javascript
// mock-server.js
const express = require('express')
const cors = require('cors')
const multer = require('multer')

const app = express()
const upload = multer()

app.use(cors())

app.post('/api/v1/videos/upload', upload.single('video'), (req, res) => {
  setTimeout(() => {
    res.json({
      video_id: 'mock_' + Date.now(),
      message: 'Upload simulé réussi'
    })
  }, 2000) // Simule 2 secondes de traitement
})

app.listen(8000, () => {
  console.log('Mock server running on http://localhost:8000')
})
```

Puis lancez : `node mock-server.js`

### 3. Tests d'Interface

#### Tests de Validation
- 📁 Glissez un fichier non-vidéo → Devrait afficher une erreur
- 📏 Essayez un fichier > 500MB → Devrait afficher une erreur de taille
- ✅ Glissez un fichier MP4/AVI/MOV valide → Devrait passer

#### Tests d'Interaction
- 🖱️ Cliquez sur la zone de drop → Devrait ouvrir le sélecteur de fichier
- 🎯 Glissez-déposez un fichier → Devrait changer l'état à SELECTED
- 🔘 Cliquez "Démarrer le Traitement" → Devrait commencer l'upload

#### Tests Visuels
- 🌙 Interface en dark mode
- 📱 Design responsive (testez sur différentes tailles)
- ⚡ Animations fluides lors des changements d'état
- 🎨 Barre de progression animée

### 4. Tests de Compatibilité

#### Formats Supportés à Tester
- ✅ .mp4 (video/mp4)
- ✅ .avi (video/x-msvideo)
- ✅ .mov (video/quicktime)

#### Formats Non-Supportés (devraient être rejetés)
- ❌ .txt, .jpg, .png, .pdf
- ❌ .mkv, .flv, .wmv (formats non supportés)

### 5. Vérification des États

L'interface doit correctement afficher :

| État | Icône | Couleur | Actions |
|------|-------|---------|---------|
| IDLE | 📹 | Gris | Click/Drop |
| SELECTED | 🎬 | Bleu | Upload |
| UPLOADING | ⏳ | Bleu animé | Aucune |
| SUCCESS | ✅ | Vert | Reset |
| ERROR | ❌ | Rouge | Reset |

### 6. Messages d'Erreur à Tester

- Format invalide
- Fichier trop volumineux
- Erreur réseau (si backend offline)
- Erreur de parsing JSON

### 7. Débogage

Ouvrez les DevTools du navigateur (F12) pour :
- Console : Messages d'erreur JavaScript
- Network : Requêtes HTTP vers l'API
- Elements : Inspection du DOM et styles

### 8. Performance

Testez avec :
- Petits fichiers (< 10MB) : Upload rapide
- Fichiers moyens (50-100MB) : Barre de progression
- Fichiers limite (500MB) : Test de limite

## 🚀 Commandes Utiles

```bash
# Démarrer le frontend
npm run dev

# Construire pour production
npm run build

# Vérifier les erreurs
npm run lint

# Vérifier l'environnement
./check-env.sh
```

## 🔧 Configuration Rapide

Pour changer l'URL de l'API (si votre backend est sur un autre port) :
Modifiez `API_URL` dans `src/app/page.tsx`

```typescript
const API_URL = 'http://localhost:8080/api/v1/videos/upload' // Exemple
```
