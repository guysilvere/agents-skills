<script lang="ts">
  import type { PageData } from './$types';

  export let data: PageData;

  // État local
  let activeTab: 'kanban' | 'list' | 'qa' = 'kanban';
  let searchQuery = '';
  let filterTheme = 'all';
  let filterStatus = 'all';

  // Colonnes Kanban
  const kanbanColumns = [
    { id: 'DRAFT', label: 'Cadrage / Draft' },
    { id: 'READY', label: 'Prêt pour Dev' },
    { id: 'IN_PROGRESS', label: 'En cours' },
    { id: 'TESTING', label: 'Validation QA' },
    { id: 'DONE', label: 'Terminé' },
  ] as const;

  $: filteredSpecs = (data.specs || []).filter(spec => {
    const matchesSearch = spec.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          spec.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTheme = filterTheme === 'all' || spec.theme === filterTheme;
    const matchesStatus = filterStatus === 'all' || spec.status === filterStatus;
    return matchesSearch && matchesTheme && matchesStatus;
  });

  $: specsByColumn = kanbanColumns.reduce((acc, col) => {
    acc[col.id] = filteredSpecs.filter(s => s.status === col.id);
    return acc;
  }, {} as Record<string, typeof data.specs>);
</script>

<div class="min-h-screen bg-neutral-950 text-neutral-100 p-4 md:p-8 font-sans">
  <!-- En-tête Cockpit -->
  <header class="mb-8 border-b border-neutral-800 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
    <div>
      <div class="flex items-center gap-3">
        <span class="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-neutral-900 border border-neutral-700 text-neutral-300">
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
        </span>
        <h1 class="text-xl font-semibold tracking-tight text-white">Cockpit Spécifications & QA</h1>
      </div>
      <p class="text-sm text-neutral-400 mt-1">Living Documentation, pilotage d'avancement et banc de tests interactif.</p>
    </div>

    <!-- Sélecteur de vue -->
    <div class="flex items-center bg-neutral-900 p-1 rounded-lg border border-neutral-800 self-start">
      <button
        type="button"
        class="px-3 py-1.5 text-xs font-medium rounded-md transition-colors {activeTab === 'kanban' ? 'bg-neutral-800 text-white shadow-sm' : 'text-neutral-400 hover:text-white'}"
        on:click={() => (activeTab = 'kanban')}
      >
        Kanban Tâches
      </button>
      <button
        type="button"
        class="px-3 py-1.5 text-xs font-medium rounded-md transition-colors {activeTab === 'list' ? 'bg-neutral-800 text-white shadow-sm' : 'text-neutral-400 hover:text-white'}"
        on:click={() => (activeTab = 'list')}
      >
        Liste Specs
      </button>
      <button
        type="button"
        class="px-3 py-1.5 text-xs font-medium rounded-md transition-colors {activeTab === 'qa' ? 'bg-neutral-800 text-white shadow-sm' : 'text-neutral-400 hover:text-white'}"
        on:click={() => (activeTab = 'qa')}
      >
        Banc de Tests QA
      </button>
    </div>
  </header>

  <!-- Filtres et Recherche -->
  <div class="mb-6 flex flex-col md:flex-row gap-3">
    <div class="relative flex-1">
      <input
        type="text"
        bind:value={searchQuery}
        placeholder="Rechercher une spec ou un test..."
        class="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-neutral-600"
      />
    </div>
    <select
      bind:value={filterTheme}
      class="bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-neutral-300 focus:outline-none focus:border-neutral-600"
    >
      <option value="all">Toutes les thématiques</option>
      {#each data.themes || [] as theme}
        <option value={theme}>{theme}</option>
      {/each}
    </select>
  </div>

  <!-- VUE 1 : KANBAN -->
  {#if activeTab === 'kanban'}
    <div class="grid grid-cols-1 md:grid-cols-5 gap-4 overflow-x-auto pb-4">
      {#each kanbanColumns as col}
        <div class="bg-neutral-900/60 border border-neutral-800/80 rounded-xl p-3 flex flex-col min-h-[500px]">
          <div class="flex items-center justify-between pb-3 mb-3 border-b border-neutral-800">
            <span class="text-xs font-semibold uppercase tracking-wider text-neutral-400">{col.label}</span>
            <span class="text-xs px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-400 font-mono">
              {specsByColumn[col.id]?.length || 0}
            </span>
          </div>

          <div class="flex flex-col gap-3 flex-1 overflow-y-auto">
            {#each specsByColumn[col.id] || [] as spec}
              <div class="bg-neutral-900 border border-neutral-800 rounded-lg p-3 shadow-sm hover:border-neutral-700 transition">
                <div class="flex items-center justify-between gap-2 mb-2">
                  <span class="text-[11px] font-mono text-neutral-400">{spec.id}</span>
                  <span class="text-[10px] px-1.5 py-0.5 rounded border border-neutral-800 bg-neutral-950 font-medium text-neutral-300">
                    {spec.theme}
                  </span>
                </div>
                <h4 class="text-sm font-medium text-white mb-2 leading-snug">{spec.title}</h4>
                <p class="text-xs text-neutral-400 line-clamp-2 mb-3">{spec.summary}</p>
                
                <div class="pt-2 border-t border-neutral-800/60 flex items-center justify-between text-[11px] text-neutral-500">
                  <span>Priorité: {spec.priority.replace('P0_', 'P0 ').replace('P1_', 'P1 ')}</span>
                  <form method="POST" action="?/updateStatus" class="inline">
                    <input type="hidden" name="specId" value={spec.id} />
                    <select
                      name="status"
                      class="bg-neutral-950 border border-neutral-800 rounded px-1.5 py-0.5 text-[10px] text-neutral-300"
                      on:change={(e) => e.currentTarget.form?.requestSubmit()}
                    >
                      {#each kanbanColumns as c}
                        <option value={c.id} selected={c.id === spec.status}>{c.label}</option>
                      {/each}
                    </select>
                  </form>
                </div>
              </div>
            {/each}
          </div>
        </div>
      {/each}
    </div>
  {/if}

  <!-- VUE 2 : LISTE -->
  {#if activeTab === 'list'}
    <div class="border border-neutral-800 rounded-xl overflow-hidden bg-neutral-900/40">
      <table class="w-full text-left text-sm text-neutral-300">
        <thead class="bg-neutral-900/80 text-xs uppercase font-medium text-neutral-400 border-b border-neutral-800">
          <tr>
            <th class="px-4 py-3">ID</th>
            <th class="px-4 py-3">Titre & Résumé</th>
            <th class="px-4 py-3">Thématique</th>
            <th class="px-4 py-3">Statut</th>
            <th class="px-4 py-3">Priorité</th>
            <th class="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-neutral-800/60">
          {#each filteredSpecs as spec}
            <tr class="hover:bg-neutral-900/30">
              <td class="px-4 py-3 font-mono text-xs text-neutral-400">{spec.id}</td>
              <td class="px-4 py-3">
                <div class="font-medium text-white">{spec.title}</div>
                <div class="text-xs text-neutral-400 mt-0.5">{spec.summary}</div>
              </td>
              <td class="px-4 py-3 text-xs">{spec.theme}</td>
              <td class="px-4 py-3 text-xs">
                <span class="inline-flex px-2 py-0.5 rounded-full border border-neutral-700 bg-neutral-800 text-neutral-300">
                  {spec.status}
                </span>
              </td>
              <td class="px-4 py-3 text-xs font-mono">{spec.priority}</td>
              <td class="px-4 py-3 text-right">
                <a href="#qa" on:click={() => (activeTab = 'qa')} class="text-xs text-indigo-400 hover:underline">
                  Voir tests
                </a>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}

  <!-- VUE 3 : BANC D'ESSAI QA -->
  {#if activeTab === 'qa'}
    <div class="space-y-6">
      {#each data.suites || [] as suite}
        <div class="bg-neutral-900/40 border border-neutral-800 rounded-xl p-5">
          <div class="flex items-center justify-between mb-4 border-b border-neutral-800 pb-3">
            <div>
              <h3 class="text-base font-semibold text-white">{suite.title}</h3>
              <p class="text-xs text-neutral-400 mt-0.5">{suite.description}</p>
            </div>
            <span class="text-xs font-mono px-2 py-1 rounded bg-neutral-800 text-neutral-400">
              {suite.scenarios?.length || 0} scénarios
            </span>
          </div>

          <div class="space-y-4">
            {#each suite.scenarios || [] as scenario}
              <div class="bg-neutral-950 border border-neutral-800/80 rounded-lg p-4">
                <div class="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
                  <div class="flex items-center gap-2">
                    <span class="text-xs font-mono px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-400">
                      {scenario.id}
                    </span>
                    <h4 class="text-sm font-medium text-white">{scenario.title}</h4>
                  </div>
                  <div class="flex items-center gap-2">
                    <!-- Marqueurs d'état un-clic -->
                    <form method="POST" action="?/recordResult" class="flex items-center gap-1.5">
                      <input type="hidden" name="scenarioId" value={scenario.id} />
                      <button
                        type="submit"
                        name="result"
                        value="passed"
                        class="px-2.5 py-1 text-xs font-medium rounded border border-emerald-900/60 bg-emerald-950/40 text-emerald-400 hover:bg-emerald-900/40"
                      >
                        Succès
                      </button>
                      <button
                        type="submit"
                        name="result"
                        value="failed"
                        class="px-2.5 py-1 text-xs font-medium rounded border border-rose-900/60 bg-rose-950/40 text-rose-400 hover:bg-rose-900/40"
                      >
                        Échec
                      </button>
                      <button
                        type="submit"
                        name="result"
                        value="pending"
                        class="px-2.5 py-1 text-xs font-medium rounded border border-neutral-800 bg-neutral-900 text-neutral-400 hover:bg-neutral-800"
                      >
                        Reset
                      </button>
                    </form>
                  </div>
                </div>

                <p class="text-xs text-neutral-300 mb-2">{scenario.description}</p>
                <div class="text-[11px] text-neutral-400 bg-neutral-900/80 border border-neutral-800 rounded p-2 mb-3">
                  <span class="font-semibold text-neutral-300">Attendu :</span> {scenario.expected_outcome}
                </div>

                <!-- Formulaire de simulation / exécution directe -->
                {#if scenario.test_payload}
                  <div class="mt-3 pt-3 border-t border-neutral-800/80 flex flex-col md:flex-row md:items-center justify-between gap-2">
                    <span class="text-[11px] font-mono text-neutral-500">Payload fixture disponible</span>
                    <form method="POST" action="?/executeTest" class="inline">
                      <input type="hidden" name="scenarioId" value={scenario.id} />
                      <button
                        type="submit"
                        class="px-3 py-1 text-xs font-medium rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700"
                      >
                        Lancer la simulation
                      </button>
                    </form>
                  </div>
                {/if}
              </div>
            {/each}
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>
