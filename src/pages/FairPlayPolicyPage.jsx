import React from 'react';
import LegalDocumentPage from '@/components/LegalDocumentPage';
import { PLATFORM_NAME, fairPlaySections } from '@/data/legalContent';

const FairPlayPolicyPage = () => (
  <LegalDocumentPage
    title="Fair Play Policy"
    intro={`${PLATFORM_NAME} is built around competitive integrity. This policy defines the anti-cheat, anti-abuse, referral, and gameplay standards expected from every player across solo matches, squad tournaments, and reward systems.`}
    sections={fairPlaySections}
  />
);

export default FairPlayPolicyPage;
