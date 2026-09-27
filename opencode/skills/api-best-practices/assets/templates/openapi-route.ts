// src/routes/api/openapi.json/+server.ts — sert la spec OpenAPI générée.
//
// Le chemin se termine par `.json` : c'est ce que consomment les outils
// (Scalar, Swagger UI, Postman, les clients générés).

import { json } from '@sveltejs/kit'
import { buildOpenApiDocument } from '$lib/server/openapi'
import type { RequestHandler } from './$types'

// La spec ne dépend pas de la requête : on peut la pré-rendre au build.
// Retirer si un schéma dépend de l'environnement (URL du serveur, par ex.).
export const prerender = true

export const GET: RequestHandler = () => {
  return json(buildOpenApiDocument(), {
    headers: {
      // Laisser les navigateurs et proxys mettre en cache : la spec ne change
      // qu'au déploiement.
      'Cache-Control': 'public, max-age=300',
    },
  })
}

// --- Page de rendu -----------------------------------------------------------
//
// Ajouter une route `src/routes/api/docs/+page.svelte` qui consomme ce JSON :
//
//   <script>
//     import { ApiReference } from '@scalar/sveltekit'   // ou swagger-ui
//     import spec from '../openapi.json/+server'
//   </script>
//
// En production, protéger `/api/docs` par le même contrôle d'accès que le reste
// de l'administration — la spec décrit la surface d'attaque de l'application.
