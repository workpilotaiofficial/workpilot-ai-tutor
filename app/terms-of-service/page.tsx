import type { Metadata } from "next";
import { EffectiveDate, PolicyContent, PolicySection, SitePageShell, SUPPORT_EMAIL } from "@/components/site-page-shell";

export const metadata: Metadata = { title: "Terms of Service | WorkPilot", description: "Terms governing access to and use of WorkPilot." };

export default function TermsPage() {
  return (
    <SitePageShell eyebrow="Legal" title="Terms of Service" description="These terms set the rules for using WorkPilot’s AI study platform, accounts, subscriptions, credits, and generated learning materials.">
      <PolicyContent>
        <EffectiveDate />
        <PolicySection title="1. Agreement to these terms">
          <p>By accessing or using WorkPilot (the “Service”), you agree to these Terms and our <a href="/privacy-policy">Privacy Policy</a>. If you use the Service for a school, company, or other organization, you confirm you have authority to bind that organization. If you do not agree, do not use the Service.</p>
        </PolicySection>
        <PolicySection title="2. Eligibility and accounts">
          <p>You must be at least 13 years old and legally able to enter this agreement. If local law requires parental or guardian consent, you may use the Service only after obtaining it. You are responsible for accurate account information, safeguarding credentials, and all activity under your account. Accounts may not be sold, shared without authorization, or used to evade limits.</p>
        </PolicySection>
        <PolicySection title="3. The Service and AI limitations">
          <p>WorkPilot helps create study materials, analyze syllabi, grade practice work, and provide AI-assisted explanations. Outputs are generated automatically and may contain errors, omissions, or bias. They are learning aids—not professional, academic, legal, medical, or financial advice—and do not guarantee grades, admissions, or other outcomes.</p>
          <p>You must independently review important output and follow your institution’s academic integrity, assessment, and AI-use rules. Do not submit AI-generated work as your own where prohibited.</p>
        </PolicySection>
        <PolicySection title="4. Your content and our license">
          <p>You retain ownership of content you upload or submit and are responsible for having the rights and permissions needed to use it. You grant WorkPilot a limited, non-exclusive, worldwide license to host, copy, transmit, process, adapt, and display your content only as reasonably necessary to operate, secure, and improve the Service and fulfill your requests.</p>
          <p>Subject to third-party rights and applicable law, you may use outputs generated for you. Similar output may be generated for others, and we do not promise that output is unique or eligible for intellectual-property protection.</p>
        </PolicySection>
        <PolicySection title="5. Acceptable use">
          <p>You may not use the Service to:</p>
          <ul>
            <li>break laws, violate another person’s rights, or upload content you are not authorized to use;</li>
            <li>cheat, impersonate someone, facilitate fraud, or bypass academic or assessment controls;</li>
            <li>upload malware, disrupt the Service, probe security, scrape at scale, or reverse engineer protected systems;</li>
            <li>evade usage, credit, access, or rate limits; resell access without written permission; or misuse automated access;</li>
            <li>generate or distribute content that exploits children or promotes violence, harassment, or unlawful discrimination.</li>
          </ul>
        </PolicySection>
        <PolicySection title="6. Plans, credits, and payment">
          <p>Paid plans renew monthly unless cancelled. Prices, taxes, included credits, and plan features are shown at checkout. You authorize our payment processor to charge the selected payment method. Subscription and purchased credits are a limited right to use Service features, have no cash value, cannot be transferred, and may expire or reset as disclosed with the applicable plan or pack.</p>
          <p>We may change prices or plan features prospectively with reasonable notice. Refund eligibility is governed by our <a href="/refund-policy">Refund Policy</a>.</p>
        </PolicySection>
        <PolicySection title="7. Cancellation, suspension, and termination">
          <p>You may cancel a subscription through billing settings. Cancellation takes effect at the end of the current paid period unless stated otherwise; you retain access until then. We may restrict or terminate access for breach, security risk, fraud, nonpayment, legal requirements, or material harm to the Service or others. You may stop using the Service at any time.</p>
        </PolicySection>
        <PolicySection title="8. Third-party services">
          <p>The Service relies on third parties such as authentication, payment, hosting, analytics, and AI providers. Their products may be governed by separate terms. WorkPilot is not responsible for third-party services outside our control.</p>
        </PolicySection>
        <PolicySection title="9. Intellectual property">
          <p>The Service, including its software, design, branding, and documentation, belongs to WorkPilot or its licensors. Except for the limited right to use the Service under these Terms, no rights are transferred to you. Feedback you provide may be used without restriction or compensation.</p>
        </PolicySection>
        <PolicySection title="10. Disclaimers and limitation of liability">
          <p>To the fullest extent permitted by law, the Service is provided “as is” and “as available” without warranties of accuracy, availability, fitness for a particular purpose, or non-infringement. WorkPilot is not liable for indirect, incidental, special, consequential, exemplary, or punitive damages, loss of data, grades, profits, or opportunities.</p>
          <p>To the fullest extent permitted by law, WorkPilot’s total liability arising from the Service will not exceed the amount you paid WorkPilot during the 12 months before the event giving rise to the claim. Nothing in these Terms excludes liability that cannot legally be excluded.</p>
        </PolicySection>
        <PolicySection title="11. General terms">
          <p>If any provision is unenforceable, the remaining provisions continue in effect. A failure to enforce a provision is not a waiver. You may not transfer these Terms without our consent; we may transfer them in connection with a reorganization or sale. Events outside reasonable control may affect Service availability.</p>
          <p>We may update these Terms. Material changes will apply prospectively after reasonable notice. Continued use after the effective date means you accept the revised Terms.</p>
        </PolicySection>
        <PolicySection title="12. Contact">
          <p>Questions about these Terms can be sent to <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> or through our <a href="/contact">Contact Us page</a>.</p>
        </PolicySection>
      </PolicyContent>
    </SitePageShell>
  );
}
