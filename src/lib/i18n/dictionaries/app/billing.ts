/** Testi dell'area abbonamento e fatturazione dell'app autenticata. */
export const it = {
  eyebrow: 'Abbonamento',
  title: 'Piano e fatturazione',
  subtitle: 'Gestisci il tuo piano, scarica le fatture e controlla i pagamenti.',

  noPlan: 'Nessun piano',
  currentPlanNote: 'Piano attuale · pagamenti gestiti da Whop',
  statusInactive: 'non attivo',
  canceling: 'Abbonamento annullato — attivo fino al {date}, poi non verrà rinnovato.',
  nextRenewal: 'Prossimo rinnovo: {date}',
  vatNote:
    'I prezzi sono **IVA esclusa**: l’IVA/imposta viene calcolata da Whop in base al tuo paese al momento del pagamento.',

  payments: {
    title: 'Storico pagamenti',
    colDate: 'Data',
    colDescription: 'Descrizione',
    colAmount: 'Importo',
    colStatus: 'Stato',
    colInvoice: 'Fattura',
    defaultDescription: 'Abbonamento Foevo',
    vatIncluded: '(IVA incl.)',
    empty: 'Nessun pagamento registrato. Compaiono qui dopo l’attivazione su Whop.',
  },

  actions: {
    downgradeConfirm: 'Vuoi passare al piano Base?',
    downgradeWhopNote: '\n\nRicorda: gestisci/annulla anche l’abbonamento su Whop per fermare gli addebiti.',
    downgradeBusy: 'Downgrade…',
    downgrade: 'Passa a Base',
    cancelConfirm:
      'Vuoi annullare l’abbonamento?\n\nResterà attivo fino alla data di rinnovo, poi non verrà più rinnovato.',
    cancelBusy: 'Annullo…',
    cancel: 'Annulla abbonamento',
    error: 'Errore',
  },

  plans: {
    tierPremium: 'Avanzato',
    tierStandard: 'Standard',
    perMonth: '+ IVA/mese',
    current: 'Piano attuale',
    activate: 'Attiva {plan}',
    notConfigured: 'Checkout non configurato',
    modalPrice: '€{price} + IVA / mese · pagamento sicuro Whop',
    close: 'Chiudi',
  },
}

export const en: typeof it = {
  eyebrow: 'Subscription',
  title: 'Plan and billing',
  subtitle: 'Manage your plan, download your invoices and keep an eye on your payments.',

  noPlan: 'No plan',
  currentPlanNote: 'Current plan · payments handled by Whop',
  statusInactive: 'inactive',
  canceling: 'Subscription cancelled — active until {date}, after that it will not renew.',
  nextRenewal: 'Next renewal: {date}',
  vatNote:
    'Prices are **excluding VAT**: VAT/tax is calculated by Whop based on your country at the time of payment.',

  payments: {
    title: 'Payment history',
    colDate: 'Date',
    colDescription: 'Description',
    colAmount: 'Amount',
    colStatus: 'Status',
    colInvoice: 'Invoice',
    defaultDescription: 'Foevo subscription',
    vatIncluded: '(VAT incl.)',
    empty: 'No payments yet. They show up here once your plan is activated on Whop.',
  },

  actions: {
    downgradeConfirm: 'Switch to the Base plan?',
    downgradeWhopNote: '\n\nRemember: manage/cancel the subscription on Whop as well to stop the charges.',
    downgradeBusy: 'Downgrading…',
    downgrade: 'Switch to Base',
    cancelConfirm:
      'Cancel your subscription?\n\nIt stays active until the renewal date, after that it will not be renewed.',
    cancelBusy: 'Cancelling…',
    cancel: 'Cancel subscription',
    error: 'Error',
  },

  plans: {
    tierPremium: 'Advanced',
    tierStandard: 'Standard',
    perMonth: '+ VAT/month',
    current: 'Current plan',
    activate: 'Activate {plan}',
    notConfigured: 'Checkout not configured',
    modalPrice: '€{price} + VAT / month · secure payment with Whop',
    close: 'Close',
  },
}
