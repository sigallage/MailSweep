import { useState } from 'react'
import { Mail, Trash2, Users, Shield, Loader2 } from 'lucide-react'
import AuthSection from './components/AuthSection'
import EmailManager from './components/EmailManager'
import './App.css'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [authStatus, setAuthStatus] = useState('')

  return (
    <div className="min-h-screen bg-primary">
      <div className="container">
        {/* Header */}
        <header className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-accent rounded-xl">
              <Mail className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-primary">MailPurge</h1>
          </div>
          <p className="text-secondary text-lg max-w-2xl mx-auto">
            Clean up your inbox efficiently. Delete all emails from specific senders with just one click.
          </p>
        </header>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="card text-center">
            <Shield className="w-8 h-8 text-accent mx-auto mb-3" />
            <h3 className="font-semibold mb-2">Secure</h3>
            <p className="text-secondary text-sm">OAuth 2.0 authentication with Google</p>
          </div>
          <div className="card text-center">
            <Users className="w-8 h-8 text-accent mx-auto mb-3" />
            <h3 className="font-semibold mb-2">Organized</h3>
            <p className="text-secondary text-sm">View emails grouped by sender</p>
          </div>
          <div className="card text-center">
            <Trash2 className="w-8 h-8 text-accent mx-auto mb-3" />
            <h3 className="font-semibold mb-2">Efficient</h3>
            <p className="text-secondary text-sm">Bulk delete emails instantly</p>
          </div>
        </div>

        {/* Main Content */}
        {!isAuthenticated ? (
          <AuthSection 
            onAuthSuccess={() => setIsAuthenticated(true)}
            authStatus={authStatus}
            setAuthStatus={setAuthStatus}
          />
        ) : (
          <EmailManager />
        )}

        {/* Footer */}
        <footer className="text-center mt-16 pt-8 border-t border-secondary">
          <p className="text-muted text-sm">
            ⚠️ <strong>Warning:</strong> This application permanently deletes emails from your Gmail account. Use with caution.
          </p>
          <p className="text-muted text-xs mt-2">
            Built with React + Vite • Powered by Gmail API
          </p>
        </footer>
      </div>
    </div>
  )
}

export default App
