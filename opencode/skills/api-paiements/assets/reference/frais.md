# Frais GeniusPay — modèle et calcul du net

> **Mesuré sur le compte live, pas recopié de la doc.** Chaque taux ci-dessous vient d'un paiement
> réel créé puis relu (voir `frais-calc.mjs` pour reproduire).

## La formule

```
frais_totaux = (montant × 1 %) + 100          ← commission GeniusPay
             + (montant × taux_opérateur)     ← frais opérateur, variable

net = montant − frais_totaux
```

- **1 %** du montant
- **+ 100 FCFA fixes** — sur **chaque** transaction, quel que soit le montant
- **+ taux opérateur** — variable selon la méthode

## Taux opérateur mesurés

| Méthode (`payment_method`) | Taux | Vérifié sur |
| --- | --- | --- |
| `wave` | **1,50 %** | 200, 1 000 et 10 000 XOF — pourcentage pur, aucune part fixe |
| `orange_money` | **1,50 %** | 1 000 XOF |
| `mtn_money` | **1,50 %** | 1 000 XOF |
| `card` | **1,50 %** | 1 000 XOF |
| `paystack` | **5,00 %** | 1 000 XOF |
| *(aucune — mode checkout)* | 0 % tant que le client n'a pas choisi | 200, 5 000, 104 410 XOF |

⚠️ `payment_method: "paystack"` facture **5 %**, pas les 3,5 % annoncés pour le Mobile Money dans
le dashboard. Ne pas se fier au taux affiché : **mesurer**.

## ⚠️ Les deux pièges

### 1. `net_amount` renvoyé par l'API n'est pas le net réel

Tant que le client n'a pas choisi sa méthode sur la page de checkout, `fees` ne contient **que**
la commission GeniusPay :

| Référence | Montant | `fees` | Méthode | Réel |
| --- | --- | --- | --- | --- |
| MTX-7LM3NRSQWJ | 200 | **102** | non choisie | 1 % + 100 = 102 |
| MTX-LRBWF0QALW | 200 | **105** | wave | + 3 (1,5 %) |

Après paiement, `fees` **augmente** et `net_amount` **baisse**. Ne jamais comptabiliser un net
depuis la réponse de création — le relire **après** le webhook `payment.success`.

### 2. Les 100 FCFA fixes écrasent les petits montants

| Montant | Frais wave | Taux effectif | Net |
| --- | --- | --- | --- |
| 200 | 105 | **52,5 %** | 95 |
| 500 | 112,50 | 22,5 % | 387,50 |
| 1 000 | 125 | 12,5 % | 875 |
| 5 000 | 225 | 4,5 % | 4 775 |
| 10 000 | 350 | **3,5 %** | 9 650 |
| 50 000 | 1 350 | 2,7 % | 48 650 |
| 100 000 | 2 600 | 2,6 % | 97 400 |

**Le taux plancher est ~2,5 %** (1 % + 1,5 %), atteint seulement au-delà de 50 000 XOF.
En dessous de 2 000 XOF, les frais dépassent 7 %.

**Règle de conception** : ne jamais proposer un prix proche du minimum (200). Fixer un panier
minimum, ou des paliers où le montant est assez élevé pour que le fixe soit négligeable.

## Utilisation du calculateur

```bash
node assets/scripts/frais-calc.mjs 10000 wave
# montant      : 10 000 XOF
# commission   : 200      (1 % + 100 fixe)
# opérateur    : 150      (wave 1,5 %)
# frais totaux : 350      (3,50 %)
# NET RECU     : 9 650 XOF
```

Le script affiche **le net en dernier**, en évidence — c'est la seule valeur à retenir pour
la comptabilité et le dimensionnement des prix.

## Services du dashboard (état au 2026-09-17)

Ces services sont des **agrégateurs**, à ne pas confondre avec le `payment_method` de l'API
(qui désigne l'opérateur).

| Service | Périmètre | Taux affiché | État |
| --- | --- | --- | --- |
| **Wave** | Mobile Money, CI | 1,5 % | ✅ Activé — *par défaut* |
| **PawaPay** | Mobile Money, 20+ pays | ~3,5 % (MMO + PawaPay 1 %) | ✅ Activé |
| **Paystack** | Mobile Money & Cartes, Multi-pays (CI) | MM 3,5 % · Cartes 5 % | ✅ Activé |
| **Stripe** | Cartes internationales, 135+ pays | 5 % | ✅ Activé |
| **CinetPay** | MM & Cartes, 8 pays UEMOA | MM 3 % · Cartes 4 % | ⛔ **Indisponible — perturbations techniques** |
| **PAL** | MM multi-pays (7 pays) | 3,5 % uniformes | ⬜ Désactivé |
| **PaiementPro** | MM, Cartes & PayPal (19 réseaux) | MM 5 % · Cartes 5–10 % · PayPal 5–10 % | ⬜ Désactivé |

⚠️ Les taux de ce tableau sont ceux **affichés dans le dashboard**. Ils ne correspondent pas
toujours à ce que l'API facture réellement (cf. `paystack` : 3,5 % annoncé, 5 % mesuré).
**Seule la mesure fait foi.**

## Ce que la commission ne couvre pas

- **Reversement (payout)** : non testé — vérifier s'il est facturé en plus.
- **Remboursement** : impact sur la commission non documenté.
- **Devises étrangères** : une conversion s'applique (cf. `geniuspay.md`, piège devise) ; le taux
  de change n'est pas exposé.

## À clarifier auprès du support

- Le taux `paystack` réel : 3,5 % (dashboard) ou 5 % (mesuré) ?
- La commission est-elle prélevée sur un paiement **remboursé** ?
- Les frais de **reversement** vers un compte Mobile Money ou bancaire ?
