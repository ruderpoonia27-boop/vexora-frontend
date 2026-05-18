import React from 'react';
import LegalDocumentPage from '@/components/LegalDocumentPage';
import { PLATFORM_NAME, refundSections } from '@/data/legalContent';

const RefundPolicyPage = () => (
  <LegalDocumentPage
    title="Refund Policy"
    intro={`${PLATFORM_NAME} handles tournament entries, approved deposits, and cancellations with a structured refund process. This page explains when refunds may be allowed, when they are restricted, and how admin review works for payment and tournament reversals.`}
    sections={refundSections}
  />
);

export default RefundPolicyPage;
