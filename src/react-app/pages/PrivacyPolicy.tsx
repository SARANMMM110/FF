export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-black dark:to-gray-800">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-[#E50914] via-[#FF6B6B] to-[#FFD400] bg-clip-text text-transparent">
            Privacy Policy
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Last updated: December 2024
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-lg dark:prose-invert max-w-none">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-800 mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Introduction</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              FocusFlow ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our productivity application.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-800 mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Information We Collect</h2>
            
            <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white mt-6">Account Information</h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              When you create an account, we collect:
            </p>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2">
              <li>Email address (via Google OAuth)</li>
              <li>Google profile information (name, profile picture)</li>
              <li>Account creation and last login timestamps</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white mt-6">Google Calendar Data</h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              If you choose to connect your Google Calendar, we access:
            </p>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2">
              <li>Read-only access to your calendar events</li>
              <li>Event titles, dates, times, and descriptions</li>
              <li>Event attendees and locations</li>
            </ul>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mt-4">
              <strong>Important:</strong> We only read your calendar data to display upcoming events in your dashboard. We never modify, delete, or share your calendar events with third parties.
            </p>

            <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white mt-6">Usage Data</h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              We collect information about how you use FocusFlow:
            </p>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2">
              <li>Tasks you create and complete</li>
              <li>Focus session durations and timestamps</li>
              <li>Timer settings and preferences</li>
              <li>App feature usage patterns</li>
            </ul>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-800 mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">How We Use Your Information</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              We use the information we collect to:
            </p>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2">
              <li>Provide and maintain our service</li>
              <li>Display your upcoming calendar events in the dashboard</li>
              <li>Track your productivity metrics and progress</li>
              <li>Personalize your experience</li>
              <li>Send important service updates and notifications</li>
              <li>Improve and optimize our application</li>
              <li>Ensure security and prevent fraud</li>
            </ul>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-800 mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Google API Services User Data Policy</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              FocusFlow's use of information received from Google APIs adheres to the{' '}
              <a 
                href="https://developers.google.com/terms/api-services-user-data-policy" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[#E50914] hover:underline font-semibold"
              >
                Google API Services User Data Policy
              </a>
              , including the Limited Use requirements.
            </p>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              We will only use access to read data from your Google Calendar to provide features within FocusFlow. We will not transfer this data to others unless necessary to provide and improve FocusFlow's features, comply with applicable law, or as part of a merger, acquisition, or sale of assets. We will not use this data for serving advertisements.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-800 mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Data Sharing and Disclosure</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:
            </p>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2">
              <li><strong>Service Providers:</strong> We may share data with trusted service providers who help us operate our application (e.g., Cloudflare for hosting)</li>
              <li><strong>Legal Requirements:</strong> We may disclose information if required by law or in response to valid legal requests</li>
              <li><strong>Business Transfers:</strong> In the event of a merger, acquisition, or sale of assets, your information may be transferred</li>
              <li><strong>With Your Consent:</strong> We may share information with third parties when you explicitly consent</li>
            </ul>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-800 mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Data Security</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              We implement appropriate technical and organizational security measures to protect your personal information:
            </p>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2">
              <li>Encryption of data in transit using HTTPS/TLS</li>
              <li>Secure OAuth 2.0 authentication via Google</li>
              <li>Regular security assessments and updates</li>
              <li>Access controls and authentication requirements</li>
              <li>Secure data storage with Cloudflare infrastructure</li>
            </ul>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mt-4">
              However, no method of transmission over the Internet or electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your information, we cannot guarantee absolute security.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-800 mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Your Rights and Choices</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              You have the following rights regarding your personal information:
            </p>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2">
              <li><strong>Access:</strong> You can view your personal information in your account settings</li>
              <li><strong>Update:</strong> You can update your account information at any time</li>
              <li><strong>Delete:</strong> You can request deletion of your account and all associated data</li>
              <li><strong>Revoke Calendar Access:</strong> You can disconnect your Google Calendar at any time in Settings</li>
              <li><strong>Export:</strong> You can request a copy of your data</li>
              <li><strong>Opt-out:</strong> You can opt out of non-essential communications</li>
            </ul>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-800 mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Data Retention</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              We retain your personal information only for as long as necessary to provide our services and fulfill the purposes outlined in this Privacy Policy. When you delete your account, we will delete or anonymize your personal information within 30 days, except where we are required to retain it for legal or regulatory purposes.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-800 mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Third-Party Services</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              FocusFlow integrates with the following third-party services:
            </p>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2">
              <li><strong>Google OAuth & Calendar API:</strong> For authentication and calendar integration</li>
              <li><strong>Cloudflare:</strong> For hosting and infrastructure</li>
            </ul>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mt-4">
              These services have their own privacy policies. We encourage you to review their policies to understand how they handle your data.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-800 mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Children's Privacy</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              FocusFlow is not intended for use by children under the age of 13. We do not knowingly collect personal information from children under 13. If you believe we have collected information from a child under 13, please contact us immediately.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-800 mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Changes to This Privacy Policy</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date. You are advised to review this Privacy Policy periodically for any changes. Changes to this Privacy Policy are effective when posted on this page.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-800">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Contact Us</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              If you have any questions about this Privacy Policy or our data practices, please contact us:
            </p>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <p className="text-gray-700 dark:text-gray-300">
                <strong>Email:</strong>{' '}
                <a href="mailto:privacy@focusflow.app" className="text-[#E50914] hover:underline">
                  privacy@focusflow.app
                </a>
              </p>
              <p className="text-gray-700 dark:text-gray-300 mt-2">
                <strong>Website:</strong>{' '}
                <a href="https://focusflow.app" className="text-[#E50914] hover:underline" target="_blank" rel="noopener noreferrer">
                  https://focusflow.app
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800">
          <p className="text-center text-gray-500 dark:text-gray-400 text-sm">
            © 2024 FocusFlow. All rights reserved.
          </p>
        </div>
      </div>

      {/* Custom Styles */}
      <style>{`
        .prose h2 {
          margin-top: 0;
        }
        
        .prose h3 {
          margin-bottom: 0.5rem;
        }
        
        .prose ul {
          margin-top: 0.5rem;
        }
        
        .prose a {
          text-decoration: none;
        }
        
        .prose a:hover {
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
}
