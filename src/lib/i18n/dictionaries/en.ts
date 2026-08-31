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
      ctaPrimary: 'Get started — from €19/month',
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
      title: 'Two plans, no surprises',
      sub: 'Prices exclude VAT: the tax for your country is calculated at checkout.',
      featuredBadge: 'Most chosen by people working with clients',
      perMonth: '+ VAT / month',
      plans: [
        {
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
      note: 'From €19/month + VAT · cancel anytime',
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
}
