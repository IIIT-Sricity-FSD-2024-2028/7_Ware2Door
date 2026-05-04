const API = 'http://localhost:8000';

window.addEventListener('scroll', () => {
    const h = document.getElementById('main-header');
    h.classList.toggle('scrolled', window.scrollY > 50);
});

document.getElementById('submit-btn').addEventListener('click', async () => {
    const val = document.getElementById('tracking-id').value.trim().toUpperCase();
    const cat = document.getElementById('issue-cat').value;
    const desc = document.getElementById('description').value.trim();

    if (!val) {
        showAlert('Please enter your Tracking ID.');
        return;
    }
    if (!desc) {
        showAlert('Please describe your issue.');
        return;
    }

    try {
        const res = await fetch(`${API}/tickets/raise`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ trackingId: val, category: cat || 'General', description: desc })
        });
        const result = await res.json();

        if (result.error) {
            showAlert(result.error);
            return;
        }

        const toast = document.getElementById('success-toast');
        const text = document.getElementById('success-text');
        const category = cat || 'General';
        text.textContent = `✓ Ticket for ${val} (${category}) has been raised. We'll update you within 4 hours.`;
        toast.classList.add('show');
        document.getElementById('tracking-id').value = '';
        document.getElementById('description').value = '';
        document.getElementById('issue-cat').value = '';
        setTimeout(() => toast.classList.remove('show'), 6000);
    } catch (e) {
        showAlert('Could not connect to server. Please try again.');
    }
});

function showAlert(msg) {
    const toast = document.getElementById('success-toast');
    const text = document.getElementById('success-text');
    toast.classList.add('error');
    text.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
        toast.classList.remove('error');
    }, 4000);
}