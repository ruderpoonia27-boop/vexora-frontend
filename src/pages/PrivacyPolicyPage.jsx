import React from 'react';
import LegalDocumentPage from '@/components/LegalDocumentPage';
import { PLATFORM_NAME, privacySections } from '@/data/legalContent';

const PrivacyPolicyPage = () => (
  <LegalDocumentPage
    title="Privacy Policy"
    intro={`${PLATFORM_NAME} values user trust. This Privacy Policy explains what account, tournament, and payment-verification information we collect, how it is used, how it is protected, and what support options users have when they want clarification about their data.`}
    sections={privacySections}
  />
);

export default PrivacyPolicyPage;
