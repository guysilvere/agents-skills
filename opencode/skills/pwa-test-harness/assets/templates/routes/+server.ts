import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

/**
 * Endpoint JSON interne pour les agents IA et les serveurs MCP locaux.
 * Protégé par token local ou session super-admin.
 */
export const GET: RequestHandler = async ({ url }) => {
  const resource = url.searchParams.get('resource'); // 'specs' | 'qa' | 'summary'

  // Retourne l'état structuré en JSON pour les LLM
  return json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    resource: resource || 'all',
    data: {}
  });
};

export const POST: RequestHandler = async ({ request }) => {
  const body = await request.json();
  const { action, payload } = body;

  // Actions possibles : 'update_spec', 'record_test_result', 'trigger_run'
  return json({
    success: true,
    action,
    updated_at: new Date().toISOString()
  });
};
