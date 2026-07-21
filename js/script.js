// ============================================
// CONFIGURATION
// ============================================
const EMAILJS_CONFIG = {
    enabled: true,
    publicKey: 'RBGtSiNwMHb-dalAk',
    serviceID: 'service_c2u5sb8',
    templateID: 'template_xh6jzrv'
};

const FORMSPREE_CONFIG = {
    enabled: false,
    endpoint: 'https://formspree.io/f/YOUR_FORM_ID'
};

const OWNER_EMAIL = 'Corelinkcontainers@gmail.com';

// Initialize EmailJS if configured
if (EMAILJS_CONFIG.enabled && typeof emailjs !== 'undefined') {
    emailjs.init(EMAILJS_CONFIG.publicKey);
}

// Show setup info if no email service configured
document.addEventListener('DOMContentLoaded', () => {
    const setupInfo = document.getElementById('setupInfo');
    if (setupInfo && !EMAILJS_CONFIG.enabled && !FORMSPREE_CONFIG.enabled) {
        setupInfo.style.display = 'block';
    }

    // Pre-fill interest field if coming from solutions page
    const inquiryType = sessionStorage.getItem('inquiryType');
    if (inquiryType) {
        const interestField = document.getElementById('interest');
        if (interestField) {
            interestField.value = inquiryType;
            sessionStorage.removeItem('inquiryType');
        }
    }

    // Highlight active nav link
    highlightCurrentPage();
});

// ============================================
// NAVIGATION
// ============================================
function navigateTo(page) {
    window.location.href = page;
}

function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function highlightCurrentPage() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('.nav-links a');

    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPage) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

// ============================================
// INQUIRY FUNCTIONS (Solutions Page)
// ============================================
function inquireAbout(type) {
    sessionStorage.setItem('inquiryType', type);
    window.location.href = 'contact.html';
}

// ============================================
// FORM SUBMISSION (Contact Page)
// ============================================
async function handleFormSubmit(e) {
    if (e) e.preventDefault();

    const nameField = document.getElementById('name');
    const emailField = document.getElementById('email');
    const interestField = document.getElementById('interest');
    const messageField = document.getElementById('message');
    const submitBtn = document.getElementById('submitBtn');
    const spinner = document.getElementById('spinner');

    if (!nameField || !emailField) return false;

    const name = nameField.value.trim();
    const email = emailField.value.trim();
    const interest = interestField ? interestField.value.trim() : '';
    const message = messageField ? messageField.value.trim() : '';

    // Hide previous messages
    hideMessages();

    // Validate
    if (!name || !email) {
        showError('⚠️ Please fill in your name and email.');
        return false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showError('📧 Please enter a valid email address.');
        return false;
    }

    // Show loading
    if (submitBtn) submitBtn.disabled = true;
    if (spinner) spinner.style.display = 'block';
    if (submitBtn) submitBtn.querySelector('i').style.display = 'none';

    let emailSent = false;

    // Try EmailJS
    if (EMAILJS_CONFIG.enabled) {
        try {
            await emailjs.send(
                EMAILJS_CONFIG.serviceID,
                EMAILJS_CONFIG.templateID,
                {
                    from_name: name,
                    from_email: email,
                    interest: interest || 'N/A',
                    message: message || 'N/A',
                    reply_to: email,
                    to_email: OWNER_EMAIL
                }
            );
            emailSent = true;
        } catch (err) {
            console.error('EmailJS error:', err);
        }
    }

    // Try Formspree
    if (!emailSent && FORMSPREE_CONFIG.enabled) {
        try {
            const fd = new FormData();
            fd.append('name', name);
            fd.append('email', email);
            fd.append('interest', interest);
            fd.append('message', message);

            const response = await fetch(FORMSPREE_CONFIG.endpoint, {
                method: 'POST',
                body: fd,
                headers: { 'Accept': 'application/json' }
            });

            if (response.ok) emailSent = true;
        } catch (err) {
            console.error('Formspree error:', err);
        }
    }

    // Fallback to mailto
    if (!EMAILJS_CONFIG.enabled && !FORMSPREE_CONFIG.enabled) {
        // Save to localStorage
        const inquiries = JSON.parse(localStorage.getItem('corelink_inquiries') || '[]');
        inquiries.push({ name, email, interest, message, timestamp: new Date().toISOString() });
        localStorage.setItem('corelink_inquiries', JSON.stringify(inquiries));

        // Open email client with Corelinkcontainers@gmail.com
        const subject = `Container Inquiry: ${interest || 'General'}`;
        const body = `Name: ${name}%0D%0AEmail: ${email}%0D%0AInterest: ${interest || 'N/A'}%0D%0AMessage: ${message || 'N/A'}%0D%0A%0D%0ASent from CORELINK website`;
        window.location.href = `mailto:${OWNER_EMAIL}?subject=${subject}&body=${body}`;

        setTimeout(() => showSuccess('📧 Email client opened. Please send to complete your inquiry.'), 500);
    } else if (emailSent) {
        showSuccess(`✅ Thanks ${name}! Corelink will contact you within 24h.`);
        document.getElementById('contactForm').reset();
    } else {
        showError('❌ Failed to send. Please contact us directly at ' + OWNER_EMAIL);
    }

    // Reset button
    if (spinner) spinner.style.display = 'none';
    if (submitBtn) {
        submitBtn.querySelector('i').style.display = 'inline-block';
        submitBtn.disabled = false;
    }

    return false;
}

// ============================================
// MESSAGE HELPERS
// ============================================
function showSuccess(msg) {
    const errorMsg = document.getElementById('errorMessage');
    const successMsg = document.getElementById('successMessage');
    const successText = document.getElementById('successText');

    if (errorMsg) errorMsg.style.display = 'none';
    if (successText) successText.textContent = msg;
    if (successMsg) successMsg.style.display = 'block';

    setTimeout(() => {
        if (successMsg) successMsg.style.display = 'none';
    }, 6000);
}

function showError(msg) {
    const successMsg = document.getElementById('successMessage');
    const errorMsg = document.getElementById('errorMessage');
    const errorText = document.getElementById('errorText');

    if (successMsg) successMsg.style.display = 'none';
    if (errorText) errorText.textContent = msg;
    if (errorMsg) errorMsg.style.display = 'block';

    setTimeout(() => {
        if (errorMsg) errorMsg.style.display = 'none';
    }, 4000);
}

function hideMessages() {
    const successMsg = document.getElementById('successMessage');
    const errorMsg = document.getElementById('errorMessage');
    if (successMsg) successMsg.style.display = 'none';
    if (errorMsg) errorMsg.style.display = 'none';
}

// ============================================
// TOAST NOTIFICATION
// ============================================
function showToast(msg) {
    const toast = document.createElement('div');
    toast.textContent = msg;
    toast.style.cssText = `
    position: fixed; top: 80px; right: 15px;
    background: #1f2a2e; color: #fff;
    padding: 0.8rem 1.2rem; border-radius: 25px;
    font-weight: 500; z-index: 1000; font-size: 0.85rem;
    animation: slideIn 0.5s ease, fadeOut 0.5s ease 2.5s forwards;
    box-shadow: 0 8px 20px rgba(0,0,0,0.3);
    border-left: 4px solid #e67e22;
    max-width: 90vw;
  `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// ============================================
// SCROLL EVENTS
// ============================================
window.addEventListener('scroll', () => {
    const backToTop = document.getElementById('backToTop');
    if (backToTop) {
        backToTop.classList.toggle('visible', window.pageYOffset > 400);
    }
});

// ============================================
// CARD ANIMATIONS
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    const cards = document.querySelectorAll('.solution-card');

    if (cards.length > 0) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = 1;
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, { threshold: 0.1 });

        cards.forEach(card => {
            card.style.opacity = 0;
            card.style.transform = 'translateY(20px)';
            card.style.transition = 'all 0.5s ease';
            observer.observe(card);

            setTimeout(() => {
                if (card.getBoundingClientRect().top < window.innerHeight) {
                    card.style.opacity = 1;
                    card.style.transform = 'translateY(0)';
                }
            }, 100);
        });
    }
});

// ============================================
// KEYBOARD SHORTCUTS
// ============================================
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') scrollToTop();
    if (e.key === '1') navigateTo('index.html');
    if (e.key === '2') navigateTo('solutions.html');
    if (e.key === '3') navigateTo('contact.html');
});

// ============================================
// INITIALIZATION
// ============================================
console.log('🏗️ CORELINK – WE MOVE IT. WE BUILD IT. WE DELIVER IT.');
console.log('📧 Owner Email: Corelinkcontainers@gmail.com');
console.log('💡 Shortcuts: 1=Home, 2=Solutions, 3=Contact, Esc=Top');