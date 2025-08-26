class EmailDeleter {
    constructor() {
        this.selectedSenders = new Set();
        this.senders = [];
        this.isAuthenticated = false;
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Authentication
        document.getElementById('auth-btn').addEventListener('click', () => this.authenticate());
        document.getElementById('submit-code-btn').addEventListener('click', () => this.submitAuthCode());
        
        // Email operations
        document.getElementById('load-emails-btn').addEventListener('click', () => this.loadEmails());
        document.getElementById('delete-selected-btn').addEventListener('click', () => this.deleteSelectedEmails());
        
        // Handle Enter key in auth code input
        document.getElementById('auth-code').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.submitAuthCode();
        });
    }

    async authenticate() {
        try {
            const response = await fetch('/auth');
            const data = await response.json();
            
            // Open authorization URL in new window
            window.open(data.authUrl, '_blank');
            
            // Show code input section
            document.getElementById('code-section').classList.remove('hidden');
            this.showStatus('auth-status', 'Please authorize the application and paste the code below.', 'success');
        } catch (error) {
            console.error('Authentication error:', error);
            this.showStatus('auth-status', 'Failed to start authentication process.', 'error');
        }
    }

    async submitAuthCode() {
        const code = document.getElementById('auth-code').value.trim();
        
        if (!code) {
            this.showStatus('auth-status', 'Please enter the authorization code.', 'error');
            return;
        }

        try {
            const response = await fetch('/auth/callback', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ code })
            });

            const data = await response.json();
            
            if (data.success) {
                this.isAuthenticated = true;
                this.showStatus('auth-status', 'Authentication successful! You can now load your emails.', 'success');
                document.getElementById('emails-section').classList.remove('hidden');
                document.getElementById('code-section').classList.add('hidden');
            } else {
                this.showStatus('auth-status', 'Authentication failed. Please try again.', 'error');
            }
        } catch (error) {
            console.error('Code submission error:', error);
            this.showStatus('auth-status', 'Failed to authenticate. Please try again.', 'error');
        }
    }

    async loadEmails() {
        if (!this.isAuthenticated) {
            alert('Please authenticate first.');
            return;
        }

        const loadBtn = document.getElementById('load-emails-btn');
        const loading = document.getElementById('loading');
        
        loadBtn.disabled = true;
        loading.classList.remove('hidden');

        try {
            const response = await fetch('/emails/senders');
            const senders = await response.json();
            
            this.senders = senders;
            this.renderSenders(senders);
            
            if (senders.length > 0) {
                document.getElementById('delete-section').classList.remove('hidden');
            }
        } catch (error) {
            console.error('Error loading emails:', error);
            alert('Failed to load emails. Please try again.');
        } finally {
            loadBtn.disabled = false;
            loading.classList.add('hidden');
        }
    }

    renderSenders(senders) {
        const container = document.getElementById('senders-list');
        
        if (senders.length === 0) {
            container.innerHTML = '<p>No emails found.</p>';
            return;
        }

        container.innerHTML = senders.map(sender => `
            <div class="sender-item" data-email="${sender.email}">
                <div class="sender-header">
                    <input type="checkbox" class="sender-checkbox" id="sender-${sender.email}" 
                           onchange="emailDeleter.toggleSender('${sender.email}')">
                    <div class="sender-info">
                        <div class="sender-name">${this.escapeHtml(sender.sender)}</div>
                        <div class="sender-email">${this.escapeHtml(sender.email)}</div>
                    </div>
                    <div class="email-count">${sender.count} emails</div>
                </div>
                <div class="email-preview">
                    ${sender.messageIds.slice(0, 3).map(msg => `
                        <div class="email-item">
                            <div class="email-subject">${this.escapeHtml(msg.subject)}</div>
                            <div class="email-date">${this.formatDate(msg.date)}</div>
                        </div>
                    `).join('')}
                    ${sender.messageIds.length > 3 ? `<div class="email-item">... and ${sender.messageIds.length - 3} more emails</div>` : ''}
                </div>
            </div>
        `).join('');
    }

    toggleSender(email) {
        const checkbox = document.getElementById(`sender-${email}`);
        const senderItem = document.querySelector(`[data-email="${email}"]`);
        
        if (checkbox.checked) {
            this.selectedSenders.add(email);
            senderItem.classList.add('selected');
        } else {
            this.selectedSenders.delete(email);
            senderItem.classList.remove('selected');
        }
        
        this.updateDeleteButton();
    }

    updateDeleteButton() {
        const deleteBtn = document.getElementById('delete-selected-btn');
        const count = this.selectedSenders.size;
        
        if (count > 0) {
            deleteBtn.textContent = `Delete Emails from ${count} Sender${count > 1 ? 's' : ''}`;
            deleteBtn.disabled = false;
        } else {
            deleteBtn.textContent = 'Delete Selected Emails';
            deleteBtn.disabled = true;
        }
    }

    async deleteSelectedEmails() {
        if (this.selectedSenders.size === 0) {
            alert('Please select at least one sender.');
            return;
        }

        const selectedSendersList = Array.from(this.selectedSenders);
        const totalEmails = selectedSendersList.reduce((total, email) => {
            const sender = this.senders.find(s => s.email === email);
            return total + (sender ? sender.count : 0);
        }, 0);

        const confirmation = confirm(
            `Are you sure you want to delete ${totalEmails} emails from ${selectedSendersList.length} sender(s)?\n\n` +
            `This action cannot be undone!`
        );

        if (!confirmation) return;

        const deleteBtn = document.getElementById('delete-selected-btn');
        deleteBtn.disabled = true;
        deleteBtn.textContent = 'Deleting...';

        try {
            // Collect all message IDs to delete
            const messageIds = [];
            selectedSendersList.forEach(email => {
                const sender = this.senders.find(s => s.email === email);
                if (sender) {
                    messageIds.push(...sender.messageIds.map(msg => msg.id));
                }
            });

            const response = await fetch('/emails/delete', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ messageIds })
            });

            const result = await response.json();
            
            if (result.success) {
                this.showStatus('delete-status', result.message, 'success');
                
                // Remove deleted senders from the list
                this.senders = this.senders.filter(sender => !this.selectedSenders.has(sender.email));
                this.selectedSenders.clear();
                this.renderSenders(this.senders);
                this.updateDeleteButton();
            } else {
                this.showStatus('delete-status', 'Failed to delete emails: ' + result.error, 'error');
            }
        } catch (error) {
            console.error('Delete error:', error);
            this.showStatus('delete-status', 'Failed to delete emails. Please try again.', 'error');
        } finally {
            deleteBtn.disabled = false;
            deleteBtn.textContent = 'Delete Selected Emails';
        }
    }

    showStatus(elementId, message, type) {
        const statusElement = document.getElementById(elementId);
        statusElement.textContent = message;
        statusElement.className = `status ${type}`;
        statusElement.style.display = 'block';
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    formatDate(dateString) {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        } catch {
            return dateString;
        }
    }
}

// Initialize the application
const emailDeleter = new EmailDeleter();
