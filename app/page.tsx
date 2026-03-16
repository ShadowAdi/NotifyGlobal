import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-200">
        <nav className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-foreground rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">N</span>
            </div>
            <span className="text-xl font-semibold text-gray-900">NotifyGlobal</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/sign-in" className="text-gray-600 hover:text-gray-900 transition-colors">Sign In</Link>
            <Link href="/sign-up" className="bg-foreground text-white px-4 py-2 rounded-lg  transition-colors">
              Get Started
            </Link>
          </div>
        </nav>
      </header>

      <main className="mx-auto max-w-7xl px-6">
        <div className="py-20 md:py-32 text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Send Notifications in
            <span className="text-blue-600"> Every Language</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10">
            Write once, deliver everywhere. Send multilingual notifications to your contacts via email—translated automatically into their native language.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/sign-in" className="bg-foreground text-white px-8 py-4 rounded-lg font-medium  transition-colors">
              Sign In
            </Link>
            <Link href="/sign-up" className="border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-lg font-medium hover:border-gray-400 hover:bg-gray-50 transition-colors">
              Sign Up
            </Link>
          </div>
        </div>

        <div className="py-20 border-t border-gray-200">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-16">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-blue-600 text-2xl font-bold">1</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Create Your Project</h3>
              <p className="text-gray-600">
                Set up your workspace and add contacts with their language preferences via CSV or JSON.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-blue-600 text-2xl font-bold">2</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Design Templates</h3>
              <p className="text-gray-600">
                Write your email template once in English with variables like {"{{name}}"} and {"{{event}}."}              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-blue-600 text-2xl font-bold">3</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Send & Translate</h3>
              <p className="text-gray-600">
                Trigger via API or dashboard—each contact receives the message in their native language.
              </p>
            </div>
          </div>
        </div>

        <div className="py-20 border-t border-gray-200">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-16">Why NotifyGlobal?</h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="p-6 border border-gray-200 rounded-xl hover:border-blue-600 transition-colors">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">🌍 Truly Multilingual</h3>
              <p className="text-gray-600">
                Automatic translation powered by Lingo.dev—reach contacts in 50+ languages.
              </p>
            </div>
            <div className="p-6 border border-gray-200 rounded-xl hover:border-blue-600 transition-colors">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">⚡ Developer-Friendly</h3>
              <p className="text-gray-600">
                Simple REST API integration. Send notifications with a single API call.
              </p>
            </div>
            <div className="p-6 border border-gray-200 rounded-xl hover:border-blue-600 transition-colors">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">📧 Email-First Design</h3>
              <p className="text-gray-600">
                Built on Resend for reliable delivery. Optional Discord/Slack webhooks.
              </p>
            </div>
            <div className="p-6 border border-gray-200 rounded-xl hover:border-blue-600 transition-colors">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">🎯 Template Variables</h3>
              <p className="text-gray-600">
                Dynamic content with variables—personalize every message automatically.
              </p>
            </div>
          </div>
        </div>

        <div className="py-20 border-t border-gray-200 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to Go Global?</h2>
          <p className="text-gray-600 mb-8 text-lg">
            Start sending multilingual notifications today.
          </p>
          <a href="#" className="inline-block bg-foreground text-white px-8 py-4 rounded-lg font-medium  transition-colors">
            Get Started Free
          </a>
        </div>
      </main>

      <footer className="border-t border-gray-200 py-8">
        <div className="mx-auto max-w-7xl px-6 text-center text-gray-600">
          <p>&copy; 2026 NotifyGlobal. Built for startup founders.</p>
        </div>
      </footer>
    </div>
  );
}
