import { useState, useEffect } from 'react'
import { RefreshCw, Trash2, Mail, User, Calendar, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import axios from 'axios'

const API_BASE = 'http://localhost:3000'

export default function EmailManager() {
  const [senders, setSenders] = useState([])
  const [selectedSenders, setSelectedSenders] = useState(new Set())
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [status, setStatus] = useState('')

  const loadEmails = async () => {
    setLoading(true)
    setStatus('')
    try {
      const response = await axios.get(`${API_BASE}/emails/senders`)
      setSenders(response.data)
      setSelectedSenders(new Set())
      if (response.data.length === 0) {
        setStatus('No emails found in your account.')
      }
    } catch (error) {
      console.error('Error loading emails:', error)
      setStatus('Failed to load emails. Please try again.')
    }
    setLoading(false)
  }

  const toggleSender = (email) => {
    const newSelected = new Set(selectedSenders)
    if (newSelected.has(email)) {
      newSelected.delete(email)
    } else {
      newSelected.add(email)
    }
    setSelectedSenders(newSelected)
  }

  const deleteSelectedEmails = async () => {
    if (selectedSenders.size === 0) return

    const selectedSendersList = Array.from(selectedSenders)
    const totalEmails = selectedSendersList.reduce((total, email) => {
      const sender = senders.find(s => s.email === email)
      return total + (sender ? sender.count : 0)
    }, 0)

    const confirmed = window.confirm(
      `Are you sure you want to delete ${totalEmails} emails from ${selectedSendersList.length} sender(s)?\n\nThis action cannot be undone!`
    )

    if (!confirmed) return

    setDeleting(true)
    setStatus('')

    try {
      // Collect all message IDs to delete
      const messageIds = []
      selectedSendersList.forEach(email => {
        const sender = senders.find(s => s.email === email)
        if (sender) {
          messageIds.push(...sender.messageIds.map(msg => msg.id))
        }
      })

      const response = await axios.post(`${API_BASE}/emails/delete`, {
        messageIds
      })

      if (response.data.success) {
        setStatus(`Successfully deleted ${totalEmails} emails!`)
        // Remove deleted senders from the list
        setSenders(prev => prev.filter(sender => !selectedSenders.has(sender.email)))
        setSelectedSenders(new Set())
      } else {
        setStatus('Failed to delete emails: ' + response.data.error)
      }
    } catch (error) {
      console.error('Delete error:', error)
      setStatus('Failed to delete emails. Please try again.')
    }
    setDeleting(false)
  }

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
    } catch {
      return dateString
    }
  }

  const selectedCount = selectedSenders.size
  const totalSelectedEmails = Array.from(selectedSenders).reduce((total, email) => {
    const sender = senders.find(s => s.email === email)
    return total + (sender ? sender.count : 0)
  }, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Email Management</h2>
          <p className="text-secondary">Select senders and delete all their emails</p>
        </div>
        <button
          onClick={loadEmails}
          disabled={loading}
          className="btn btn-secondary flex items-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4" />
              Load Emails
            </>
          )}
        </button>
      </div>

      {/* Status */}
      {status && (
        <div className={`status ${
          status.includes('Successfully') ? 'status-success' : 
          status.includes('Failed') || status.includes('failed') ? 'status-error' : 
          'status-warning'
        }`}>
          <div className="flex items-center gap-2">
            {status.includes('Successfully') ? (
              <CheckCircle className="w-4 h-4" />
            ) : (
              <AlertCircle className="w-4 h-4" />
            )}
            <span>{status}</span>
          </div>
        </div>
      )}

      {/* Delete Section */}
      {senders.length > 0 && (
        <div className="card">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="font-semibold">
                {selectedCount > 0 ? (
                  <>Selected: {selectedCount} sender{selectedCount > 1 ? 's' : ''} ({totalSelectedEmails} emails)</>
                ) : (
                  'No senders selected'
                )}
              </p>
              <p className="text-secondary text-sm">
                {selectedCount > 0 ? 'Ready to delete selected emails' : 'Select senders to delete their emails'}
              </p>
            </div>
            <button
              onClick={deleteSelectedEmails}
              disabled={selectedCount === 0 || deleting}
              className="btn btn-danger flex items-center gap-2"
            >
              {deleting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  Delete Selected ({totalSelectedEmails})
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Senders List */}
      {loading && (
        <div className="text-center py-8">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-accent" />
          <p className="text-secondary">Loading your emails...</p>
        </div>
      )}

      {!loading && senders.length === 0 && (
        <div className="text-center py-8">
          <Mail className="w-12 h-12 mx-auto mb-4 text-muted" />
          <p className="text-secondary">No emails loaded. Click "Load Emails" to get started.</p>
        </div>
      )}

      {!loading && senders.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Emails by Sender ({senders.length} senders)</h3>
          
          <div className="space-y-3">
            {senders.map((sender) => (
              <div
                key={sender.email}
                className={`card transition-all cursor-pointer ${
                  selectedSenders.has(sender.email) ? 'ring-2 ring-accent bg-tertiary' : 'hover:bg-tertiary'
                }`}
                onClick={() => toggleSender(sender.email)}
              >
                <div className="flex items-start gap-4">
                  <input
                    type="checkbox"
                    checked={selectedSenders.has(sender.email)}
                    onChange={() => toggleSender(sender.email)}
                    className="mt-1 w-4 h-4 text-accent rounded border-secondary focus:ring-accent"
                  />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-accent" />
                        <h4 className="font-semibold truncate">{sender.sender}</h4>
                      </div>
                      <span className="bg-accent text-white text-xs px-2 py-1 rounded-full font-semibold">
                        {sender.count} emails
                      </span>
                    </div>
                    
                    <p className="text-secondary text-sm mb-3">{sender.email}</p>
                    
                    {/* Email Preview */}
                    <div className="space-y-2">
                      {sender.messageIds.slice(0, 3).map((msg, index) => (
                        <div key={msg.id} className="bg-secondary rounded p-2 text-sm">
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-medium truncate flex-1">{msg.subject || 'No Subject'}</span>
                            <div className="flex items-center gap-1 text-muted text-xs">
                              <Calendar className="w-3 h-3" />
                              <span>{formatDate(msg.date)}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {sender.messageIds.length > 3 && (
                        <div className="text-center text-sm text-muted">
                          ... and {sender.messageIds.length - 3} more emails
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
