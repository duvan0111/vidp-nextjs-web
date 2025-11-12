#!/bin/bash

# Script de vérification de l'environnement VidP Frontend

echo "🔍 Vérification de l'environnement VidP Frontend..."
echo "================================================"

# Vérifier Node.js
echo "📦 Vérification de Node.js..."
if command -v node &> /dev/null; then
    echo "✅ Node.js version: $(node --version)"
else
    echo "❌ Node.js n'est pas installé!"
    exit 1
fi

# Vérifier npm
echo "📦 Vérification de npm..."
if command -v npm &> /dev/null; then
    echo "✅ npm version: $(npm --version)"
else
    echo "❌ npm n'est pas installé!"
    exit 1
fi

# Vérifier les dépendances
echo "📦 Vérification des dépendances..."
if [ -f "package.json" ] && [ -d "node_modules" ]; then
    echo "✅ Dépendances installées"
else
    echo "⚠️  Dépendances manquantes. Exécutez: npm install"
fi

# Vérifier la connectivité vers le backend
echo "🌐 Vérification de la connectivité backend..."
BACKEND_URL="http://localhost:8000"
if curl -s --connect-timeout 5 "$BACKEND_URL" > /dev/null; then
    echo "✅ Backend FastAPI accessible sur $BACKEND_URL"
else
    echo "⚠️  Backend FastAPI non accessible sur $BACKEND_URL"
    echo "   Assurez-vous que le service FastAPI est démarré"
fi

# Vérifier le serveur de développement
echo "🚀 Vérification du serveur Next.js..."
FRONTEND_URL="http://localhost:3000"
if curl -s --connect-timeout 5 "$FRONTEND_URL" > /dev/null; then
    echo "✅ Frontend Next.js accessible sur $FRONTEND_URL"
else
    echo "⚠️  Frontend Next.js non accessible sur $FRONTEND_URL"
    echo "   Démarrez le serveur avec: npm run dev"
fi

echo ""
echo "🎯 État du système:"
echo "   - Frontend: Next.js + TypeScript + Tailwind CSS"
echo "   - Backend attendu: FastAPI sur port 8000"
echo "   - Interface: http://localhost:3000"
echo ""
echo "🚀 Pour démarrer le développement:"
echo "   npm run dev"
echo ""
echo "📖 Documentation complète dans README.md"
