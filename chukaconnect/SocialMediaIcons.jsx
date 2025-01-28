import React, { memo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faFacebook, 
    faTwitter, 
    faInstagram, 
    faLinkedin 
} from '@fortawesome/free-brands-svg-icons';

const socialLinks = [
    { id: 'facebook', icon: faFacebook, color: '#1877F2' },
    { id: 'twitter', icon: faTwitter, color: '#1DA1F2' },
    { id: 'instagram', icon: faInstagram, color: '#E4405F' },
    { id: 'linkedin', icon: faLinkedin, color: '#0A66C2' }
];

const SocialIcon = memo(({ icon, color }) => (
    <a 
        href={`https://${icon.iconName}.com`}
        target="_blank"
        rel="noopener noreferrer"
        className="social-icon"
    >
        <FontAwesomeIcon icon={icon} style={{ color }} />
    </a>
));

const SocialMediaIcons = () => (
    <div className="social-icons">
        {socialLinks.map(({ id, icon, color }) => (
            <SocialIcon key={id} icon={icon} color={color} />
        ))}
    </div>
);

// Minimized CSS with smaller icon sizes
const css = `
.social-icons {
    display: flex;
    gap: 6px;
    padding: 2px;
}
.social-icon svg {
    width: 10px;
    height: 10px;
}
.social-icon {
    padding: 2px;
}
@media (max-width: 768px) {
    .social-icon svg {
        width: 8px;
        height: 8px;
    }
    .social-icons {
        gap: 4px;
    }
}`;

// Only inject styles if not already present
if (!document.getElementById('social-icons-styles')) {
    const style = document.createElement('style');
    style.id = 'social-icons-styles';
    style.textContent = css;
    document.head.appendChild(style);
}

export default memo(SocialMediaIcons); 