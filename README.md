# MovieStream

Plateforme de streaming de films personnelle construite avec React Router v7 et Netlify.

## Fonctionnalités

- 🎬 Streaming de films via liens 0x0.st
- 🎨 Interface moderne avec TailwindCSS
- 📱 Design responsive
- 🚫 Protection contre le clic droit
- 📺 Mode plein écran
- ⚡ Déploiement automatique avec Netlify

## Installation

```bash
npm install
```

## Développement

```bash
npm run dev
```

Accédez à `http://localhost:5173`

## Build

```bash
npm run build
```

## Déploiement

Le site est automatiquement déployé sur Netlify via GitHub.

## Technologies

- React Router v7 (SPA Mode)
- TypeScript
- TailwindCSS
- Netlify Functions
- 0x0.st pour l'hébergement vidéo

---

Créé avec ❤️ par Arsène
To build and run using Docker:

```bash
docker build -t my-app .

# Run the container
docker run -p 3000:3000 my-app
```

The containerized application can be deployed to any platform that supports Docker, including:

- AWS ECS
- Google Cloud Run
- Azure Container Apps
- Digital Ocean App Platform
- Fly.io
- Railway

### DIY Deployment

If you're familiar with deploying Node applications, the built-in app server is production-ready.

Make sure to deploy the output of `npm run build`

```
├── package.json
├── package-lock.json (or pnpm-lock.yaml, or bun.lockb)
├── build/
│   ├── client/    # Static assets
│   └── server/    # Server-side code
```

## Styling

This template comes with [Tailwind CSS](https://tailwindcss.com/) already configured for a simple default starting experience. You can use whatever CSS framework you prefer.

---

Built with ❤️ using React Router.
