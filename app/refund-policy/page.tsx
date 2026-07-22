import type { Metadata } from "next";
import { EffectiveDate, PolicyContent, PolicySection, SitePageShell, SUPPORT_EMAIL } from "@/components/site-page-shell";

export const metadata: Metadata = { title: "Refund Policy | WorkPilot", description: "WorkPilot subscription and credit-pack refund rules." };

export default function RefundPolicyPage() {
  return (
    <SitePageShell eyebrow="Billing" title="Refund Policy" description="We want billing to be straightforward. Here is when subscriptions and one-time credit purchases may qualify for a refund.">
      <PolicyContent>
        <EffectiveDate />
        <PolicySection title="1. Monthly subscriptions">
          <p>You can cancel a monthly subscription at any time from billing settings. Cancellation stops future renewals and normally takes effect at the end of your current billing period. Fees already paid are generally non-refundable, and we do not provide prorated refunds for unused days or unused plan credits.</p>
          <p><strong>First-purchase guarantee:</strong> You may request a refund of your first paid subscription charge within 7 calendar days of purchase if you have used no more than 10% of the plan’s included monthly credits. Renewals, upgrades, and previously refunded accounts are not eligible for this guarantee.</p>
        </PolicySection>
        <PolicySection title="2. One-time credit packs">
          <p>Credit-pack purchases are final once any purchased credits have been used. An entirely unused credit pack may be refunded if you contact us within 7 calendar days of purchase. Partially used packs are not eligible for partial refunds and credits cannot be exchanged for cash.</p>
        </PolicySection>
        <PolicySection title="3. Billing errors and service failures">
          <p>Please contact us promptly if you were charged more than once for the same purchase, charged after a timely cancellation, or unable to receive purchased credits because of a verified WorkPilot error. When confirmed, we will correct the charge, restore credits, extend access, or issue an appropriate refund.</p>
          <p>Temporary downtime, dissatisfaction with an AI-generated result, failure to cancel before renewal, or unused time or credits do not by themselves qualify for a refund. Your statutory consumer rights, where applicable, are not limited by this policy.</p>
        </PolicySection>
        <PolicySection title="4. How to request a refund">
          <p>Email <a href={`mailto:${SUPPORT_EMAIL}?subject=Refund request`}>{SUPPORT_EMAIL}</a> with the account email, invoice or payment reference, purchase date, and a brief reason. Do not send full card numbers or sensitive payment details. Requests are reviewed against this policy and we may ask for information needed to verify the account and transaction.</p>
        </PolicySection>
        <PolicySection title="5. Processing and chargebacks">
          <p>Approved refunds are returned to the original payment method. Your bank or payment provider controls when the credit appears; this commonly takes 5–10 business days after processing. Before opening a payment dispute, please contact us so we can investigate. Fraudulent or abusive refund requests may result in account restrictions.</p>
        </PolicySection>
      </PolicyContent>
    </SitePageShell>
  );
}
