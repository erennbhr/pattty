export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#0b0b12] text-white px-6 py-24">
      <div className="max-w-3xl mx-auto space-y-8">
        <h1 className="text-4xl font-black">Terms of Use</h1>
        <p className="text-gray-400">Last updated: January 2025</p>

        <Section title="1. Acceptance of Terms">
          By downloading or using the Pattty mobile application, you agree to be
          bound by these Terms of Use. If you do not agree, please do not use the
          application.
        </Section>

        <Section title="2. Description of Service">
          Pattty is a mobile-only pet care application designed to help users
          track pet health, routines, and related information. Pattty does not
          provide veterinary or medical advice.
        </Section>

        <Section title="3. User Responsibilities">
          You are responsible for maintaining the accuracy of information you
          provide and for all activities that occur under your account.
        </Section>

        <Section title="4. No Medical Advice">
          Information provided by Pattty, including AI-generated content, is for
          informational purposes only and should not be considered professional
          veterinary advice.
        </Section>

        <Section title="5. Intellectual Property">
          All content, trademarks, and intellectual property related to Pattty
          are owned by Pattty or its licensors and may not be used without
          permission.
        </Section>

        <Section title="6. Limitation of Liability">
          Pattty shall not be liable for any indirect, incidental, or
          consequential damages arising from the use of the application.
        </Section>

        <Section title="7. Termination">
          We reserve the right to suspend or terminate access to the application
          at any time for violations of these terms.
        </Section>

        <Section title="8. Contact">
          For questions regarding these Terms, please contact us at
          support@pattty.com
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
