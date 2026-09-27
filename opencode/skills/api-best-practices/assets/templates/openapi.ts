// src/lib/server/openapi.ts — Spécification OpenAPI générée depuis les schémas Zod.
//
// PRINCIPE : le schéma Zod sert DÉJÀ à valider l'entrée et la sortie d'un endpoint.
// On l'enregistre ici une fois, et la spec en découle. Elle ne peut donc pas dériver
// du code — contrairement à un YAML écrit à la main, qui ment au bout de deux semaines.
//
// Dépendances :
//   npm i zod
//   npm i -D @asteasolutions/zod-to-openapi
// Pour la page de rendu : Scalar (@scalar/api-reference) ou Swagger UI.

import { OpenApiGeneratorV31, OpenAPIRegistry } from '@asteasolutions/zod-to-openapi'
import { z } from 'zod'

export const registry = new OpenAPIRegistry()

// --- Schémas partagés -------------------------------------------------------

// Auth par cookie de session (cf. checklist sécurité : HttpOnly + SameSite).
registry.registerComponent('securitySchemes', 'sessionCookie', {
  type: 'apiKey',
  in: 'cookie',
  name: 'session',
})

// Réponse d'erreur standard de l'écosystème.
export const ErrorResponse = registry.register(
  'ErrorResponse',
  z.object({
    id: z.string().openapi({ example: 'validation_error' }),
    message: z.string().openapi({ example: 'Le montant est requis.' }),
    extras: z.string().optional(),
  }),
)

// --- Enregistrement d'un endpoint -------------------------------------------
//
// À faire depuis un module central qui importe les schémas de chaque route,
// ou directement dans le fichier de route (effet de bord à l'import).
//
// registry.registerPath({
//   method: 'post',
//   path: '/api/v1/payments',
//   summary: 'Créer un paiement',
//   tags: ['Paiements'],
//   security: [{ sessionCookie: [] }],
//   request: {
//     body: { content: { 'application/json': { schema: CreatePaymentSchema } } },
//   },
//   responses: {
//     201: { description: 'Créé', content: { 'application/json': { schema: PaymentSchema } } },
//     422: { description: 'Validation échouée', content: { 'application/json': { schema: ErrorResponse } } },
//   },
// })

// --- Génération -------------------------------------------------------------

export function buildOpenApiDocument() {
  return new OpenApiGeneratorV31(registry.definitions).generateDocument({
    openapi: '3.1.0',
    info: {
      title: '[Nom du projet] — API',
      version: '1.0.0', // ou importer la version du package.json
      description: 'Généré depuis les schémas Zod. Ne pas éditer à la main.',
    },
    servers: [{ url: 'https://<domaine>' }],
  })
}
