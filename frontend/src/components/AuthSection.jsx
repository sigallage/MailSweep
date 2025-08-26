import { useState } from 'react'
import { LogIn, KeyRound, CheckCircle, AlertCircle, Shield } from 'lucide-react'
import axios from 'axios'

const API_BASE = 'http://localhost:3000'

export default function AuthSection({ onAuthSuccess, authStatus, setAuthStatus }) {
  const [showCodeInput, setShowCodeInput] = useState(false)
  const [authCode, setAuthCode] = useState('')
  const [loading, setLoading] = useState(false)

  const handleAuth = async () => {
    setLoading(true)
    try {
      const response = await axios.get(`${API_BASE}/auth`)
      window.open(response.data.authUrl, '_blank')
      setShowCodeInput(true)
      setAuthStatus('Please authorize the application and paste the code below.')
    } catch (error) {
      console.error('Auth error:', error)
      setAuthStatus('Failed to start authentication process.')
    }
    setLoading(false)
  }

  const handleCodeSubmit = async () => {
    if (!authCode.trim()) {
      setAuthStatus('Please enter the authorization code.')
      return
    }

    setLoading(true)
    try {
      const response = await axios.post(`${API_BASE}/auth/callback`, {
        code: authCode.trim()
      })

      if (response.data.success) {
        setAuthStatus('Authentication successful! Loading your emails...')
        setTimeout(() => {
          onAuthSuccess()
        }, 1000)
      } else {
        setAuthStatus('Authentication failed. Please try again.')
      }
    } catch (error) {
      console.error('Code submission error:', error)
      if (error.response && error.response.status === 500) {
        setAuthStatus('Authentication failed. The authorization code may have expired or already been used. Please try the process again.')
      } else {
        setAuthStatus('Failed to authenticate. Please try again.')
      }
    }
    setLoading(false)
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleCodeSubmit()
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="card">
        <div className="text-center mb-6">
          <LogIn className="w-12 h-12 text-accent mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Connect Your Gmail</h2>
          <p className="text-secondary">
            Securely connect your Gmail account to start managing your emails
          </p>
        </div>

        {!showCodeInput ? (
          <div className="space-y-4">
            <button
              onClick={handleAuth}
              disabled={loading}
              className="btn btn-primary w-full flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                  Connecting...
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  Connect Gmail Account
                </>
              )}
            </button>
            
            <div className="text-xs text-muted text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Shield className="w-3 h-3" />
                <span>Secure OAuth 2.0 authentication</span>
              </div>
              <p>We only request minimal permissions to read and delete emails</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label htmlFor="authCode" className="block text-sm font-medium mb-2">
                <KeyRound className="w-4 h-4 inline mr-1" />
                Authorization Code
              </label>
              <input
                id="authCode"
                type="text"
                value={authCode}
                onChange={(e) => setAuthCode(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Paste the authorization code here"
                className="input w-full"
                disabled={loading}
              />
            </div>
            
            <button
              onClick={handleCodeSubmit}
              disabled={loading || !authCode.trim()}
              className="btn btn-primary w-full flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                  Authenticating...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Submit Code
                </>
              )}
            </button>
          </div>
        )}

        {authStatus && (
          <div className={`status ${
            authStatus.includes('successful') || authStatus.includes('Loading') 
              ? 'status-success' 
              : authStatus.includes('Failed') || authStatus.includes('failed')
              ? 'status-error'
              : 'status-warning'
          }`}>
            <div className="flex items-center gap-2">
              {authStatus.includes('successful') || authStatus.includes('Loading') ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <AlertCircle className="w-4 h-4" />
              )}
              <span>{authStatus}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
