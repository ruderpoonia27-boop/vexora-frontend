import React from 'react';
import LegalDocumentPage from '@/components/LegalDocumentPage';
import { PLATFORM_NAME, termsSections } from '@/data/legalContent';

const TermsPage = () => (
  <LegalDocumentPage
    title="Terms & Conditions"
    intro={`${PLATFORM_NAME} operates competitive esports tournaments, wallet flows, referral rewards, and admin-reviewed payouts. These terms explain the core rules for account use, tournament entry, payments, rewards, abuse prevention, and platform enforcement.`}
    sections={termsSections}
  />
);

export default TermsPage;
