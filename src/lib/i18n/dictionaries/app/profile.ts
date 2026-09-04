/** Testi della pagina profilo dell'app autenticata. */
export const it = {
  eyebrow: 'Account',
  title: 'Profilo',
  subtitle: 'Gestisci i tuoi dati, l’email di accesso e i dati di fatturazione.',

  personal: {
    title: 'Dati personali',
    firstName: 'Nome',
    lastName: 'Cognome',
    save: 'Salva',
    saving: 'Salvo…',
    saved: 'Dati aggiornati.',
  },

  email: {
    title: 'Email di accesso',
    hint: 'Per cambiarla ti mandiamo un codice al nuovo indirizzo: il cambio è effettivo solo dopo la conferma.',
    label: 'Email',
    codeLabel: 'Codice ricevuto via email',
    wait: 'Attendi…',
    send: 'Invia codice',
    confirm: 'Conferma cambio',
    cancel: 'Annulla',
    codeSent: 'Ti abbiamo inviato un codice a {email}. Inseriscilo qui sotto per confermare.',
    updated: 'Email aggiornata. Da ora accedi con il nuovo indirizzo.',
  },

  billing: {
    title: 'Dati di fatturazione',
    hint: 'Compaiono nelle fatture PDF che scarichi. Compila ciò che ti serve.',
    name: 'Intestazione / Ragione sociale',
    namePlaceholder: 'Nome o azienda',
    vat: 'P. IVA',
    taxCode: 'Codice fiscale',
    address: 'Indirizzo',
    zip: 'CAP',
    city: 'Città',
    country: 'Paese',
    countryPlaceholder: 'IT',
    save: 'Salva fatturazione',
    saving: 'Salvo…',
    saved: 'Dati di fatturazione salvati.',
  },

  error: 'Errore',
}

export const en: typeof it = {
  eyebrow: 'Account',
  title: 'Profile',
  subtitle: 'Manage your details, your sign-in email and your billing information.',

  personal: {
    title: 'Personal details',
    firstName: 'First name',
    lastName: 'Last name',
    save: 'Save',
    saving: 'Saving…',
    saved: 'Details updated.',
  },

  email: {
    title: 'Sign-in email',
    hint: 'To change it we send a code to the new address: the change only takes effect once you confirm.',
    label: 'Email',
    codeLabel: 'Code received by email',
    wait: 'Please wait…',
    send: 'Send code',
    confirm: 'Confirm change',
    cancel: 'Cancel',
    codeSent: 'We’ve sent a code to {email}. Enter it below to confirm.',
    updated: 'Email updated. From now on you sign in with the new address.',
  },

  billing: {
    title: 'Billing details',
    hint: 'They appear on the PDF invoices you download. Fill in whatever you need.',
    name: 'Billed to / Company name',
    namePlaceholder: 'Name or company',
    vat: 'VAT number',
    taxCode: 'Tax code',
    address: 'Address',
    zip: 'Postcode',
    city: 'City',
    country: 'Country',
    countryPlaceholder: 'IT',
    save: 'Save billing details',
    saving: 'Saving…',
    saved: 'Billing details saved.',
  },

  error: 'Error',
}
