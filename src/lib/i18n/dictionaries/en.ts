import type { Dictionary } from './it'

/**
 * English dictionary. Must implement every key of the Italian one:
 * TypeScript enforces it, so a missing translation breaks the typecheck.
 */
export const en: Dictionary = {
  common: {
    login: 'Sign in',
    signup: 'Sign up',
    startNow: 'Get started',
    back: 'Back',
    loading: 'Loading…',
    dateLocale: 'en-GB',
    language: 'Language',
  },

  home: {
    meta: {
      title: 'Foevo — See where your customers look, and why they don’t buy',
      description:
        'Foevo analyses your page and returns an attention map plus an action plan covering brand, CTA, copy and friction. Full report in about a minute, with no script to install.',
    },
    nav: { how: 'How it works', inPractice: 'In practice', pricing: 'Pricing', faq: 'FAQ' },

    hero: {
      badge: 'Chrome extension · report in about a minute',
      titleA: 'See where your customers look.',
      titleB: 'And why they don’t buy.',
      sub: 'Foevo analyses your page and gives you an attention map plus an action plan covering brand, CTA, copy and friction. Without waiting weeks for traffic.',
      ctaPrimary: 'Get started — from €5/month',
      ctaSecondary: 'See how it works',
      note: 'Cancel anytime, in one click · VAT calculated at checkout',
      demoNote: 'Sample output. Switch between **Heatmap** and **Zones** to see both readings.',
    },

    facts: [
      { k: '~60 sec', v: 'from capture to full report' },
      { k: '2 engines', v: 'visual and semantic, combined' },
      { k: '6 dimensions', v: 'attention, brand, CTA, copy, friction, goal' },
      { k: '0 scripts', v: 'nothing to install on your site' },
    ],

    problem: {
      eyebrow: 'The problem',
      title: 'Traffic is expensive.\nGuessing costs more.',
      body: 'You send visits to a page and they don’t convert. You open analytics and find out *how many* leave, not *why*. So you end up changing things at random, hoping the next one is the right one.',
      symptoms: [
        'You changed the button colour. Then the headline. Then the price. On gut feeling.',
        'A statistically valid A/B test needs thousands of visits: you don’t have them, or you can’t wait three weeks.',
        'Classic heatmaps only start afterwards: first you have to bring traffic — and pay for it.',
        'You ask around for opinions: five people, five answers, zero criteria.',
      ],
    },

    engine: {
      eyebrow: 'The mechanism',
      title: 'Attention Scan',
      body: 'Two engines read the same page from two different angles: one looks like an eye, the other understands like a customer. The results are merged and anchored to the real elements on the page.',
      items: [
        {
          title: 'Visual engine',
          body: 'A saliency model reads contrast, density, position, shapes and hierarchy — the same foundation used by predictive eye-tracking models. It estimates where the gaze lands in the first seconds, before the visitor reads anything.',
        },
        {
          title: 'Semantic engine',
          body: 'A multimodal model looks at the page the way a customer would: what it promises, how clear the CTA is, what distracts, what’s missing to build trust. It doesn’t count pixels — it understands the message.',
        },
        {
          title: 'DOM anchoring',
          body: 'Attention zones are attached to the real elements on the page — that headline, that button, that banner. No vague boxes: every recommendation points to something that actually exists.',
        },
      ],
      notIsTitle: 'What Foevo is not',
      notIsBody:
        'It is not eye-tracking on real users: it’s a **predictive estimate**. And it doesn’t replace an A/B test — it tells you **what to test first**, today, instead of waiting weeks of data just to know where to start. We’d rather tell you here than let you find out later.',
    },

    benefits: {
      eyebrow: 'What you get',
      title: 'Not a chart to stare at. A list of things to do.',
      items: [
        { t: 'You know what to test first', b: 'Recommendations come ranked by estimated impact. Start with the first one, not the one you like most.' },
        { t: 'You spot friction you stopped seeing', b: 'Cookie banners covering the hero, long forms, elements stealing attention from the CTA. The things whoever built the page stops noticing.' },
        { t: 'You get the copy rewritten', b: 'Headlines and key lines reframed around the benefit — not just “this doesn’t work”.' },
        { t: 'You check brand and hierarchy', b: 'Palette, fonts, CTA contrast and visual consistency, assessed against the page’s goal.' },
        { t: 'You get a comparable score', b: 'A conversion number with the reasoning behind it: re-run the analysis after your changes and see if you improved.' },
        { t: 'You share it with a client or your team', b: 'With Premium you generate a branded public link: the client opens it and reads the report, no account needed.' },
      ],
    },

    steps: {
      eyebrow: 'In practice',
      title: 'Three steps, one report',
      items: [
        { t: 'Install the extension', b: 'One click from the Chrome Web Store. Then sign in with your email and you’re ready.' },
        { t: 'Open a page and hit Analyse', b: 'Foevo captures the whole page — only when you decide — and sends it to both engines.' },
        { t: 'Read the report and act', b: 'Heatmap, zones, score and prioritised actions in your dashboard. In about a minute.' },
      ],
      checks: ['No script on your site', 'Captures only on your command', 'Works on staging too'],
    },

    audience: {
      eyebrow: 'Who it’s for',
      forTitle: 'Foevo is for you if…',
      forItems: [
        'You sell online and traffic costs you: every conversion point is margin.',
        'You don’t have the visit volume for serious A/B tests, or you can’t wait weeks.',
        'You manage pages for clients and need a defensible analysis, not an opinion.',
        'You’ve just launched a page and want to know what’s wrong before you put ads behind it.',
      ],
      notTitle: 'It’s not for you if…',
      notItems: [
        'You’re after real user behaviour tracking: for that you need Hotjar or Clarity, plus weeks of traffic.',
        'You want someone to redo the page for you: Foevo tells you what to change, you make the changes.',
      ],
      note: 'We’d rather lose the wrong customer than disappoint the right one.',
    },

    pricing: {
      eyebrow: 'Pricing',
      title: 'Three plans, no surprises',
      sub: 'Prices exclude VAT: the tax for your country is calculated at checkout.',
      featuredBadge: 'Most chosen by people working with clients',
      perMonth: '+ VAT / month',
      plans: [
        {
          slug: 'starter',
          name: 'Starter',
          per: 'To start with the pages that matter',
          price: '5',
          note: '€1 per analysis',
          cta: 'Get Starter',
          feats: [
            '5 analyses per month',
            'Hybrid heatmap and Focus mode',
            'Attention zones on real elements',
            'Conversion score with reasoning',
            'Analysis history',
          ],
        },
        {
          slug: 'base',
          name: 'Base',
          per: 'For anyone with a site who wants to keep it sharp',
          price: '19',
          note: 'about €0.63 per analysis',
          cta: 'Get Base',
          feats: [
            '30 analyses per month',
            'Hybrid heatmap and Focus mode',
            'Attention zones on real elements',
            'Conversion score with reasoning',
            'Analysis history',
          ],
        },
        {
          slug: 'premium',
          name: 'Premium',
          per: 'For anyone working on clients’ pages',
          price: '49',
          note: 'about €0.33 per analysis',
          cta: 'Get Premium',
          feats: [
            '150 analyses per month',
            'Everything in Base',
            'Premium AI analysis, deeper',
            'Brand, CTA, copy and friction',
            'Branded public link to share',
          ],
        },
      ],
      noLockTitle: 'No lock-in',
      noLockBody:
        'You can **cancel anytime from your account, in one click**: the subscription stays active until the renewal date, then stops. No penalty, no email to write, nobody trying to keep you on the phone.',
    },

    faq: {
      eyebrow: 'FAQ',
      title: 'What people ask us first',
      items: [
        {
          q: 'How reliable is it? Is it real eye-tracking?',
          a: 'No, and it’s only fair to say so plainly: Foevo produces a predictive estimate, not tracking of real eyes. The visual engine builds on the saliency models used in predictive eye-tracking; the semantic one judges the message. It’s meant to tell you what to look at and what to test first, today — not to replace a test with real users.',
        },
        {
          q: 'How is it different from Hotjar or Microsoft Clarity?',
          a: 'They’re complementary tools, not alternatives. Those record what real users do: to get data you need traffic and time. Foevo works before that, on the page as it is: it analyses it right away, even at zero traffic, and hands you the hypotheses to verify. Many people use it precisely to decide what to put into testing.',
        },
        {
          q: 'Do I have to install anything on my site?',
          a: 'No. Foevo lives in the Chrome extension: no script to add to your site, no tag manager, no performance impact. It also works on staging or password-protected pages, because it analyses what you see in your browser.',
        },
        {
          q: 'How do I install the extension?',
          a: 'You add it from the Chrome Web Store in one click, then sign in with your email from the extension settings. No developer mode, no zip to upload: you’re running in a minute.',
        },
        {
          q: 'Does Foevo capture my pages in the background?',
          a: 'Never. The screenshot is taken only when you press the Analyse button, on the tab you have open. No automatic collection, no background monitoring.',
        },
        {
          q: 'Which pages does it work on?',
          a: 'Any page you open in your browser: landing pages, homepages, product pages, checkouts, sign-up pages. E-commerce, SaaS, services, portfolios.',
        },
        {
          q: 'Can I cancel whenever I want?',
          a: 'Yes, from your account, in one click. The subscription stays active until the renewal date and then isn’t renewed. No phone call, no email to write.',
        },
        {
          q: 'Why are prices shown excluding VAT?',
          a: 'Because the tax depends on your country and is calculated at checkout by our payment provider. You see the exact amount before confirming — no surprises on the invoice.',
        },
      ],
    },

    finalCta: {
      titleA: 'Your page already has a problem.',
      titleB: 'You may as well know which one.',
      sub: 'Analyse it and read what you’d change first. It takes a minute, and you already know where to restart.',
      cta: 'Get started',
      note: 'From €5/month + VAT · cancel anytime',
    },

    footer: {
      tagline: 'Attention heatmaps & AI conversion analysis.',
      affiliates: 'Become an affiliate',
      support: 'Support',
      privacy: 'Privacy',
      nameStory:
        '**The name.** The *fovea* is the small pit at the centre of the retina where vision is sharpest: the point where the eye focuses attention. On the retina, though, every image arrives upside down — it’s the brain that turns it back. **Foevo** has two letters swapped too: a small reminder that what you think is seen is never exactly what is seen.',
    },
  },

  privacy: {
    meta: { title: 'Privacy', description: 'Privacy policy for Foevo and the Foevo Chrome extension.' },
    title: 'Privacy Policy',
    updated: 'Foevo · updated 2026-08-26',
    intro:
      'Foevo captures a screenshot of a page you **explicitly choose to analyse** and uses it to generate an attention heatmap and a conversion-oriented analysis.',
    access: {
      h: 'What the extension accesses',
      items: [
        '**A screenshot of the active tab**, only when you press “Analyse” (the `activeTab` permission, granted per click).',
        'The page **URL and title**, to label the analysis.',
        'Any **goal and notes** you type in.',
      ],
    },
    device: {
      h: 'Data stored on your device',
      p: 'The endpoint and your session credentials are stored in `chrome.storage` and leave the browser only as an `Authorization` header sent to the Foevo endpoint you configured.',
    },
    where: {
      h: 'Where the data goes',
      items: [
        'Screenshots and metadata are sent over HTTPS to your Foevo account.',
        'To produce the analysis, the screenshot is processed by a **third-party AI provider**. Screenshot and result stay in your account.',
      ],
    },
    never: {
      h: 'What we do NOT do',
      items: [
        'No tracking or advertising SDKs.',
        'No selling your data to anyone beyond the AI provider we need.',
        'No capture without a click from you.',
      ],
    },
    contact: {
      h: 'Deletion & contact',
      p: 'Delete analyses from your dashboard at any time. For any request: [info@akmehub.com](mailto:info@akmehub.com).',
    },
  },

  support: {
    meta: {
      title: 'Support',
      description: 'Support for Foevo and the Chrome extension: answers to the most common questions and a contact form.',
    },
    backHome: '← Foevo',
    title: 'Support',
    sub: 'The questions we get most often come first — the answer is usually here. If you can’t find what you need, write to us with the form at the bottom.',
    faqTitle: 'Frequently asked questions',
    faq: [
      {
        q: 'The extension asks for a permission, or sign-in never completes',
        a: 'Make sure you are on **version 1.2.2 or later**: you’ll find it at the bottom of the extension card on `chrome://extensions`. Earlier versions asked for a runtime permission that interrupted sign-in on the first attempt. The extension is on the [Chrome Web Store](STORE_URL) and updates itself; to force an update go to `chrome://extensions`, turn on developer mode and press **Update**.',
      },
      {
        q: 'The sign-in code never arrives by email',
        a: 'Check your spam folder. You can request a new one after about 30 seconds, and each code stays valid for 10 minutes. If you copy the code from the email, paste it as is: spaces are ignored.',
      },
      {
        q: 'The analysis fails on a very long page',
        a: 'Update the extension to the latest version. Since 1.2.0 the image sent to the model is resized within the supported limits, so the error no longer happens. A safety limit still applies to captures beyond 20,000 pixels of height.',
      },
      {
        q: 'The Analyse button returns a 401 error',
        a: 'Your extension session has expired. Open the extension settings (the gear icon) and sign in again with the emailed code.',
      },
      {
        q: '“Open a web page” when I press Analyse',
        a: 'You are on a page Chrome does not allow capturing: `chrome://…`, a PDF or the Web Store. Open a normal http/https page.',
      },
      {
        q: 'How do I cancel my subscription',
        a: 'From the **Plan** section of your account: the subscription stays active until the end of the period you already paid for, and is then not renewed. Invoices download from the same page.',
      },
      {
        q: 'What data does the extension collect',
        a: 'It captures a screenshot of the active tab only, and only when you press Analyse. The full detail is in the [privacy policy](PRIVACY_URL).',
      },
    ],
    formTitle: 'Write to us',
    formSub: 'We normally reply within one business day. The more detail you give — page, browser, error message — the faster the answer.',
    form: {
      topics: ['Chrome extension', 'Analyses and reports', 'Account and sign-in', 'Payments and invoices', 'Other'],
      name: 'Name',
      email: 'Email',
      topic: 'Topic',
      message: 'Message',
      messagePlaceholder: 'What you were doing, what you expected and what happened. If there is an error message, paste it here.',
      submit: 'Send message',
      submitting: 'Sending…',
      genericError: 'Sending failed. Please try again shortly.',
      sentTitle: 'Message sent.',
      sentBody: 'We’ll reply to the address you gave us, usually within one business day.',
      privacyNote: 'We use your address only to reply to you. See the [privacy policy](PRIVACY_URL).',
    },
    footerPrivacy: 'Privacy',
  },

  review: {
    meta: {
      title: 'Reviewer guide',
      description: 'Step-by-step test instructions for the Chrome Web Store reviewer.',
    },
    kicker: 'Chrome Web Store',
    title: 'Reviewer test guide',
    intro:
      'Foevo turns a page you choose into an attention heatmap plus a conversion analysis. Signing in uses an email code instead of a password, so these steps show how to read that code from a public inbox — no shared mailbox password needed.',
    card: {
      account: 'Test account',
      password: 'Password',
      passwordValue: 'none — email code',
      inbox: 'Code inbox',
      inboxValue: 'mailinator.com (public)',
    },
    steps: [
      {
        t: 'Pin the extension',
        d: 'After installing, click the puzzle-piece icon in Chrome’s toolbar and pin **Foevo** so its icon is visible.',
      },
      {
        t: 'Open the sign-in screen',
        d: 'Click the Foevo icon to open the popup, then click the **gear (settings)** icon in the top-right of the popup.',
      },
      {
        t: 'Enter the test email',
        d: 'In the email field type **ACCOUNT** and click **“Invia codice”** (Send code). Sign-in uses a one-time email code — there is no password.',
      },
      {
        t: 'Read the code from the public inbox',
        d: 'The 6-digit code is delivered to a public inbox you can open without any login: [open the inbox →](INBOX_URL). Open the newest “Foevo” message and copy the code. It is valid for 10 minutes; if it expired, click “Invia codice” again for a fresh one.',
      },
      {
        t: 'Complete sign-in',
        d: 'Paste the 6 digits into the popup and click **“Accedi”** (Sign in). The test account has an active paid plan, so analysis is enabled.',
      },
      {
        t: 'Run an analysis',
        d: 'Open any normal **https** web page (a landing page or product page works best — not a `chrome://` page, PDF, or the Web Store). Click **“Analizza questa pagina”** (Analyze this page). After about a minute a report opens in a new tab with an attention heatmap and conversion analysis.',
      },
    ],
    permissions:
      '**Permissions.** The extension captures a screenshot of the active tab only when you click “Analyse”, and talks only to `foevo.app` — its own service — to return the report. It does not modify pages, inject content, or read browsing history. Full details: [privacy policy](PRIVACY_URL).',
  },

  checkout: {
    failedTitle: 'Payment not completed',
    failedBody: 'The payment was cancelled or did not go through. You can try again whenever you like.',
    retry: 'Try again',
    activeTitle: 'Plan active 🎉',
    activeBody: 'Your payment is confirmed and your **PLAN** plan is active. Enjoy Foevo!',
    toDashboard: 'Go to the dashboard',
    receivedTitle: 'Payment received',
    receivedBody: 'Thank you! We’re activating your plan.',
    activating: 'We’re confirming the payment with Whop… this page refreshes on its own.',
    activatingSlow: 'Activation is taking longer than expected. Refresh shortly: the plan activates as soon as Whop confirms the payment.',
    claimRedirect: 'Taking you to the dashboard…',
    confirmedTitle: 'Payment confirmed',
    confirmedBody: 'Sign in with the same email you paid with: your plan is already active.',
    signIn: 'Sign in to Foevo',
    claiming: 'We’re setting up your account and your plan… it takes a few seconds.',
    claimingSlow: 'Confirmation is taking longer than expected. You’ll be able to sign in with your email shortly.',
    login: 'Sign in',
  },

  affiliates: {
    layout: { brandSuffix: '· Affiliates', backToSite: 'Back to the site →' },

    become: {
      meta: {
        title: 'Become a Foevo affiliate — earn by recommending Foevo',
        description:
          'Promote Foevo with your personal link and earn a recurring commission on every customer you bring, for their first 12 months. Paid by bank transfer.',
      },
      badge: 'Affiliate programme',
      titleA: 'Recommend Foevo.',
      titleB: 'Earn {rate} for {months} months.',
      titleUpTo: 'up to ',
      titleThe: '',
      sub: 'Every customer who subscribes through your link earns you a recurring commission, on each of their renewals, for the first year. Free to join, no strings attached.',
      ctaRegister: 'Become an affiliate',
      ctaLogin: 'I already have an account',
      metricCommission: 'Commission, for {months} months',
      metricThreshold: 'Minimum payout threshold',
      metricPayout: 'Bank transfer',
      metricPayoutLabel: 'instant, how we pay you',
      pointsTitle: 'How the earnings work',
      points: [
        {
          title: 'Recurring earnings',
          body: 'You do not get the commission once: you earn it on every renewal the customer pays, for the first {months} months of their subscription.',
        },
        {
          title: 'A link that is only yours',
          body: 'You get a unique personal link. Anyone who subscribes through it is attributed to you, automatically.',
        },
        {
          title: 'We pay by instant bank transfer',
          body: 'Request a payout whenever you like, from €{min} of available balance. Enter your IBAN and receive an instant transfer.',
        },
        {
          title: 'Everything tracked',
          body: 'Clicks, customers brought, commissions earned and available: you see them in real time from your panel.',
        },
      ],
      ratesTitle: 'What you earn, per plan',
      ratesSub: 'On every payment the customer makes, for their first {months} months.',
      planBase: 'Starter and Base plans',
      planPremium: 'Premium plan',
      rateCaption: 'commission, for {months} months',
      stepsTitle: 'In 4 steps',
      steps: [
        'You sign up and get your personal link.',
        'Share the link wherever you like: social, newsletter, communities, DMs.',
        'Anyone who subscribes through your link earns you {rate} for {months} months.',
        'Once you reach €{min}, request the transfer.',
      ],
      alreadyCustomer:
        'Already a Foevo customer? You can become an affiliate from your account too, in the **“Invite and earn”** section.',
      finalCta: 'Create my affiliate account',
    },

    auth: {
      loginTitle: 'Sign in',
      loginSub: 'Foevo affiliate area.',
      registerTitle: 'Become an affiliate',
      registerSub: 'Promote Foevo and earn a commission on every customer you bring.',
      username: 'Username',
      password: 'Password',
      fullName: 'Full name',
      email: 'Email',
      emailHint: 'We use it to notify you about payouts. It is not public.',
      usernameHint: '3–32 characters: lowercase letters, digits, . _ -',
      passwordHint: 'At least 8 characters.',
      wait: 'Please wait…',
      login: 'Sign in',
      register: 'Create affiliate account',
      loginError: 'Sign-in failed.',
      registerError: 'Registration failed.',
      noAccount: 'Not an affiliate yet?',
      goRegister: 'Sign up',
      hasAccount: 'Already have an account?',
      goLogin: 'Sign in',
    },

    dashboard: {
      greeting: 'Hi',
      sub: 'Your Foevo affiliate panel.',
      logout: 'Sign out',
      linkTitle: 'Your link',
      linkSub: 'Share it anywhere. Every customer who subscribes through this link earns you money.',
      copy: 'Copy',
      copied: 'Copied',
      statClicks: 'Link clicks',
      statCustomers: 'Customers brought',
      statEarned: 'Total earnings',
      statAvailable: 'Available',
      payoutTitle: 'Request a payout',
      payoutAvailable: 'Available',
      payoutPending: 'being processed',
      payoutMin: 'minimum',
      payoutMethod: 'paid by bank transfer.',
      payoutCta: 'Request payout',
      payoutSending: 'Sending…',
      payoutError: 'The request failed.',
      payoutNeedsIban: 'Add your IBAN below first.',
      bankTitle: 'Bank details',
      bankSub: 'Where you’ll receive the transfers. Visible only to you and to our admin team.',
      bankHolder: 'Account holder',
      bankHolderPlaceholder: 'Full name of the account holder',
      bankIban: 'IBAN',
      bankName: 'Bank (optional)',
      bankCountry: 'Country',
      bankSave: 'Save details',
      bankSaving: 'Saving…',
      bankSaved: 'Details saved.',
      bankError: 'Error',
      commissionsTitle: 'Commissions',
      colDate: 'Date',
      colPlan: 'Plan',
      colMonth: 'Month',
      colBase: 'Base',
      colRate: '%',
      colCommission: 'Commission',
      colStatus: 'Status',
      commissionsEmpty: 'No commissions yet. Share your link to get started.',
      payoutsTitle: 'Payout requests',
      colRequested: 'Requested',
      colAmount: 'Amount',
      colProcessed: 'Processed',
      status: {
        available: 'Available',
        paid: 'Paid',
        reversed: 'Reversed',
        requested: 'Being processed',
        rejected: 'Rejected',
      },
    },
  },

  report: {
    meta: {
      titlePrefix: 'Foevo · analysis of',
      fallbackTarget: 'a page',
      description: 'Attention heatmap and AI conversion analysis — Foevo.',
    },
    tagline: '· Attention heatmaps & AI conversion analysis',
    ctaHeader: 'Analyse your page →',
    untitled: 'Analysis',
    priorityCallout: '⚡ Priority actions',
    allRecommendations: 'All recommendations ↓',
    gaugeConversion: 'Conversion',
    gaugeAttention: 'Attention',
    gaugeClarity: 'Clarity',
    gaugeCta: 'CTA',
    viewHeat: 'Heatmap',
    viewFocus: 'Focus',
    viewClean: 'Original',
    hideZones: 'Hide zones',
    showZones: 'Show zones',
    noScreenshot: 'Screenshot unavailable.',
    summary: 'Summary',
    zonesTitle: 'Attention zones',
    zonesSub: '· ranked by impact',
    brand: 'Brand',
    fonts: 'Fonts:',
    tone: 'Tone:',
    ctaTitle: 'Call to action',
    contrast: 'Contrast',
    visibility: 'Visibility',
    copyTitle: 'Copy',
    copyClarity: '· clarity',
    headline: 'Headline:',
    copyIssues: 'Issues',
    copyRewrites: 'Rewrites',
    recommendations: 'Recommendations',
    frictions: 'Conversion frictions',
    footerTitle: 'Want the same analysis on your own pages?',
    footerBody: 'Foevo generates a hybrid attention heatmap (computer vision + AI) and a conversion-oriented analysis, straight from your browser.',
    footerCta: 'Try Foevo from €5/month',
    generatedWith: 'Report generated with',
  },
}
