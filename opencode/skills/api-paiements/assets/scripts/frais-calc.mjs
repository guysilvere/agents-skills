#!/usr/bin/env node
/**
 * frais-calc.mjs — Calcul du NET recu sur un paiement GeniusPay.
 *
 * Modele (mesure sur le compte live, cf. reference/frais.md) :
 *   frais = (montant x 1%) + 100 (fixe) + (montant x taux_operateur)
 *   net   = montant - frais
 *
 * Usage CLI :
 *   node frais-calc.mjs 10000 wave
 *   node frais-calc.mjs 10000            # sans methode : commission GeniusPay seule
 *   node frais-calc.mjs --table          # comparatif des methodes
 *
 * Usage module (app SvelteKit) :
 *   import { calculerNet, TAUX_OPERATEUR } from './frais-calc.mjs'
 *   const { net } = calculerNet(10000, 'wave')
 */

// --- Taux operateur, MESURES (ne pas deduire du dashboard) -------------------
export const TAUX_OPERATEUR = {
  wave: 0.015,
  orange_money: 0.015,
  mtn_money: 0.015,
  card: 0.015,
  paystack: 0.05,
};

export const COMMISSION_GENIUSPAY = 0.01; // 1 %
export const FRAIS_FIXES = 100;           // FCFA, sur CHAQUE transaction
export const MONTANT_MINIMUM = 200;       // XOF

/**
 * @param {number} montant - en XOF
 * @param {string|null} methode - cle de TAUX_OPERATEUR, ou null (mode checkout)
 * @returns {{montant:number, commission:number, operateur:number, tauxOperateur:number,
 *            fraisTotaux:number, tauxEffectif:number, net:number, netSansOperateur:number}}
 */
export function calculerNet(montant, methode = null) {
  if (!Number.isFinite(montant) || montant < MONTANT_MINIMUM)
    throw new Error(`montant invalide : minimum ${MONTANT_MINIMUM} XOF`);

  const commission = montant * COMMISSION_GENIUSPAY + FRAIS_FIXES;
  const tauxOperateur = methode == null ? 0
    : TAUX_OPERATEUR[methode] ?? (() => { throw new Error(`methode inconnue : ${methode}`); })();
  const operateur = montant * tauxOperateur;
  const fraisTotaux = commission + operateur;

  return {
    montant,
    commission,
    operateur,
    tauxOperateur,
    fraisTotaux,
    tauxEffectif: fraisTotaux / montant,
    net: montant - fraisTotaux,
    // Ce que l'API renvoie AVANT que le client choisisse : elle ignore l'operateur.
    netSansOperateur: montant - commission,
  };
}

// --- CLI ---------------------------------------------------------------------
const [, , a1, a2] = process.argv;
const fmt = (n) => n.toLocaleString('fr-FR', { maximumFractionDigits: 2 });

if (a1 === '--table' || a1 === '-t') {
  const montants = [200, 500, 1000, 2000, 5000, 10000, 50000, 100000];
  const methodes = [...Object.keys(TAUX_OPERATEUR)];
  console.log('Montant       ' + methodes.map((m) => m.padStart(13)).join('') + '   (net recu)');
  for (const m of montants) {
    console.log(String(fmt(m)).padEnd(14) + methodes.map((k) => fmt(calculerNet(m, k).net).padStart(13)).join(''));
  }
  console.log('\nTaux effectif (frais / montant) :');
  console.log('Montant       ' + methodes.map((m) => m.padStart(13)).join(''));
  for (const m of montants) {
    console.log(String(fmt(m)).padEnd(14) +
      methodes.map((k) => ((calculerNet(m, k).tauxEffectif * 100).toFixed(2) + ' %').padStart(13)).join(''));
  }
} else {
  const montant = Number(a1);
  if (!Number.isFinite(montant)) {
    console.error('Usage : node frais-calc.mjs <montant> [methode]');
    console.error('        node frais-calc.mjs --table');
    process.exit(1);
  }
  const r = calculerNet(montant, a2 ?? null);
  const pct = (x) => (x * 100).toFixed(2) + ' %';
  console.log(`montant            : ${fmt(r.montant)} XOF`);
  console.log(`commission 1%+100  : ${fmt(r.commission)}`);
  console.log(`operateur${a2 ? ` (${a2})` : ' (non choisi)'}  : ${fmt(r.operateur)}   [${pct(r.tauxOperateur)}]`);
  console.log(`frais totaux       : ${fmt(r.fraisTotaux)}   [${pct(r.tauxEffectif)}]`);
  console.log('');
  console.log(`NET RECU           : ${fmt(r.net)} XOF`);
  if (!a2) {
    console.log('');
    console.log(`(l'API renverra net_amount = ${fmt(r.netSansOperateur)} tant que le client`);
    console.log(` n'a pas choisi sa methode — le net reel sera PLUS BAS)`);
  }
}
