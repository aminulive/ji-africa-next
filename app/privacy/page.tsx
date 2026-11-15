export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto pb-16 space-y-6">
      <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm space-y-5">
        <h1 className="text-3xl font-black text-gray-900">Privacy Policy</h1>
        <p className="text-xs text-gray-400 font-semibold">
          Effective Date: November 2026 • Compliant with the Nigeria Data Protection Act (NDPA)
        </p>

        <section className="space-y-2 text-sm text-gray-700 leading-relaxed">
          <h2 className="font-black text-gray-900 text-base">1. Information We Collect</h2>
          <p>
            When you create an account or storefront on ji.africa, we collect your name, email address, phone number, shop address, uploaded listing photos, and device sign-in metadata used to protect your account against unauthorized access.
          </p>
        </section>

        <section className="space-y-2 text-sm text-gray-700 leading-relaxed">
          <h2 className="font-black text-gray-900 text-base">2. How We Use Your Data</h2>
          <p>
            Your public shop profile and contact phone number are displayed on your adverts so prospective buyers can call or message you on WhatsApp. We never sell your personal data to third-party data brokers.
          </p>
        </section>

        <section className="space-y-2 text-sm text-gray-700 leading-relaxed">
          <h2 className="font-black text-gray-900 text-base">3. Security &amp; Account Control</h2>
          <p>
            Passwords are encrypted using bcrypt hashing, media assets are hosted securely on Cloudinary, and new-device login alerts notify you immediately of unfamiliar sign-ins. You may update your profile or request account deletion anytime via support@ji.africa.
          </p>
        </section>
      </div>
    </div>
  );
}
