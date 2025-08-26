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
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="p-4 bg-gradient-to-br from-accent to-accent-secondary rounded-2xl shadow-lg">
              <Mail className="w-10 h-10 text-white" />
            </div>
            <div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                MailSweeper
              </h1>
              <div className="h-1 w-32 bg-gradient-to-r from-accent to-accent-secondary rounded-full mx-auto mt-2"></div>
            </div>
          </div>
          <p className="text-secondary text-lg max-w-2xl mx-auto leading-relaxed">
            Professional email management solution. Efficiently organize and delete emails from specific senders with enterprise-grade security.
          </p>
        </header>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="card text-center group">
            <div className="p-3 bg-gradient-to-br from-accent to-accent-secondary rounded-xl inline-block mb-4 group-hover:scale-110 transition-transform duration-300">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h3 className="font-semibold mb-3 text-lg">Enterprise Security</h3>
            <p className="text-secondary text-sm leading-relaxed">OAuth 2.0 authentication with Google's enterprise-grade security protocols</p>
          </div>
          <div className="card text-center group">
            <div className="p-3 bg-gradient-to-br from-accent to-accent-secondary rounded-xl inline-block mb-4 group-hover:scale-110 transition-transform duration-300">
              <Users className="w-8 h-8 text-white" />
            </div>
            <h3 className="font-semibold mb-3 text-lg">Smart Organization</h3>
            <p className="text-secondary text-sm leading-relaxed">Intelligent email grouping by sender with advanced filtering capabilities</p>
          </div>
          <div className="card text-center group">
            <div className="p-3 bg-gradient-to-br from-accent to-accent-secondary rounded-xl inline-block mb-4 group-hover:scale-110 transition-transform duration-300">
              <Trash2 className="w-8 h-8 text-white" />
            </div>
            <h3 className="font-semibold mb-3 text-lg">Bulk Operations</h3>
            <p className="text-secondary text-sm leading-relaxed">Efficient mass deletion with comprehensive safety confirmations</p>
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
          <EmailManager onAuthError={() => setIsAuthenticated(false)} />
        )}

        {/* Footer */}
        <footer className="text-center mt-16 pt-8 border-t border-secondary">
          <div className="bg-warning/10 border border-warning/20 rounded-lg p-4 mb-4 max-w-2xl mx-auto">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-warning" />
              <strong className="text-warning">Important Notice</strong>
            </div>
            <p className="text-secondary text-sm">
              This application permanently deletes emails from your Gmail account. Use with caution.
            </p>
          </div>
          <p className="text-muted text-xs">
            Built with React + Vite • Powered by Gmail API
          </p>
        </footer>
      </div>
    </div>
  )
}

export default App
