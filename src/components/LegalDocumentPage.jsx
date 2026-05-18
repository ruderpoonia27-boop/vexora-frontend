import React from 'react';
import { Helmet } from 'react-helmet';
import { Building2, Mail, ScrollText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { COMPANY_NAME, LEGAL_LAST_UPDATED, PLATFORM_NAME, SUPPORT_EMAIL } from '@/data/legalContent';
import { getPlatformName, useSettings } from '@/hooks/useSettings';

const slugify = (value) => String(value || '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/(^-|-$)/g, '');

export const LegalDocumentPage = ({ title, intro, sections }) => {
  const { settings } = useSettings();
  const supportEmail = settings?.contact_email || settings?.contactEmail || SUPPORT_EMAIL;
  const platformName = getPlatformName(settings);
  const displayedIntro = String(intro || '').replaceAll(PLATFORM_NAME, platformName);
  const companyName = COMPANY_NAME.replaceAll(PLATFORM_NAME, platformName);

  return (
    <div className="min-h-[calc(100vh-64px)] bg-background py-8 md:py-12">
      <Helmet>
        <title>{title} | {platformName}</title>
      </Helmet>

      <div className="container mx-auto max-w-6xl px-4">
        <div className="mb-8 rounded-[28px] border border-primary/15 bg-[linear-gradient(180deg,rgba(10,18,36,0.96),rgba(8,13,28,0.92))] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)] md:p-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-primary">
            <ScrollText className="h-3.5 w-3.5" />
            Legal & Policy
          </div>
          <h1 className="mt-4 text-3xl font-black text-foreground md:text-5xl">{title}</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground md:text-base">{displayedIntro}</p>

          <div className="mt-6 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-border/60 bg-background/50 p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Last Updated</p>
              <p className="mt-2 text-sm font-semibold text-foreground">{LEGAL_LAST_UPDATED}</p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-background/50 p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Platform</p>
              <div className="mt-2 flex items-center gap-2 text-sm font-semibold text-foreground">
                <Building2 className="h-4 w-4 text-primary" />
                <span>{companyName}</span>
              </div>
            </div>
            <div className="rounded-2xl border border-border/60 bg-background/50 p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Support</p>
              <div className="mt-2 flex items-center gap-2 text-sm font-semibold text-foreground">
                <Mail className="h-4 w-4 text-primary" />
                <a href={`mailto:${supportEmail}`} className="break-all text-primary hover:text-primary/80">{supportEmail}</a>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
          <aside className="h-fit rounded-[24px] border border-border/60 bg-card/55 p-4 backdrop-blur-xl lg:sticky lg:top-24">
            <p className="px-2 text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">On This Page</p>
            <div className="mt-3 space-y-1">
              {sections.map((section) => (
                <a
                  key={section.title}
                  href={`#${slugify(section.title)}`}
                  className="block rounded-xl px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                >
                  {section.title}
                </a>
              ))}
            </div>
            <div className="mt-4 rounded-2xl border border-primary/15 bg-primary/8 p-3 text-xs leading-6 text-muted-foreground">
              Need help with a policy question? Visit <Link to="/contact-us" className="font-semibold text-primary hover:text-primary/80">Contact Us</Link>.
            </div>
          </aside>

          <div className="space-y-4">
            {sections.map((section, index) => (
              <section
                key={section.title}
                id={slugify(section.title)}
                className="rounded-[24px] border border-border/60 bg-card/50 p-5 shadow-[0_12px_32px_rgba(0,0,0,0.18)] backdrop-blur-xl md:p-6"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-sm font-black text-primary">
                    {index + 1}
                  </div>
                  <h2 className="text-xl font-black text-foreground md:text-2xl">{section.title}</h2>
                </div>
                <div className="mt-4 space-y-3">
                  {section.body.map((paragraph) => (
                    <p key={paragraph} className="text-sm leading-7 text-muted-foreground md:text-[15px]">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LegalDocumentPage;
