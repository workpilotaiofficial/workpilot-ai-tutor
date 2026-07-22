import type { Metadata } from "next";
import { EffectiveDate, PolicyContent, PolicySection, SitePageShell, SUPPORT_EMAIL } from "@/components/site-page-shell";

export const metadata: Metadata = { title: "Privacy Policy | WorkPilot", description: "How WorkPilot collects, uses, and protects personal information." };

export default function PrivacyPolicyPage() {
  return (
    <SitePageShell eyebrow="Legal" title="Privacy Policy" description="This policy explains what information WorkPilot handles when you use our AI-powered study tools and how you can exercise your privacy choices.">
      <PolicyContent>
        <EffectiveDate />
        <PolicySection title="1. Scope and who we are">
          <p>WorkPilot provides AI-assisted study sets, quizzes, notes, syllabus analysis, paper grading, tutoring experiences, and related account and billing features. This policy applies to our website, dashboard, and services (collectively, the “Service”).</p>
        </PolicySection>
        <PolicySection title="2. Information we collect">
          <ul>
            <li><strong>Account information:</strong> name, email address, profile photo, authentication identifiers, account role, and sign-in provider details.</li>
            <li><strong>Study content:</strong> documents, text, syllabi, assignments, rubrics, notes, prompts, and other material you upload or submit, plus AI-generated outputs.</li>
            <li><strong>Learning preferences:</strong> education stage, goals, preferred tone, study pace, formats, and instructions you choose to provide for personalized AI.</li>
            <li><strong>Billing information:</strong> subscription status, plan, credit balance, transaction and invoice details. Payment card details are processed by Stripe and are not stored by WorkPilot.</li>
            <li><strong>Technical and usage data:</strong> IP address, browser and device information, timestamps, feature interactions, error data, and diagnostic logs.</li>
            <li><strong>Communications:</strong> messages and information you send when requesting support or contacting us.</li>
          </ul>
        </PolicySection>
        <PolicySection title="3. How we use information">
          <p>We use information to provide and secure accounts; process and generate study content; personalize learning experiences; manage credits, subscriptions, and payments; troubleshoot and improve the Service; communicate about support and service changes; prevent fraud and abuse; and meet legal obligations.</p>
          <p>Where applicable, we rely on performance of our contract, legitimate interests, consent, and compliance with law as our legal bases.</p>
        </PolicySection>
        <PolicySection title="4. AI processing and uploaded content">
          <p>Your prompts and uploaded study content are sent to our backend and may be processed by contracted cloud and AI providers solely to operate the requested features. Do not upload information you lack permission to use, highly sensitive personal data, or confidential records that are unnecessary for your study task.</p>
          <p>AI output may be inaccurate. WorkPilot does not use AI output to make decisions with legal or similarly significant effects about you.</p>
        </PolicySection>
        <PolicySection title="5. Local storage, cookies, and analytics">
          <p>We use browser storage to maintain authentication state, preferences, theme settings, and device-level caches of study-set, syllabus, and grading results. Clearing browser data may remove locally cached information. We also use essential cookies or similar technologies and privacy-conscious product analytics, including Vercel Analytics, to understand performance and usage.</p>
        </PolicySection>
        <PolicySection title="6. When we share information">
          <p>We may share information with vendors that help provide authentication, hosting, data storage, AI processing, analytics, customer support, and payment processing (including Firebase, Stripe, and relevant infrastructure providers). We may also disclose information when legally required, to protect rights and safety, during a business transaction, or with your direction. We do not sell personal information for money.</p>
        </PolicySection>
        <PolicySection title="7. Retention and security">
          <p>We keep personal information only as long as reasonably needed for the purposes described above, including providing the Service, resolving disputes, preventing abuse, and satisfying legal, tax, and accounting duties. Retention periods vary by data type. We use reasonable administrative, technical, and organizational safeguards, but no system is completely secure.</p>
        </PolicySection>
        <PolicySection title="8. Your choices and rights">
          <p>Depending on your location, you may request access, correction, deletion, portability, restriction, or objection, or withdraw consent. You may update some profile and personalization details in settings, cancel a subscription through billing settings, and clear locally cached data through your browser.</p>
          <p>To submit a privacy request, email <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>. We may need to verify your identity before completing a request.</p>
        </PolicySection>
        <PolicySection title="9. Children’s privacy and international use">
          <p>The Service is not directed to children under 13, and we do not knowingly collect their personal information. Users who have not reached the age of digital consent in their country should use the Service only with authorization from a parent, guardian, school, or other responsible organization.</p>
          <p>Your information may be processed in countries other than your own. Where required, we use appropriate safeguards for international transfers.</p>
        </PolicySection>
        <PolicySection title="10. Changes and contact">
          <p>We may update this policy as the Service or law changes. We will post the revised version here and update the effective date, and provide additional notice when required. Questions may be sent to <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> or through our <a href="/contact">Contact Us page</a>.</p>
        </PolicySection>
      </PolicyContent>
    </SitePageShell>
  );
}
