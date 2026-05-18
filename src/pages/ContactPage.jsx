import React from 'react';
import LegalDocumentPage from '@/components/LegalDocumentPage';
import { COMPANY_NAME, PLATFORM_NAME, SUPPORT_EMAIL, SUPPORT_WHATSAPP, getContactSections } from '@/data/legalContent';
import { getPlatformName, useSettings } from '@/hooks/useSettings';

const ContactPage = () => {
  const { settings } = useSettings();
  const supportEmail = settings?.contact_email || settings?.contactEmail || SUPPORT_EMAIL;
  const platformName = getPlatformName(settings);
  const companyName = COMPANY_NAME.replaceAll(PLATFORM_NAME, platformName);

  return (
    <LegalDocumentPage
      title="Contact Us"
      intro={`Need help with tournaments, wallet reviews, policy questions, or account access on ${platformName}? Use the support contact below and include enough detail for the team to identify your account and investigate quickly.`}
      sections={getContactSections({
        supportEmail,
        supportWhatsApp: SUPPORT_WHATSAPP,
        companyName
      })}
    />
  );
};

export default ContactPage;
