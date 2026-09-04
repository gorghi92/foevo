/**
 * Testi delle pagine di accesso e registrazione.
 *
 * Nota sui link: `/login` e `/signup` sono percorsi non prefissati (area
 * autenticata), mentre `/privacy` è una pagina pubblica localizzata e quindi
 * nella versione inglese punta a `/en/privacy`.
 */
export const it = {
  login: {
    title: 'Accedi a Foevo',
    subtitle: 'Ti inviamo un link di accesso via email — niente password.',
    emailPlaceholder: 'La tua email',
    submit: 'Invia link di accesso',
    sending: 'Invio…',
    error: 'Errore, riprova.',
    notFound: 'Nessun account con questa email. [Registrati](/signup) per iniziare.',
    noAccount: 'Non hai un account? [Registrati](/signup)',
    terms: 'Accedendo accetti la [privacy policy](/privacy). La sessione resta attiva finché non esci.',
    sent: {
      title: 'Controlla la tua email',
      // Fra `bodyPre` e `bodyPost` viene inserita l'email in grassetto.
      bodyPre: 'Ti abbiamo inviato un **link di accesso** a ',
      bodyPost: '. Aprilo su questo dispositivo per entrare. Il link scade a breve.',
      otherEmail: 'Usa un’altra email',
    },
  },

  signup: {
    title: 'Crea il tuo account',
    subtitle: 'Niente password: inserisci i dati e prosegui al pagamento.',
    // Fra `pre` e `post` viene inserito il nome del piano scelto.
    activating: { pre: 'Stai attivando il piano ', post: '. ' },
    choosePlan: 'Scegli il piano',
    perMonth: '+ IVA / mese',
    noPlans: 'Nessun piano al momento disponibile. Riprova più tardi.',
    firstName: 'Nome',
    lastName: 'Cognome',
    emailPlaceholder: 'La tua email',
    submit: 'Vai al pagamento',
    submitting: 'Attendi…',
    error: 'Errore',
    noPlanSelected: 'Scegli un piano per continuare.',
    haveAccount: 'Hai già un account? [Accedi](/login)',
    checkout: {
      activate: 'Attiva',
      securePayment: 'pagamento sicuro Whop',
      edit: 'Modifica i dati',
    },
  },
}

export const en: typeof it = {
  login: {
    title: 'Sign in to Foevo',
    subtitle: 'We’ll email you a sign-in link — no password needed.',
    emailPlaceholder: 'Your email',
    submit: 'Send sign-in link',
    sending: 'Sending…',
    error: 'Something went wrong, please try again.',
    notFound: 'No account with this email. [Sign up](/signup) to get started.',
    noAccount: 'Don’t have an account? [Sign up](/signup)',
    terms: 'By signing in you accept the [privacy policy](/en/privacy). Your session stays active until you sign out.',
    sent: {
      title: 'Check your email',
      bodyPre: 'We’ve sent a **sign-in link** to ',
      bodyPost: '. Open it on this device to get in. The link expires shortly.',
      otherEmail: 'Use a different email',
    },
  },

  signup: {
    title: 'Create your account',
    subtitle: 'No password: enter your details and continue to payment.',
    activating: { pre: 'You’re activating the ', post: ' plan. ' },
    choosePlan: 'Choose your plan',
    perMonth: '+ VAT / month',
    noPlans: 'No plans available right now. Please try again later.',
    firstName: 'First name',
    lastName: 'Last name',
    emailPlaceholder: 'Your email',
    submit: 'Go to payment',
    submitting: 'Please wait…',
    error: 'Something went wrong',
    noPlanSelected: 'Choose a plan to continue.',
    haveAccount: 'Already have an account? [Sign in](/login)',
    checkout: {
      activate: 'Activate',
      securePayment: 'secure payment via Whop',
      edit: 'Edit your details',
    },
  },
}
