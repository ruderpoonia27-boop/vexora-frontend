import React from 'react';
import LegalDocumentPage from '@/components/LegalDocumentPage';
import { PLATFORM_NAME, communitySections } from '@/data/legalContent';

const CommunityGuidelinesPage = () => (
  <LegalDocumentPage
    title="Community Guidelines"
    intro={`${PLATFORM_NAME} wants the platform to feel competitive, safe, and welcoming. These guidelines explain the conduct, naming, communication, and behavior standards expected from all players and community members.`}
    sections={communitySections}
  />
);

export default CommunityGuidelinesPage;
