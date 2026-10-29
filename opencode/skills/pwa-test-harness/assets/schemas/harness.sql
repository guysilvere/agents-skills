-- =============================================================================
-- Schéma Cockpit Développement & QA (Turso / libSQL / SQLite)
-- Living Documentation, Spécifications vivantes & Banc d'essai QA
-- =============================================================================

-- 1. Spécifications & Tâches produit (pilotage Kanban & Liste)
CREATE TABLE IF NOT EXISTS project_specs (
  id TEXT PRIMARY KEY,                 -- ex: 'SPEC-AUTH-001', 'SPEC-PAY-002'
  theme TEXT NOT NULL,                 -- ex: 'Authentification', 'Paiement', 'Offline PWA'
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  acceptance_criteria TEXT NOT NULL,   -- JSON array: ["OTP recu en < 30s", "Session persistante 30j"]
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK(status IN ('DRAFT', 'READY', 'IN_PROGRESS', 'TESTING', 'DONE')),
  priority TEXT NOT NULL DEFAULT 'P1_CORE' CHECK(priority IN ('P0_BLOCKING', 'P1_CORE', 'P2_NICE_TO_HAVE')),
  assigned_to TEXT DEFAULT 'lead-dev', -- 'human', 'lead-dev', 'integrations'
  notes TEXT,                          -- Annotations humaines ou techniques
  completed_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Thématiques / Suites de tests
CREATE TABLE IF NOT EXISTS qa_suites (
  id TEXT PRIMARY KEY,                 -- ex: 'auth', 'payment', 'pwa-offline', 'r2-storage'
  title TEXT NOT NULL,                -- ex: 'Authentification & Sessions'
  description TEXT,
  display_order INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. Scénarios de validation
CREATE TABLE IF NOT EXISTS qa_scenarios (
  id TEXT PRIMARY KEY,                 -- ex: 'AUTH-TC-001', 'PAY-TC-003'
  suite_id TEXT NOT NULL REFERENCES qa_suites(id) ON DELETE CASCADE,
  spec_id TEXT REFERENCES project_specs(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'major' CHECK(severity IN ('critical', 'major', 'minor')),
  expected_outcome TEXT NOT NULL,
  test_payload TEXT,                  -- JSON des fixtures d'essai pour le formulaire
  display_order INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,         -- 1 = actif, 0 = archive (historique preserve)
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 4. Campagnes d'exécution (Runs de validation)
CREATE TABLE IF NOT EXISTS qa_runs (
  id TEXT PRIMARY KEY,                 -- UUID v4
  version_git TEXT NOT NULL,           -- Commit SHA ou tag SemVer
  environment TEXT NOT NULL DEFAULT 'local' CHECK(environment IN ('local', 'staging', 'preview')),
  executed_by TEXT NOT NULL,           -- 'ops-quality', 'lead-dev' ou prenom humain
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK(status IN ('in_progress', 'completed')),
  summary_stats TEXT,                  -- JSON cache: {"total": 12, "passed": 10, "failed": 2}
  started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME
);

-- 5. Résultats individuels par test dans un run
CREATE TABLE IF NOT EXISTS qa_results (
  id TEXT PRIMARY KEY,                 -- UUID v4
  run_id TEXT NOT NULL REFERENCES qa_runs(id) ON DELETE CASCADE,
  scenario_id TEXT NOT NULL REFERENCES qa_scenarios(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'passed', 'failed', 'skipped')),
  notes TEXT,                          -- Explication du bug ou observations
  error_payload TEXT,                  -- Trace d'erreur / payload recue
  duration_ms INTEGER,
  executed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(run_id, scenario_id)
);

-- 6. Journal d'activité (Audit & Changelog automatique)
CREATE TABLE IF NOT EXISTS qa_activity_log (
  id TEXT PRIMARY KEY,                 -- UUID v4
  entity_type TEXT NOT NULL,           -- 'spec', 'scenario', 'run'
  entity_id TEXT NOT NULL,
  action TEXT NOT NULL,                -- 'created', 'status_changed', 'tested', 'annotated'
  author TEXT NOT NULL,                -- 'human' ou agent
  details TEXT,                        -- JSON description
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Index pour performance optimale sur mobile
CREATE INDEX IF NOT EXISTS idx_project_specs_status ON project_specs(status);
CREATE INDEX IF NOT EXISTS idx_project_specs_theme ON project_specs(theme);
CREATE INDEX IF NOT EXISTS idx_qa_scenarios_suite ON qa_scenarios(suite_id);
CREATE INDEX IF NOT EXISTS idx_qa_scenarios_spec ON qa_scenarios(spec_id);
CREATE INDEX IF NOT EXISTS idx_qa_results_run ON qa_results(run_id);
CREATE INDEX IF NOT EXISTS idx_qa_results_status ON qa_results(status);
