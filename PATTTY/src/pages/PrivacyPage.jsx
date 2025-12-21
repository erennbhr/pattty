export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#0b0b12] text-white px-6 py-24">
      <div className="max-w-3xl mx-auto space-y-8">
        <h1 className="text-4xl font-black">Privacy Policy</h1>
        <p className="text-gray-400">Last updated: January 2025</p>

        <Section title="1. Information We Collect">
          We may collect information you provide directly, such as pet details,
          usage data, and optional account information.
        </Section>

        <Section title="2. How We Use Information">
          Information is used to operate and improve the Pattty application,
          personalize your experience, and ensure platform security.
        </Section>

        <Section title="3. Data Storage">
          Data is securely stored using modern cloud infrastructure. We take
          reasonable measures to protect your information.
        </Section>

        <Section title="4. Data Sharing">
          Pattty does not sell or rent your personal data. Information is shared
          only when required to operate core services or comply with legal
          obligations.
        </Section>

        <Section title="5. Third-Party Services">
          The app may integrate third-party services such as analytics or cloud
          storage providers, which operate under their own privacy policies.
        </Section>

        <Section title="6. Children’s Privacy">
          Pattty is not intended for use by children under the age of 13. We do
          not knowingly collect personal data from children.
        </Section>

        <Section title="7. Changes to This Policy">
          We may update this Privacy Policy from time to time. Changes will be
          posted on this page.
        </Section>

        <Section title="8. Contact">
          For privacy-related questions, contact us at privacy@pattty.com
        </Section>
      </div>
    </div>
  );
}

const Section = ({ title, children }) => (
  <div className="space-y-3">
    <h2 className="text-xl font-semibold">{title}</h2>
    <p className="text-gray-400 leading-relaxed">{children}</p>
  </div>
);
