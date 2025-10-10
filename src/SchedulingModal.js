import React from 'react';
import './SchedulingModal.css';

function SchedulingModal({ isOpen, onClose, builderInfo, propertyInfo }) {

  if (!isOpen) return null;

  const handleWhatsAppContact = () => {
    // Check if phone number is still loading
    if (builderInfo.phone === 'Loading...') {
      alert('Phone number is still being loaded. Please wait a moment and try again.');
      return;
    }
    
    // Extract phone number and format it properly
    const phoneNumber = builderInfo.phone.replace(/\D/g, ''); // Remove all non-digits
    
    if (!phoneNumber || phoneNumber === '') {
      alert('Builder phone number is not available');
      return;
    }

    const message = `Hi ${builderInfo.name}, 

I'm interested in scheduling a viewing for the property "${propertyInfo.title}" located at ${propertyInfo.location}.

Could we arrange a convenient time to discuss this property and schedule a viewing?

Looking forward to hearing from you.

Best regards`;
    
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  const handlePhoneCall = () => {
    // Check if phone number is still loading
    if (builderInfo.phone === 'Loading...') {
      alert('Phone number is still being loaded. Please wait a moment and try again.');
      return;
    }
    
    if (!builderInfo.phone || builderInfo.phone === 'Not available') {
      alert('Builder phone number is not available');
      return;
    }
    
    window.open(`tel:${builderInfo.phone}`, '_self');
  };

  const handleGoogleMeet = () => {
    // Generate a unique meeting ID for Google Meet
    const meetingId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const meetUrl = `https://meet.google.com/${meetingId}`;

    const eventDetails = {
      title: `Property Viewing - ${propertyInfo.title}`,
      description: `Property viewing appointment for ${propertyInfo.title} at ${propertyInfo.location}.

Builder Contact Information:
- Name: ${builderInfo.name}
- Email: ${builderInfo.email}
- Phone: ${builderInfo.phone}

Google Meet Link: ${meetUrl}

Please schedule a convenient time and join the Google Meet to discuss this property.`,
      location: meetUrl
    };

    // Create Google Calendar URL for scheduling
    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(eventDetails.title)}&details=${encodeURIComponent(eventDetails.description)}&location=${encodeURIComponent(eventDetails.location)}`;
    
    window.open(googleCalendarUrl, '_blank');
    onClose();
  };

  return (
    <div className="scheduling-modal-overlay" onClick={onClose}>
      <div className="scheduling-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Contact Builder</h2>
          <button className="close-button" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-content">
          <div className="contact-options">
            <h3>Contact Builder</h3>
            <div className="contact-buttons">
              <button 
                className="contact-btn whatsapp-btn"
                onClick={handleWhatsAppContact}
                disabled={!builderInfo.phone || builderInfo.phone === 'Loading...'}
              >
                <i className="fab fa-whatsapp"></i>
                <span>WhatsApp</span>
                <small>{builderInfo.phone === 'Loading...' ? 'Loading...' : 'Send message'}</small>
              </button>
              
              <button 
                className="contact-btn phone-btn"
                onClick={handlePhoneCall}
                disabled={!builderInfo.phone || builderInfo.phone === 'Loading...'}
              >
                <i className="fas fa-phone"></i>
                <span>Call Now</span>
                <small>{builderInfo.phone === 'Loading...' ? 'Loading...' : 'Direct call'}</small>
              </button>

               <button 
                 className="contact-btn meet-btn"
                 onClick={handleGoogleMeet}
               >
                 <i className="fab fa-google"></i>
                 <span>Google Meet</span>
                 <small>Schedule meeting</small>
               </button>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
}

export default SchedulingModal;