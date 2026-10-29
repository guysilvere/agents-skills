import type { PageServerLoad, Actions } from './$types';
import { error, fail } from '@sveltejs/kit';
// Importer le client libSQL / Turso applicatif (ex. import { db } from '$lib/server/db')

export const load: PageServerLoad = async ({ locals }) => {
  // 1. Autorisation stricte : réservé au Super Admin en production
  // En local (.test) ou staging, accessible aux développeurs
  /*
  if (process.env.NODE_ENV === 'production' && !locals.user?.isSuperAdmin) {
    throw error(404, 'Page non trouvée');
  }
  */

  // 2. Récupération des données depuis Turso
  // Exemple d'interrogation SQL :
  // const specs = await db.execute('SELECT * FROM project_specs ORDER BY priority ASC, created_at DESC');
  // const suites = await db.execute('SELECT * FROM qa_suites ORDER BY display_order ASC');
  // const scenarios = await db.execute('SELECT * FROM qa_scenarios WHERE is_active = 1 ORDER BY display_order ASC');

  return {
    specs: [],
    themes: ['Authentification', 'Paiements', 'PWA & Hors-ligne', 'Dashboard'],
    suites: [],
  };
};

export const actions: Actions = {
  updateStatus: async ({ request }) => {
    const data = await request.formData();
    const specId = data.get('specId')?.toString();
    const status = data.get('status')?.toString();

    if (!specId || !status) {
      return fail(400, { error: 'Paramètres manquants' });
    }

    // UPDATE project_specs SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    return { success: true };
  },

  recordResult: async ({ request }) => {
    const data = await request.formData();
    const scenarioId = data.get('scenarioId')?.toString();
    const result = data.get('result')?.toString();

    if (!scenarioId || !result) {
      return fail(400, { error: 'Paramètres manquants' });
    }

    // INSERT INTO qa_results (id, run_id, scenario_id, status) ... ON CONFLICT UPDATE
    return { success: true };
  },

  executeTest: async ({ request }) => {
    const data = await request.formData();
    const scenarioId = data.get('scenarioId')?.toString();

    // Déclencher le test unitaire / d'intégration associé côté serveur
    return { success: true, message: `Test ${scenarioId} simulé avec succès.` };
  }
};
