// Floating social bar, fixed to the left on every page. Links are placeholders
// ("#") for now — swap the href values when the accounts are ready.
const ICONS = {
  x: <path d="M18.9 2H22l-7.5 8.6L23 22h-6.8l-5.3-6.9L4.8 22H1.7l8-9.2L1 2h6.9l4.8 6.3L18.9 2zm-1.2 18h1.9L7.1 4H5.1l12.6 16z" />,
  facebook: <path d="M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.2c-1.2 0-1.6.8-1.6 1.5V12h2.7l-.4 2.9h-2.3v7A10 10 0 0 0 22 12z" />,
  linkedin: <path d="M4.98 3.5A2.5 2.5 0 1 1 0 3.51a2.5 2.5 0 0 1 4.98-.01zM.2 8h4.6v13H.2zm7.5 0h4.4v1.8h.06c.61-1.1 2.1-2.27 4.3-2.27 4.6 0 5.45 3 5.45 6.9V21h-4.6v-5.78c0-1.38-.03-3.15-1.92-3.15-1.92 0-2.22 1.5-2.22 3.05V21H7.7z" />,
  instagram: <><rect x="2.5" y="2.5" width="19" height="19" rx="5.5" fill="none" stroke="currentColor" strokeWidth="2" /><circle cx="12" cy="12" r="4.4" fill="none" stroke="currentColor" strokeWidth="2" /><circle cx="17.6" cy="6.4" r="1.3" /></>,
  youtube: <path d="M23 12s0-3.2-.4-4.7a2.5 2.5 0 0 0-1.77-1.77C19.26 5 12 5 12 5s-7.26 0-8.83.53A2.5 2.5 0 0 0 1.4 7.3C1 8.8 1 12 1 12s0 3.2.4 4.7a2.5 2.5 0 0 0 1.77 1.77C4.74 19 12 19 12 19s7.26 0 8.83-.53A2.5 2.5 0 0 0 22.6 16.7C23 15.2 23 12 23 12zM9.75 15.27V8.73L15.5 12z" />,
};

const LINKS = [["x", "X"], ["facebook", "Facebook"], ["linkedin", "LinkedIn"], ["instagram", "Instagram"], ["youtube", "YouTube"]];

export default function SocialBar() {
  return (
    <div className="social-bar" aria-label="Social media">
      {LINKS.map(([key, label]) => (
        <a key={key} className="social-btn" href="#" aria-label={label} target="_blank" rel="noopener noreferrer">
          <svg viewBox="0 0 24 24" fill="currentColor">{ICONS[key]}</svg>
        </a>
      ))}
    </div>
  );
}
